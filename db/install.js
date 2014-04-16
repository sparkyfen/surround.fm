var settings = require('../lib/config/config');
var nano = require('nano')(settings.couchdb.url);
var userView = require('./users/views.json');
var colors = require('colors');
nano.db.create(settings.couchdb.users, function (err, body) {
  if(err && err.status_code !== 412) {
    console.log(err);
    return;
  }
  var users = nano.db.use(settings.couchdb.users);
  // Insert views to make lookup calls with.
  users.insert(userView, '_design/users', function (err) {
    // 409 is Document update conflict.
    if(err && err.status_code !== 409) {
      console.log('Error recreating database.'.red);
      console.log(err);
      return;
    }
    console.log('DB Installation successful.'.green);
  });
});