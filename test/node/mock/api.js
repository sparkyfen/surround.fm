'use strict';
var request = require('supertest');
var assert = require('assert');
var colors = require('colors');
var bcrypt = require('bcrypt');
var config = require('../../../lib/config/config');
var nano = require('nano')(config.couchdb.url);

var app = require('../../../server');

describe('Surround.FM API', function () {
  var usersView = require('../../../db/users/views');
  var testUser = require('./user');
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
          // Insert views to make lookup calls with
          users.insert(usersView, '_design/users', function (err) {
            if(err) return done(err);
              request(app)
              .post('/api/login')
              .send({username: 'joeshmo', password: 'waffles', rememberMe: true})
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function (err, res) {
                if(err) {
                  console.error(res.body.message.red);
                  return done(err);
                }
                cookie = res.headers['set-cookie'];
                assert.equal(res.body.message, 'Logged in.');
                assert.equal(res.body.user._id, testUser.id);
                done();
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
          request(app)
          .post('/api/register')
          .send({username: 'mockUser', password: 'waffles', confirmPassword: 'waffles', email: 'mockUser@gmail.com', confirmEmail: 'mockUser@gmail.com'})
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function (err, res) {
            if(err) {
              console.error(res.body.message.red);
              return done(err);
            }
            assert.equal(res.body.message, 'Registered.');
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
  })
});