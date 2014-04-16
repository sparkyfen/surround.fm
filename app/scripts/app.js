/*jshint unused:false */
'use strict';

var surroundfmApp = angular.module('surroundfmApp', ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'ngUpload', 'geolocation', 'google-maps']).config(function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl'
      }).when('/search/:query', {
        templateUrl: 'partials/search',
        controller: 'SearchCtrl'
      }).when('/:user', {
        templateUrl: 'partials/profile/user',
        controller: 'MyProfileCtrl'
      }).when('/:user/profile', {
        templateUrl: 'partials/profile/profile',
        controller: 'ProfileCtrl'
      }).when('/:user/profile/edit', {
        templateUrl: 'partials/profile/edit',
        controller: 'ProfileEditCtrl'
      }).when('/view/list', {
        templateUrl: 'partials/list',
        controller: 'ListViewCtrl'
      }).when('/view/map', {
        templateUrl: 'partials/map',
        controller: 'MapViewCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  });