angular.module('app.launch', ['app.utils', 'ui.router'])

.config(function($stateProvider, $urlRouterProvider){
  'use strict';

  $stateProvider
  .state('intro', {
    url: '/intro',
    templateUrl: 'scripts/launch/intro.html',
    controller: 'IntroCtrl'
  });
})

.controller('IntroCtrl', function($scope, $state, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var currentSlide = 0;

  $scope.startApp = function(){
    LogSrv.trackIntroExit(currentSlide);
    UserSrv.get().skipIntro = true;
    if(LoginSrv.isLogged()){
      $state.go('app.home');
    } else {
      $state.go('login');
    }
  };
  
  $scope.slideChanged = function(index){
    LogSrv.trackIntroChangeSlide(currentSlide, index);
    currentSlide = index;
  };
})

.factory('LaunchSrv', function($rootScope, $window, $state, $localStorage, $ionicPlatform, GamificationSrv, LogSrv, Utils, firebaseUrl){
  'use strict';
  var service = {
    launch: function(){
      var sUser = $localStorage.user;
      if(sUser && sUser.device && sUser.device.uuid){
        launch();
      } else {
        firstLaunch();
      }
    }
  };

  function firstLaunch(){
    var sUser = $localStorage.user;
    GamificationSrv.evalLevel();
    $ionicPlatform.ready(function(){
      sUser.device = Utils.getDevice();
      LogSrv.identify(sUser.device.uuid);
      LogSrv.registerUser();
      LogSrv.trackInstall(sUser.device.uuid);
      launch();
    });
  }

  function launch(){
    var sUser = $localStorage.user;
    LogSrv.identify(sUser.device.uuid);

    // INIT is defined in top of index.html
    LogSrv.trackLaunch(sUser.device.uuid, Date.now()-INIT);

    // manage user presence in firebase
    var firebaseRef = new Firebase(firebaseUrl+'/connected');
    var userRef = firebaseRef.push(sUser);
    userRef.onDisconnect().remove();

    navigator.geolocation.getCurrentPosition(function(position){
      $localStorage.logs.launchs.unshift(position);
    }, function(error){
      error.timestamp = Date.now();
      $localStorage.logs.launchs.unshift(error);
    });

    // track state changes
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                       {params.fromUrl = $state.href(fromState.name, fromParams);}
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.toUrl = $state.href(toState.name, toParams);}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      LogSrv.trackState(params);
    });
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
      var params = {};
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      if(error && !isEmpty(error))                          {params.error = error;}
      LogSrv.trackStateError(params);
    });
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                                               {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                                        {params.fromParams = fromParams;}
      if(unfoundState && unfoundState.to)                                           {params.to = unfoundState.to;}
      if(unfoundState && unfoundState.toParams && !isEmpty(unfoundState.toParams))  {params.toParams = unfoundState.toParams;}
      LogSrv.trackStateNotFound(params);
    });

    // If logged, login state is forbidden !
    // If not logged, all states except intro & login are forbidden !
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      if($localStorage.user.isLogged){
        if(toState.data && toState.data.restrict && toState.data.restrict === 'notConnected'){
          console.log('Not allowed to go to '+toState.name+' (you are connected !)');
          event.preventDefault();
          if(fromState.name === ''){$state.go('app.home');}
        }
      } else {
        if(toState.data && toState.data.restrict && toState.data.restrict === 'connected'){
          console.log('Not allowed to go to '+toState.name+' (you are not connected !)');
          event.preventDefault();
          if(fromState.name === ''){$state.go('login');}
        }
      }
    });

    // phone will not sleep on states with attribute 'noSleep'
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      if($window.plugins && $window.plugins.insomnia){
        if(toState && toState.data && toState.data.noSleep){
          $window.plugins.insomnia.keepAwake();
        } else {
          $window.plugins.insomnia.allowSleepAgain();
        }
      }
    });
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  return service;
});
