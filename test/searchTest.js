var nano = require('nano')('http://localhost:5984');
var userDB = nano.db.use('users');
userDB.view('users', 'by_user', {reduce: false, startkey: '', endkey: '\u9999'}, function(err, body) {
  if (!err) {
    body.rows.forEach(function(doc) {
        console.log(doc);
    });
  } else {
    console.log(err);
  }
});