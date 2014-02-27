'use strict';

var express = require('express'),
    path = require('path'),
    config = require('./config'),
    RedisStore = require('connect-redis')(express);

/**
 * Express configuration
 */
module.exports = function(app) {
  app.configure('development', function(){
    app.use(require('connect-livereload')());

    // Disable caching of scripts for easier testing
    app.use(function noCache(req, res, next) {
      if (req.url.indexOf('/scripts/') === 0) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', 0);
      }
      next();
    });

    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'app')));
    app.use(express.errorHandler());
    app.set('views', config.root + '/app/views');
  });

  app.configure('production', function(){
    app.use(express.favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('views', config.root + '/views');
  });

  app.configure(function(){
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser("jQAsjZAlK8QF4KDFsRSv9rajf4UckeKbyKdKWRwSwKmR3vD5QsTvE4wUM55CVt2b"));
    app.use(express.session({
      store: new RedisStore(), // Can be configured with db, user, etc
      proxy: true, // Trust the reverse proxy when setting secure cookies
      cookie: {
        secure: false, // Important! Otherwise you'll get Forbidden 403
        maxAge: 604800, //1 week
        httpOnly: true
      }
    }));
    app.use(function (req, res, next) {
      // POSTS send an OPTIONS request first so let's make sure we handle those
      res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
      next();
    });
    // Router needs to be last
    app.use(app.router);
  });
};