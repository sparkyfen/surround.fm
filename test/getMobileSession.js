var crypto = require('crypto');
var username = "";
var password = "";
var api_key = "";
var secret = "";
var hashedPass = crypto.createHash('md5').update(password).digest('hex');
var authToken = crypto.createHash('md5').update(username + hashedPass).digest('hex');

var api_sig = crypto.createHash('md5').update("api_key" + api_key + "authToken" + authToken + "methodauth.GetMobileSessionusername" + username + secret).digest('hex');

var url = "http://ws.audioscrobbler.com/2.0/?method=auth.GetMobileSession&format=json&api_key=" + api_key + "&username=" + username + "&api_sig=" + api_sig + "&authToken=" + authToken;

console.log(url);