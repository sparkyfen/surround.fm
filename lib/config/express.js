'use strict';

var express = require('express'),
    path = require('path'),
    config = require('./config'),
    helmet = require('helmet'),
    multiparty = require('multiparty'),
    RedisStore = require('connect-redis')(express);

/**
 * Express configuration
 */
module.exports = function(app) {
  var scriptSrc, connectSrc, styleSrc, imgSrc, fontSrc;
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
    styleSrc = [
      "'self'",
      "'unsafe-inline'",
      "http://fonts.googleapis.com"
    ];
    scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "http://www.google-analytics.com",
      config.url,
      'http://localhost:35729',
      "'unsafe-eval'",
      "http://maps.googleapis.com",
      "http://maps.gstatic.com",
      "http://mt0.googleapis.com",
      "http://mt1.googleapis.com"
    ];
    imgSrc = [
      "'self'",
      "data:",
      "http://placehold.it",
      "http://maps.googleapis.com",
      "http://maps.gstatic.com",
      "http://mt.googleapis.com",
      "http://mt0.googleapis.com",
      "http://mt1.googleapis.com",
      "http://csi.gstatic.com"
    ];
    fontSrc = [
      "'self'",
      "http://themes.googleusercontent.com"
    ];
    connectSrc = ["'self'", "ws://localhost:35729"];
  });

  app.configure('production', function(){
    app.use(express.favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('views', config.root + '/views');
    styleSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ];
    scriptSrc = [
      "'self'",
      "'unsafe-inline'",
      "https://www.google-analytics.com",
      config.url,
      "'unsafe-eval'",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "https://mts0.googleapis.com",
      "https://mts1.googleapis.com"
    ];
    imgSrc = [
      "'self'",
      "data:",
      "https://www.google-analytics.com",
      "http://placehold.it",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "https://mts.googleapis.com",
      "https://mts0.googleapis.com",
      "https://mts1.googleapis.com",
      "https://csi.gstatic.com"
    ];
    fontSrc = [
      "'self'",
      "https://themes.googleusercontent.com"
    ];
    connectSrc = ["'self'"];
  });

  app.configure(function(){
    var maxAge = 7 * 24 * 60 * 60 * 1000;//1 week
    app.engine('html', require('ejs').renderFile);
    app.set('view engine', 'html');
    app.use(express.logger('dev'));
    app.use(function (req, res, next) {
      if(req.method === 'POST' && req.headers['content-type'].indexOf("multipart/form-data") !== -1){
        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files){
          req.files = files;
          next();
        });
      } else {
        next();
      }
    });
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
        maxAge: maxAge,
        httpOnly: true
      }
    }));
    app.use(helmet.csp({
      'default-src': ["'self'"],
      'script-src': scriptSrc,
      'style-src': styleSrc,
      'img-src': imgSrc,
      'connect-src': connectSrc,
      'font-src': fontSrc,
      'object-src': ["'self'"],
      'media-src': ["'self'"],
      'frame-src': ["'self'"],
      reportOnly: false, // set to true if you only want to report errors
      setAllHeaders: false, // set to true if you want to set all headers
      safari5: false // set to true if you want to force buggy CSP in Safari 5
    }));
    // This middleware adds the Strict-Transport-Security header to the response.
    // To use the default header of Strict-Transport-Security: maxAge=15768000 (about 6 months)
    app.use(helmet.hsts());
    // `X-Frame` specifies whether your app can be put in a frame or iframe.
    app.use(helmet.xframe('deny'));
    // The X-XSS-Protection header is a basic protection against XSS.
    app.use(helmet.iexss());
    // Sets the `X-Download-Options` header to noopen to prevent IE users from executing downloads in your site's context.
    app.use(helmet.ienoopen());
    // The following sets the `X-Content-Type-Options` header to its only and default option, nosniff.
    app.use(helmet.contentTypeOptions());
    // This middleware will remove the `X-Powered-By` header if it is set.
    app.use(helmet.hidePoweredBy());
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