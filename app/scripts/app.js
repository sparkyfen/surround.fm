/*jshint unused:false */
'use strict';

var surroundfmApp = angular.module('surroundfmApp', ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', 'ui.bootstrap', 'ngUpload']).config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      }).when('/search/:query', {
        templateUrl: 'partials/search',
        controller: 'SearchCtrl'
      }).when('/:user/profile', {
        templateUrl: 'partials/profile/profile',
        controller: 'ProfileCtrl'
      }).when('/:user/profile/edit', {
        templateUrl: 'partials/profile/edit',
        controller: 'ProfileEditCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  });