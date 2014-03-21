'use strict';

var nano = require('nano')('http://localhost:5984');
var userDB = nano.db.use('users');
var gm = require('googlemaps');
var validator = require('validator');

var _toRadius = function(degrees) {
  return degrees * Math.PI / 180;
};

var _distanceCalculator = function(originLat, originLng, destLat, destLng) {
  var R = 6371; // km
  var dLat = _toRadius(destLat - originLat);
  var dLng = _toRadius(destLng-originLng);
  originLat = _toRadius(originLat);
  destLat = _toRadius(destLat);
  originLng = _toRadius(originLng);
  destLng = _toRadius(destLng);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(originLat) * Math.cos(destLat);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  //var d is in KM, convert to Miles: 1 KM = 0.621371 Miles
  var original = d * 0.621371;
  var miles = Math.round(original * 100)/100;
  var meters = Math.round(miles * 1609.344);
  return {miles: miles, meters: meters};
};

// Query database and get people local to user.
// Get people within n miles/meters
exports.getCloseUsers = function(req, res) {
  if(!req.session.user_id) {
    return res.json(401, {message: 'Please sign in.'});
  }
  var username = req.session.user_id;
  userDB.get(username, function (error, user) {
    if(error && error.status_code === 404) {
      return res.json(404, {message: 'User does not exist.'});
    } else if(error) {
      console.log(error);
      return res.json(500, {message: 'Could not login, please try again later.'});
    }
    var coords = user.coordinates;
    var zipCode = user.zipcode;
    userDB.view('users', 'by_zipcode', {reduce: false, startkey: zipCode, endkey: zipCode + '\u9999'}, function (error, body) {
      if (error) {
        console.log(error);
        return res.json({results: [], message: 'No results found.'});
      }
      if(body.rows.length === 0) {
        return res.json({results: [], message: 'No results found.'});
      }
      var closeUsers = [];
      for(var userCounter = 0; userCounter < body.rows.length; userCounter++) {
        var tempCoordinates = body.rows[userCounter].value.coordinates;
        var distanceObj = _distanceCalculator(coords.lat, coords.lng, tempCoordinates.lat, tempCoordinates.lng);
        if(distanceObj.meters <= 1000 && body.rows[userCounter].value._id !== username) {
          body.rows[userCounter].value.distance = distanceObj;
          closeUsers.push(body.rows[userCounter].value);
        }
      }
      return res.json({results: closeUsers});
    });
  });
};