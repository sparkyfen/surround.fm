/*global surroundfmApp, $ */
'use strict';

surroundfmApp.service('API', ['$http', function ($http) {
  return {
    login: function(loginData) {
      return $http({
          url: '/api/login',
          method: 'POST',
          data: $.param(loginData),
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }
      );
    },
    logout: function() {
      return $http({
          url: '/api/logout',
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }
      );
    },
    search: function(query) {
      return $http.get('/api/searchFriends?q=' + query);
    },
    addFriend: function(friendData) {
      return $http({
        url: '/api/addFriend',
        method: 'POST',
        data: $.param(friendData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    },
    getProfile: function(username) {
      return $http.get('/api/getProfile?username=' + username);
    },
    changePassword: function(passwordData) {
      return $http({
        url: '/api/changePassword',
        method: 'POST',
        data: $.param(passwordData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    },
    changeEmail: function(emailData) {
      return $http({
        url: '/api/changeEmail',
        method: 'POST',
        data: $.param(emailData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    },
    register: function(registerData) {
      return $http({
        url: '/api/register',
        method: 'POST',
        data: $.param(registerData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    },
    receiveSignal: function(signalData) {
      return $http({
        url: '/api/receiveSignal',
        method: 'POST',
        data: $.param(signalData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    },
    getCloseUsers: function() {
      return $http.get('/api/getCloseUsers');
    },
    linkAccounts: function(accountData) {
      return $http({
        url: '/api/linkAccounts',
        method: 'POST',
        data: $.param(accountData),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      });
    }
  };
}]);