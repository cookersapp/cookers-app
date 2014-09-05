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
  
  $scope.state = {
    hasError: false
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
        $scope.state.hasError = true;
        $scope.credentials.password = '';
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
});
