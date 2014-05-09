'use strict';
var request = require('supertest');
var assert = require('assert');
var colors = require('colors');
var bcrypt = require('bcrypt');
var config = require('../../../lib/config/config');
var nano = require('nano')(config.couchdb.url);

var app = require('../../../server');

function _register(callback) {
  request(app)
  .post('/api/register')
  .send({username: 'mockUser', password: 'waffles', confirmPassword: 'waffles', email: 'mockUser@gmail.com', confirmEmail: 'mockUser@gmail.com'})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    if(err) {
      console.error(res.body.message.red);
      return callback(err);
    }
    assert.equal(res.body.message, 'Registered.');
    callback();
  });
}

function _login(username, callback) {
  request(app)
  .post('/api/login')
  .send({username: username, password: 'waffles', rememberMe: true})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function (err, res) {
    if(err) {
      console.error(res.body.message.red);
      return callback(err);
    }
    var cookie = res.headers['set-cookie'];
    assert.equal(res.body.message, 'Logged in.');
    assert.equal(res.body._id, testUser.id);
    callback(null, cookie);
  });
}

describe('Surround.FM API', function () {
  var usersView = require('../../../db/users/views');
  var testUser = require('./user');
  var testUser2 = require('./user2');
  var cookie;
  beforeEach(function (done) {
    nano.db.destroy(config.couchdb.users, function (err) {
    if(err && err.status_code !== 404) return done(err);
    // Create users database
    nano.db.create(config.couchdb.users, function (err) {
      if(err) return done(err);
      var users = nano.db.use(config.couchdb.users);
      bcrypt.hash('waffles', 10, function (error, hash) {
        if(error) return done(error);
        testUser.password = hash;
        // Insert mock user
        users.insert(testUser, testUser.id, function (err) {
          if(err) return done(err);
          users.insert(testUser2, testUser2.id, function (err) {
          if(err) return done(err);
            // Insert views to make lookup calls with
            users.insert(usersView, '_design/users', function (err) {
              if(err) return done(err);
                _login('joeshmo', function (err, loginCookie) {
                  if(err) {
                    return done(err);
                  }
                  cookie = loginCookie;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });
  describe('User API', function () {
    describe('POST /api/register', function () {
      describe('when registering a user', function () {
        it('should successfully register a user', function (done) {
          _register(function (err) {
            if(err) {
              return done(err);
            }
            done();
          });
        });
      });
    });
    describe('POST /api/changePassword', function () {
      describe('when changing a user\'s password', function () {
        it('should successfully change a user\'s password', function (done) {
          request(app)
          .post('/api/changePassword')
          .send({oldPassword: 'waffles', newPassword: 'waffles123', newConfirmPassword: 'waffles123'})
          .expect('Content-Type', /json/)
          .set('cookie', cookie)
          .expect(200)
          .end(function (err, res) {
            if(err) {
              console.error(res.body.message.red);
              return done(err);
            }
            assert.equal(res.body.message, 'Password changed.');
            done();
          });
        });
      });
    });
  });
  describe('GET /api/logout', function () {
    describe('when logging a user out', function () {
      it('should successfully log the user out', function (done) {
        request(app)
        .get('/api/logout')
        .expect('Content-Type', /json/)
        .set('cookie', cookie)
        .expect(200)
        .end(function (err, res) {
          if(err) {
            console.log(res.body.message.red);
            return done(err);
          }
          assert.equal(res.body.message, 'Logged out.');
          done();
        });
      });
    });
  });
  /* Cannot run this test because it calls Last.FM and needs client/secret api kets.
  describe('POST /api/linkAccounts', function () {
    describe('when linking the user account to the Last.fm Account', function () {
      it('should successfully link the user accounts', function (done) {
        request(app)
        .post('/api/linkAccounts')
        .send({lastFmUser: 'test'})
        .expect('Content-Type', /json/)
        .set('cookie', cookie)
        .expect(200)
        .end(function (err, res) {
          if(err) {
            console.log(res.body.message.red);
            return done(err);
          }
          assert.equal(res.body.message, 'Accounts linked.');
          done();
        });
      });
    });
  });*/
  describe('POST /api/addFriend', function () {
    describe('when adding a friend to your friend\'s list', function () {
      it('should successfully add the friend to your list.', function () {
        _register(function (err) {
          if(err) {
            return done(err);
          }
          request(app)
          .post('/api/addFriend')
          .send({friendName: 'mockUser'})
          .expect('Content-Type', /json/)
          .set('cookie', cookie)
          .expect(200)
          .end(function (err, res) {
            if(err) {
              console.log(res.body.message.red);
              return done(err);
            }
            assert.equal(res.body.message, 'Friend added.');
            done();
          });
        });
      });
    });
  });
  describe('POST /api/deleteFriend', function () {
    describe('when deleting a friend from your friend\'s list', function () {
      it('should successfully delete the friend from your list', function () {
        _login('mockUser', function (err, loginCookie) {
          if(err) {
            return done(err);
          }
          request(app)
          .post('/api/deleteFriend')
          .send({friendName: 'joeshmo'})
          .expect('Content-Type', /json/)
          .set('cookie', loginCookie)
          .expect(200)
          .end(function (err, res) {
            if(err) {
              console.log(res.body.message.red);
              return done(err);
            }
            assert.equal(res.body.message, 'Friend deleted.');
            done();
          });
        });
      });
    });
  });
});