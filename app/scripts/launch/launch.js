angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('intro', {
    url: '/intro',
    templateUrl: 'scripts/launch/intro.html',
    controller: 'IntroCtrl'
  });
})

.controller('IntroCtrl', function($scope, $state, StorageSrv, LoginSrv, LogSrv){
  'use strict';
  var currentSlide = 0;

  $scope.startApp = function(){
    LogSrv.trackIntroExit(currentSlide);
    var user = StorageSrv.getUser();
    user.skipIntro = true;
    StorageSrv.saveUser(user);
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

.factory('LaunchSrv', function($rootScope, $window, $state, $ionicPlatform, StorageSrv, LogSrv, Utils, debug){
  'use strict';
  var service = {
    launch: function(){
      var user = StorageSrv.getUser();
      if(user && user.device && user.device.uuid){
        launch();
      } else {
        firstLaunch();
      }
    }
  };

  function firstLaunch(){
    $ionicPlatform.ready(function(){
      var user = StorageSrv.getUser();
      user.device = Utils.getDevice();
      StorageSrv.saveUser(user);
      LogSrv.identify(user.device.uuid);
      LogSrv.registerUser();
      LogSrv.trackInstall(user.device.uuid);
      launch();
    });
  }

  function launch(){
    var user = StorageSrv.getUser();
    LogSrv.identify(user.device.uuid);

    // INIT is defined in top of index.html
    var launchTime = Date.now()-INIT;
    if(debug && ionic.Platform.isWebView()){$window.plugins.toast.show('Application started in '+launchTime+' ms');}
    LogSrv.trackLaunch(user.device.uuid, launchTime);

    // track state changes
    var lastStateChange = Date.now();
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                       {params.fromUrl = $state.href(fromState.name, fromParams);}
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.toUrl = $state.href(toState.name, toParams);}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      if(lastStateChange) {
        var now = Date.now();
        params.timePassed = now - lastStateChange;
        lastStateChange = now;
      }
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
      if(StorageSrv.getUser().isLogged){
        if(toState.data && toState.data.restrict && toState.data.restrict === 'notConnected'){
          event.preventDefault();
          console.log('Not allowed to go to '+toState.name+' (you are connected !)');
          if(fromState.data && fromState.data.restrict && fromState.data.restrict === 'notConnected'){$state.go('app.home');}
        }
      } else {
        if(toState.data && toState.data.restrict && toState.data.restrict === 'connected'){
          event.preventDefault();
          console.log('Not allowed to go to '+toState.name+' (you are not connected !)');
          if(fromState.data && fromState.data.restrict && fromState.data.restrict === 'connected'){$state.go('login');}
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
