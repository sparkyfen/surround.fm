'use strict';

var nano = require('nano')('http://localhost:5984');
var LastFmNode = require('lastfm').LastFmNode;
var config = require('../config/config');
var lastfm = new LastFmNode({
  api_key: config.lastfm.api_key,
  secret: config.lastfm.secret,
  useragent: config.lastfm.useragent
});
var userDB = nano.db.use('users');
var validator = require('validator');
var bcrypt = require('bcrypt');

exports.login = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var rememberMe = req.body.rememberMe;
  if(validator.isNull(username) || validator.isNull(password)) {
    return res.json(400, {message: 'Missing username/password.'});
  }
  if(validator.isNull(rememberMe)) {
    return res.json(400, {message: 'Cannot sign in user.'});
  }
  rememberMe = validator.toBoolean(rememberMe, true);
  userDB.get(username, { revs_info: true }, function (error, user) {
    if(error && error.status_code === 404) {
      return res.json(404, {message: 'User does not exist.'});
    } else if(error) {
      console.log(error);
      return res.json(500, {message: 'Could not login, please try again later.'});
    }
    delete user._revs_info;
    delete user._rev;
    bcrypt.compare(password, user.password, function (error, passwordValid) {
      if(error) {
        console.log(error);
        return res.json(500, {message: 'Could not login, please try again later.'});
      }
      if(!passwordValid) {
        return res.json(400, {message: 'Wrong password.'});
      }
      if(rememberMe) {
        req.session.user_id = user._id;
      }
      delete user.password;
      return res.json({message: 'Logged in.', user: user});
    });
  });
};

exports.register = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  var email = req.body.email;
  var confirmEmail = req.body.confirmEmail;
  if(!validator.isEmail(email) || !validator.isEmail(confirmEmail)) {
    return res.json(400, {message: 'Invalid email.'});
  }
  if(validator.isNull(username)) {
    return res.json(400, {message: 'Missing username.'});
  }
  if(validator.isNull(password) || validator.isNull(confirmPassword)) {
    return res.json(400, {message: 'Missing password.'});
  }
  if(password !== confirmPassword) {
    return res.json(400, {message: 'Passwords don\'t match.'});
  }
  bcrypt.genSalt(10, function (error, salt) {
    if(error) {
      console.log(error);
      return res.json(500, {message: 'Could not register user, please try again later.'});
    }
    bcrypt.hash(password, salt, function (error, hash) {
      if(error) {
        console.log(error);
        return res.json(500, {message: 'Could not register user, please try again later.'});
      }
      var user = {
        password: hash,
        email: email,
        friends: [],
        lastfm: {}
      };
      userDB.head(username, function (error, _, headers) {
        if(headers && headers['status-code'] === 200) {
          return res.json(400, {message: 'User already exists.'});
        } else if(error && error.status_code === 404) {
          userDB.insert(user, username, function (error, body) {
            if(error) {
              console.log('userDB.insert');
              console.log(error);
              return res.json(500, {message: 'Could not register user, please try again later.'});
            }
            console.log(body);
            return res.json({message: 'Registered.'});
          });
        } else {
          console.log('userDB.head');
          console.log(error);
          return res.json(500, {message: 'Could not register user, please try again later.'});
        }
      });
    });
  });
};

exports.changePassword = function(req, res) {
  if(!req.session.user_id) {
    return res.redirect(401, {message: 'Please sign in.'});
  }
  var oldPassword = req.body.oldPassword;
  var newPassword = req.body.newPassword;
  var newConfirmPassword = req.body.newConfirmPassword;
  if(validator.isNull(oldPassword)) {
    return res.json(400, {message: 'Missing old password.'});
  }
  if(validator.isNull(newPassword) || validator.isNull(newConfirmPassword)) {
    return res.json(400, {message: 'Missing new password(s).'});
  }
  if(newPassword !== newConfirmPassword) {
    return res.json(400, {message: 'New password don\'t match.'});
  }
  var username = req.session.user_id;
  userDB.get(username, function (error, user) {
    if(error && error.status_code === 404) {
      return res.json(404, {message: 'User does not exist.'});
    } else if(error) {
      console.log(error);
      return res.json(500, {message: 'Could not change your password, please try again later.'});
    }
    bcrypt.compare(newPassword, user.password, function (error, passwordValid) {
      if(error) {
        console.log(error);
        return res.json(500, {message: 'Could not change your password, please try again later.'});
      }
      if(passwordValid) {
        return res.json(400, {message: 'Cannot use old password as new password.'});
      }
      bcrypt.compare(oldPassword, user.password, function (error, passwordValid) {
        if(error) {
          console.log(error);
          return res.json(500, {message: 'Could not login, please try again later.'});
        }
        if(!passwordValid) {
          return res.json(400, {message: 'Wrong old password.'});
        }
        bcrypt.genSalt(10, function (error, salt) {
          if(error) {
            console.log(error);
            return res.json(500, {message: 'Could not change your password, please try again later.'});
          }
          bcrypt.hash(newPassword, salt, function (error, hash) {
            if(error) {
              console.log(error);
              return res.json(500, {message: 'Could not change your password, please try again later.'});
            }
            user.password = hash;
            userDB.insert(user, username, function (error, body) {
              if(error) {
                console.log('userDB.insert');
                console.log(error);
                return res.json(500, {message: 'Could not change your password, please try again later.'});
              }
              if(body.ok) {
                return res.json({message: 'Password changed.'});
              } else {
                console.log(body);
                return res.json(500, {message: 'Could not change your password, please try again later.'});
              }
            });
          });
        });
      });
    });
  });
};

exports.logout = function(req, res) {
  delete req.session.user_id;
  req.session.destroy(function () {
    return res.json({message: 'Logged out.'});
  });
};

exports.linkAccounts = function(req, res) {
  if(!req.session.user_id) {
    return res.json(401, {message: 'Please sign in.'});
  }
  var lastFmUser = req.body.lastFmUser;
  if(validator.isNull(lastFmUser)) {
    return res.json(400, {message: 'Missing Last.FM username.'});
  }
  var username = req.session.user_id;
  userDB.get(username, function (error, user) {
    if(error && error.status_code === 404) {
      return res.json(404, {message: 'User does not exist.'});
    } else if(error) {
      console.log(error);
      return res.json(500, {message: 'Could not link accounts, please try again later.'});
    }
    if(user.lastfm.name && user.lastfm.id) {
      return res.json(400, {message: 'Already linked accounts.'});
    }
    lastfm.request('user.getInfo', {
      user: lastFmUser,
      handlers: {
        success: function(lastfmData) {
          user.lastfm.name = lastfmData.user.name;
          user.lastfm.id = lastfmData.user.id;
          userDB.insert(user, username, function (error, body) {
            if(error) {
              console.log('userDB.insert');
              console.log(error);
              return res.json(500, {message: 'Could not link accounts, please try again later.'});
            }
            if(body.ok) {
              return res.json({message: 'Accounts linked.'});
            } else {
              console.log(body);
              return res.json(500, {message: 'Could not link accounts, please try again later.'});
            }
          });
        },
        error: function(error) {
          if(error.code === 6) {
            return res.json(400, {message: error.message});
          } else {
            console.log(error);
            return res.json(400, {message: 'Could not link accounts, please try again later.'});
          }
        }
      }
    });
  });
};

// Lookup friend and add them to friends.
exports.addFriend = function(req, res) {
  if(!req.session.user_id) {
    return res.json(401, {message: 'Please sign in.'});
  }
  var friendName = req.body.friendName;
  if(validator.isNull(friendName)) {
    return res.json(400, {message: 'Missing friend name.'});
  }
  var username = req.session.user_id;
  userDB.head(friendName, function (error, _, headers) {
    if(error && error.status_code === 404) {
      return res.json(400, {message: 'Friend does not exist.'});
    } else if(headers && headers['status-code'] === 200) {
      userDB.get(username, function (error, user) {
        if(error && error.status_code === 404) {
          return res.json(404, {message: 'User does not exist.'});
        } else if(error) {
          console.log(error);
          return res.json(500, {message: 'Could add friend, please try again later.'});
        }
        user.friends.push(friendName);
        userDB.insert(user, username, function (error, body) {
          if(error) {
            console.log('userDB.insert');
            console.log(error);
            return res.json(500, {message: 'Could add friend, please try again later.'});
          }
          if(body.ok) {
            return res.json({message: 'Friend added.'});
          } else {
            console.log(body);
            return res.json(500, {message: 'Could add friend, please try again later.'});
          }
        });
      });
    } else {
      console.log('userDB.head');
      console.log(error);
      return res.json(500, {message: 'Could add friend, please try again later.'});
    }
  });
};

exports.deleteFriend = function(req, res) {
  if(!req.session.user_id) {
    return res.json(401, {message: 'Please sign in.'});
  }
  var friendName = req.body.friendName;
  if(validator.isNull(friendName)) {
    return res.json(400, {message: 'Missing friend name.'});
  }
  var username = req.session.user_id;
  userDB.head(friendName, function (error, _, headers) {
    if(error && error.status_code === 404) {
      return res.json(400, {message: 'Friend does not exist.'});
    } else if(headers && headers['status-code'] === 200) {
      userDB.get(username, function (error, user) {
        if(error && error.status_code === 404) {
          return res.json(404, {message: 'User does not exist.'});
        } else if(error) {
          console.log(error);
          return res.json(500, {message: 'Could delet friend, please try again later.'});
        }
        var deleted = false;
        for(var friendCounter = 0; friendCounter < user.friends.length; friendCounter++) {
          if(user.friends[friendCounter] === friendName) {
            user.friends.splice(friendCounter, 1);
            deleted = true;
          }
        }
        if(!deleted) {
          return res.json(500, {message: 'User is not your friend, could not delete.'});
        }
        userDB.insert(user, username, function (error, body) {
          if(error) {
            console.log('userDB.insert');
            console.log(error);
            return res.json(500, {message: 'Could delete friend, please try again later.'});
          }
          if(body.ok) {
            return res.json({message: 'Friend deleted.'});
          } else {
            console.log(body);
            return res.json(500, {message: 'Could delete friend, please try again later.'});
          }
        });
      });
    } else {
      console.log('userDB.head');
      console.log(error);
      return res.json(500, {message: 'Could delete friend, please try again later.'});
    }
  });
};

exports.searchFriends = function(req, res) {
  if(!req.session.user_id) {
    return res.json(401, {message: 'Please sign in.'});
  }
  var query = req.query.q;
  if(validator.isNull(query)) {
    return res.json(400, {message: 'Missing query.'});
  }
  userDB.view('users', 'by_user', {reduce: false, startkey: query, endkey: query + '\u9999'}, function(err, body) {
    if (err) {
      console.log(err);
      return res.json({results: [], message: 'No results found.'});
    } else if(body.rows.length === 0) {
      return res.json({results: [], message: 'No results found.'});
    } else {
      return res.json({results: body.rows});
    }
  });
};