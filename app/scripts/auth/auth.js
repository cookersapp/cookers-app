angular.module('app.auth', ['ui.router'])

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: 'scripts/auth/login.html',
    controller: 'LoginCtrl',
    data: {
      restrict: 'notConnected'
    }
  })
  .state('login-email', {
    url: '/login-email',
    templateUrl: 'scripts/auth/login-email.html',
    controller: 'LoginCtrl',
    data: {
      restrict: 'notConnected'
    }
  });
})

.controller('LoginCtrl', function($scope, $state, $window, $ionicPopup, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var sUser = UserSrv.get();

  $scope.credentials = {
    dismissed: false,
    email: '',
    password: ''
  };

  $scope.loading = {
    facebook: false,
    twitter: false,
    google: false,
    email: false
  };

  $scope.goIntro = function(){
    sUser.skipIntro = false;
    $state.go('intro');
  };

  $scope.facebookConnect = function(){ connect('facebook'); };
  $scope.twitterConnect = function(){ connect('twitter'); };
  $scope.googleConnect = function(){ connect('google'); };
  $scope.emailConnect = function(tab){ connect('email', tab); };

  function connect(provider, tab){
    $scope.loading[provider] = true;
    var promise;

    if(provider === 'facebook'){ promise = LoginSrv.facebookConnect(); }
    if(provider === 'twitter'){ promise = LoginSrv.twitterConnect(); }
    if(provider === 'google'){ promise = LoginSrv.googleConnect(); }
    else if(provider === 'email' && tab && tab === 'login'){ promise = LoginSrv.login($scope.credentials); }
    else if(provider === 'email' && tab && tab !== 'login'){ promise = LoginSrv.register($scope.credentials); }

    if(promise){
      promise.then(function(user){
        if(UserSrv.hasMail()){
          loginSuccess(provider, user);
        } else {
          $ionicPopup.show(emailPopup).then(function(email){
            UserSrv.setEmail(email);
            loginSuccess(provider, user);
          });
        }
      }, function(error){
        LogSrv.trackError('login:'+provider, error);
        $scope.loading[provider] = false;
        $window.plugins.toast.show(LoginSrv.getMessage(error));
      });
    } else {
      $scope.loading[provider] = false;
    }
  }

  function loginSuccess(provider, user){
    $scope.loading[provider] = false;
    // TODO : send welcome mail if first time !
    LogSrv.trackLogin(provider, user);
    $state.go('app.home');
  }

  var emailPopup = {
    template: '<input type="email" placeholder="ex: nom@example.com" ng-model="credentials.email" required>',
    title: '<i class="fa fa-smile-o"></i> Lâche ton mail &nbsp;<i class="fa fa-smile-o"></i>',
    subTitle: '!! No spam guaranteed !!',
    scope: $scope,
    buttons: [
      { text: 'Non !', onTap: function(e){
        if(!$scope.credentials.dismissed){
          $window.plugins.toast.show('S\'il-te-plaît ...');
          $scope.credentials.dismissed = true;
          e.preventDefault();
        } else {
          return '';
        }
      }},
      { text: '<b>Voilà !</b>', type: 'button-positive', onTap: function(e){
        if(!$scope.credentials.email){
          e.preventDefault();
        } else {
          $window.plugins.toast.show('Merci :D');
          return $scope.credentials.email;
        }
      }}
    ]
  };
})

.factory('LoginSrv', function($rootScope, $q, $timeout, $localStorage, $firebaseSimpleLogin, UserSrv, firebaseUrl){
  'use strict';
  var sUser = $localStorage.user;
  var service = {
    isLogged: function(){return sUser.isLogged;},
    register: register,
    login: login,
    facebookConnect: facebookConnect,
    twitterConnect: twitterConnect,
    googleConnect: googleConnect,
    logout: logout,
    getMessage: function(error){
      return error.message.replace('FirebaseSimpleLogin: ', '');
    }
  };

  var firebaseRef = new Firebase(firebaseUrl);
  var firebaseAuth = $firebaseSimpleLogin(firebaseRef);

  var loginDefer, logoutDefer, logoutTimeout, loginMethod;

  function register(credentials){
    loginMethod = 'password';
    loginDefer = $q.defer();

    firebaseAuth.$createUser(credentials.email, credentials.password).then(function(user){
      firebaseAuth.$login(loginMethod, {
        email: credentials.email,
        password: credentials.password,
        rememberMe: true
      });
    }, function(error){
      loginDefer.reject(error);
    });

    return loginDefer.promise;
  }

  function login(credentials){
    var opts = {
      email: credentials.email,
      password: credentials.password
    };
    return connect('password', opts);
  }

  function facebookConnect(){
    var provider = 'facebook';
    var opts = {
      scope: 'email'
    };
    if(sUser && sUser.profiles && sUser.profiles[provider] && sUser.profiles[provider].accessToken){
      opts.access_token = sUser.profiles[provider].accessToken;
    }
    return connect(provider, opts);
  }

  function twitterConnect(){
    var provider = 'twitter';
    var opts = {};
    if(sUser && sUser.profiles && sUser.profiles[provider] && sUser.profiles[provider].accessToken){
      opts.oauth_token = sUser.profiles[provider].accessToken;
      opts.oauth_token_secret = sUser.profiles[provider].accessTokenSecret;
      opts.user_id = sUser.profiles[provider].id;
    }
    return connect(provider, opts);
  }

  function googleConnect(){
    return connect('google', {});
  }

  function connect(provider, opts){
    loginMethod = provider;
    loginDefer = $q.defer();
    opts.rememberMe = true;
    firebaseAuth.$login(loginMethod, opts);
    return loginDefer.promise;
  }

  function logout(){
    logoutDefer = $q.defer();
    firebaseAuth.$logout();

    // disconnect after 1 sec even if firebase doesn't answer !
    logoutTimeout = $timeout(function(){
      console.log('logout timeout !');
      sUser.isLogged = false;
      logoutDefer.resolve();
    }, 1000);

    return logoutDefer.promise;
  }

  $rootScope.$on('$firebaseSimpleLogin:login', function(event, user){
    console.log('$firebaseSimpleLogin:login', user);
    if(loginDefer){
      sUser.isLogged = true;
      sUser.profiles[loginMethod] = user;
      UserSrv.updateProfile();
      loginDefer.resolve(user);
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:logout', function(event){
    console.log('$firebaseSimpleLogin:logout');
    if(logoutDefer){
      sUser.isLogged = false;
      $timeout.cancel(logoutTimeout);
      logoutDefer.resolve();
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:error', function(event, error){
    console.log('$firebaseSimpleLogin:error', error);
    if(loginDefer){loginDefer.reject(error);}
    if(logoutDefer){logoutDefer.reject(error);}
  });

  return service;
});
