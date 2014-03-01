/*global surroundfmApp */
'use strict';

var LoginCtrl = function ($scope, $modalInstance) {
  $scope.ok = function (username, password, rememberMe) {
    var result = {
      username: username,
      password: password,
      rememberMe: rememberMe
    }
    $modalInstance.close(result);
  };
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

surroundfmApp.controller('NavbarCtrl', ['$scope', '$window', '$location', '$modal', 'API', '$route', function ($scope, $window, $location, $modal, api, $route) {
  $scope.menu = [{
    title: 'Home',
    link: '/'
  }];
  $scope.isAuthenticated = function() {
    return $window.localStorage.getItem('user') ? true : false;
  };
  $scope.isActive = function(route) {
    return route === $location.path();
  };
  $scope.showLoginModal = function() {
    var loginModal = $modal.open({
      controller: LoginCtrl,
      templateUrl: 'views/partials/login.html'
    });
    //loginModal.result.then($scope.login);
    loginModal.result.then(function (result) {
      if(result.username === undefined || result.password === undefined) {
        // Show error
      } else {
        if(result.rememberMe === undefined) {
          result.rememberMe = false;
        }
        var loginData = {
          username: result.username,
          password: result.password,
          rememberMe: result.rememberMe
        };
        api.login(loginData).success(function (loginResponse) {
          $scope.response = loginResponse;
          var storedUser = {
            user: loginResponse.user._id,
            email: loginResponse.user.email,
            friends: loginResponse.user.friends,
            lastfm: loginResponse.user.lastfm
          };
          $window.localStorage.setItem('user', JSON.stringify(storedUser));
          $route.reload();
        }).error(function (error, statusCode) {
            $scope.alerts.push({type: 'danger', msg: error.message});
        });
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
      $scope.alerts.push({type: 'danger', msg: error.message});
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
      $scope.alerts.push({type: 'success', msg: registerResponse.message});
    }).error(function (error) {
      if(!$scope.alerts) {
        $scope.alerts = [];
      }
      $scope.alerts.push({type: 'danger', msg: error.message});
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
    $scope.alerts.push({type: 'danger', msg: error.message});
  });
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
}]);

surroundfmApp.controller('ProfileCtrl', ['$scope', 'API', '$route', 'Profile', function ($scope, api, $route, Profile) {
  api.getProfile($route.current.params.user).success(function (profileData) {
    $scope.profile = profileData;
    Profile = profileData;
  }).error(function (error) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'danger', msg: error.message});
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
      $scope.alerts.push({type: 'danger', msg: error.message});
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
      $scope.alerts.push({type: 'success', msg: emailResponse.message});
    }).error(function (error) {
        if(!$scope.alerts) {
          $scope.alerts = [];
        }
        $scope.alerts.push({type: 'danger', msg: error.message});
    });
  };
  $scope.editAvatar = function() {
    $scope.showAvatarEdit = true;
  };
  $scope.uploadComplete = function(uploadResponse) {
    if(!$scope.alerts) {
      $scope.alerts = [];
    }
    $scope.alerts.push({type: 'success', msg: uploadResponse.message});
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
      $scope.alerts.push({type: 'success', msg: passwordResponse.message});
    }).error(function (error) {
        if(!$scope.alerts) {
          $scope.alerts = [];
        }
        $scope.alerts.push({type: 'danger', msg: error.message});
    });
  };
}]);