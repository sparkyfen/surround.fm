/*global surroundfmApp */
'use strict';

surroundfmApp.controller('LoginCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {
  $scope.ok = function (username, password, rememberMe) {
    var result = {
      username: username,
      password: password,
      rememberMe: rememberMe
    };
    $modalInstance.close(result);
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}]);

surroundfmApp.controller('NavbarCtrl', ['$scope', '$window', '$location', '$modal', 'API', function ($scope, $window, $location, $modal, api) {
  $scope.menu = [{
    title: 'Home',
    link: '/'
  },{
    title: 'List View',
    link: '/view/list'
  }, {
    title: 'Map View',
    link: '/view/map'
  }];
  $scope.isAuthenticated = function() {
    return $window.localStorage.getItem('user') ? true : false;
  };
  $scope.isActive = function(route) {
    return route === $location.path();
  };
  $scope.showLoginModal = function() {
    var loginModal = $modal.open({
      controller: 'LoginCtrl',
      templateUrl: 'views/partials/login.html'
    });
    loginModal.result.then(function (loginData) {
      if(loginData.username === undefined || loginData.password === undefined) {
        // Show error
      } else {
        if(loginData.rememberMe === undefined) {
          loginData.rememberMe = false;
        }
        api.login(loginData).success(function (loginResponse) {
          $scope.response = loginResponse;
          var storedUser = {
            user: loginResponse.user._id,
            email: loginResponse.user.email,
            friends: loginResponse.user.friends,
            lastfm: loginResponse.user.lastfm
          };
          $window.localStorage.setItem('user', JSON.stringify(storedUser));
          $location.path('/' + storedUser.user);
        }).error(function (error) {
            if(!$scope.alerts) {
              $scope.alerts = [];
            }
            $scope.alerts.push({type: 'brand-danger', msg: error.message});
          }
        );
      }
    });
  };
  $scope.logout = function() {
    api.logout().success(function (logoutResponse) {
      $window.localStorage.clear();
      $scope.response = logoutResponse;
      $location.path('/');
    }).error(function (error) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'brand-danger', msg: error.message});
    });
  };
  $scope.search = function() {
    $location.path('/search/' + $scope.query);
  };
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}]);

surroundfmApp.controller('MainCtrl', ['$scope', 'API', function ($scope, api) {
  $scope.register = function() {
    api.register($scope.registration).success(function (registerResponse) {
      $scope.alerts.push({type: 'brand-success', msg: registerResponse.message});
    }).error(function (error) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'brand-danger', msg: error.message});
    });
  };
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}]);

surroundfmApp.controller('SearchCtrl', ['$scope', '$route', 'API', function ($scope, $route, api) {
  api.search($route.current.params.query).success(function (searchResults) {
    $scope.results = searchResults.results;
  }).error(function (error) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'brand-danger', msg: error.message});
  });
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}]);

surroundfmApp.controller('MyProfileCtrl', ['$scope', 'API', '$route', 'geolocation', function ($scope, api, $route, geolocation) {
  if(!$scope.alerts) {
    $scope.alerts = [];
  }
  $scope.alerts.push({type: 'brand-warning', msg: '<span class="glyphicon glyphicon-globe"></span> Waiting for geolocation.'});
  geolocation.getLocation().then(function (data) {
    $scope.alerts.splice(0, 1);
    $scope.geo = {lat: data.coords.latitude, lng: data.coords.longitude};
    api.receiveSignal($scope.geo).success(function (signalResponse) {
      $scope.alerts.splice(0, 1);
      $scope.alerts.push({type: 'brand-success', msg: signalResponse.message});
    }).error(function (error) {
      $scope.alerts.push({type: 'brand-danger', msg: error.message});
    });
  }, function (error) {
      $scope.alerts.splice(0, 1);
      $scope.alerts.push({
        type: 'brand-danger',
        msg: error
      });
    }
  );
  //api.getFeed()
}]);

surroundfmApp.controller('ProfileCtrl', ['$scope', 'API', '$route', 'Profile', function ($scope, api, $route, Profile) {
  var unauth = parseInt($route.current.params.unauth, 10);
  if(unauth === 1) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'brand-danger', msg: 'Unauthorized.'});
  }
  api.getProfile($route.current.params.user).success(function (profileData) {
    $scope.profile = profileData;
    Profile = profileData;
  }).error(function (error) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'brand-danger', msg: error.message});
  });
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}]);

surroundfmApp.controller('ProfileEditCtrl', ['$scope', 'API', 'Profile', '$route', '$location', function ($scope, api, Profile, $route, $location) {
  var username = $route.current.params.user;
  if(!Profile._id) {
    api.getProfile(username).success(function (profileData) {
      if(!profileData.isOwnProfile) {
        $location.path('/' + username + '/profile').search({'unauth': 1});
      } else {
        $scope.profile = profileData;
        Profile = profileData;
      }
    }).error(function (error) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'brand-danger', msg: error.message});
    });
  } else {
    $scope.profile = Profile;
  }
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
  $scope.changeEmail = function() {
    var emailObj = {
      oldEmail: $scope.profile.email,
      newEmail: $scope.profile.newEmail
    };
    api.changeEmail(emailObj).success(function (emailResponse) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'brand-success', msg: emailResponse.message});
    }).error(function (error) {
        if(!$scope.alerts) {
          $scope.alerts = [];
        }
        $scope.alerts.push({type: 'brand-danger', msg: error.message});
      }
    );
  };
  $scope.editAvatar = function() {
    $scope.showAvatarEdit = true;
  };
  $scope.uploadComplete = function(uploadResponse) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'brand-success', msg: uploadResponse.message});
  };
  $scope.changePassword = function() {
    var passwordObj = {
      oldPassword: $scope.profile.currentPassword,
      newPassword: $scope.profile.newPassword,
      newConfirmPassword: $scope.profile.newConfirmPassword,
    };
    api.changePassword(passwordObj).success(function (passwordResponse) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'brand-success', msg: passwordResponse.message});
    }).error(function (error) {
        if(!$scope.alerts) {
          $scope.alerts = [];
        }
        $scope.alerts.push({type: 'brand-danger', msg: error.message});
      }
    );
    $scope.closeAlert = function(index) {
      $scope.alerts.splice(index, 1);
    };
  };
}]);

surroundfmApp.controller('ListViewCtrl', ['$scope', 'API', function ($scope, api) {
  api.getCloseUsers().success(function (userResponse) {
    $scope.users = userResponse.results;
  }).error(function (error) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'brand-danger', msg: error.message});
  });
}]);

/*surroundfmApp.controller('MapViewCtrl', ['$scope', function ($scope) {

}]);*/