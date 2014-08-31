angular.module('app')

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

.controller('LoginCtrl', function($scope, $state, $window, PopupSrv, UserSrv, LoginSrv, SelectionSrv, LogSrv){
  'use strict';
  // this is only to preload selection of recipes at first launch !
  SelectionSrv.getCurrent();

  $scope.credentials = {
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
    UserSrv.get().skipIntro = false;
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
          PopupSrv.askMail().then(function(email){
            UserSrv.setEmail(email).then(function(){
              loginSuccess(provider, user);
            });
          });
        }
      }, function(error){
        LogSrv.trackError('login:'+provider, error);
        $scope.loading[provider] = false;
        $window.plugins.toast.show(error.message);
      });
    } else {
      $scope.loading[provider] = false;
    }
  }

  function loginSuccess(provider, user){
    $scope.loading[provider] = false;
    // TODO : send welcome mail if first time !
    LogSrv.trackLogin(provider, user);
    LogSrv.registerUser();
    $state.go('app.home');
  }
})

.factory('LoginSrv', function($rootScope, $q, $timeout, StorageSrv, $firebaseSimpleLogin, UserSrv, firebaseUrl){
  'use strict';
  var service = {
    isLogged: function(){return StorageSrv.getUser().isLogged;},
    register: register,
    login: login,
    facebookConnect: facebookConnect,
    twitterConnect: twitterConnect,
    googleConnect: googleConnect,
    logout: logout
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
    var socialProfile = StorageSrv.getUserProfile(provider);
    if(socialProfile && socialProfile.accessToken){
      opts.access_token = socialProfile.accessToken;
    }
    return connect(provider, opts);
  }

  function twitterConnect(){
    var provider = 'twitter';
    var opts = {};
    var socialProfile = StorageSrv.getUserProfile(provider);
    if(socialProfile && socialProfile.accessToken){
      opts.oauth_token = socialProfile.accessToken;
      opts.oauth_token_secret = socialProfile.accessTokenSecret;
      opts.user_id = socialProfile.id;
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
      var user = StorageSrv.getUser();
      user.isLogged = false;
      StorageSrv.saveUser(user);
      logoutDefer.resolve();
    }, 1000);

    return logoutDefer.promise;
  }

  $rootScope.$on('$firebaseSimpleLogin:login', function(event, userData){
    if(loginDefer){
      var user = StorageSrv.getUser();
      var userProfiles = StorageSrv.getUserProfiles();
      user.isLogged = true;
      user.loggedWith = loginMethod;
      userProfiles[loginMethod] = userData;
      StorageSrv.saveUserProfiles(userProfiles);
      UserSrv.updateUserProfile(user, userProfiles);
      loginDefer.resolve(user);
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:logout', function(event){
    if(logoutDefer){
      $timeout.cancel(logoutTimeout);
      var user = StorageSrv.getUser();
      user.isLogged = false;
      StorageSrv.saveUser(user);
      logoutDefer.resolve();
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:error', function(event, error){
    var err = { provider: loginMethod };
    if(error.code){err.code = error.code;}
    err.message = error.message ? error.message.replace('FirebaseSimpleLogin: ', '') : 'Unexpected error occur :(';
    if(loginDefer){loginDefer.reject(err);}
    if(logoutDefer){logoutDefer.reject(err);}
  });

  return service;
});
