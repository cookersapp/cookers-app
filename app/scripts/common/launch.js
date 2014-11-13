angular.module('app')

.factory('LaunchSrv', function($rootScope, $q, $ionicLoading, $window, StorageSrv, UserSrv, AccountsSrv, ToastSrv, InsomniaSrv, LogSrv, Utils, Config){
  'use strict';
  var service = {
    launch: function(){
      return _initStorage().then(function(){
        return UserSrv.get();
      }).then(function(user){
        if(user && user.id){
          return launch(user);
        } else {
          return firstLaunch(user);
        }
      });
    }
  };

  function firstLaunch(user){
    var upgrade = user ? user.upgrade : null;
    if(upgrade){
      LogSrv.trackUpgrade(upgrade, Config.appVersion);
    } else {
      LogSrv.trackInstall();
    }
    return launch(user);
  }

  function launch(user){
    _trackLaunch();
    _initTrackStateErrors();
    _initNoSleepMode();
    _initAutomaticLoadingIndicators();
    return UserSrv.updateWithRemote();
  }

  function _initStorage(){
    return StorageSrv.getApp().then(function(app){
      if(!app || app.version !== Config.appVersion){
        /** Upgrade code **/
        if($window.localStorage){
          $window.localStorage.clear();
        }
        if(!app){ app = {}; }
        app.version = Config.appVersion;
        return StorageSrv.setApp(app);
      }
    });
  }


  function _trackLaunch(){
    // INIT is defined in top of index.html
    var launchTime = Date.now()-INIT;
    if(Config.debug && ionic.Platform.isWebView()){ToastSrv.show('Application started in '+launchTime+' ms');}
    LogSrv.trackLaunch(launchTime);
  }

  function _initTrackStateErrors(){
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
      var params = {};
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      if(error && !isEmpty(error))                          {params.error = error;}
      LogSrv.trackError('stateChangeError', params);
    });
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                                               {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                                        {params.fromParams = fromParams;}
      if(unfoundState && unfoundState.to)                                           {params.to = unfoundState.to;}
      if(unfoundState && unfoundState.toParams && !isEmpty(unfoundState.toParams))  {params.toParams = unfoundState.toParams;}
      LogSrv.trackError('stateNotFound', params);
    });
  }

  function _initNoSleepMode(){
    // phone will not sleep on states with attribute 'noSleep'
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      if(toState && toState.data && toState.data.noSleep){
        InsomniaSrv.keepAwake();
      } else {
        InsomniaSrv.allowSleepAgain();
      }
    });
  }

  function _initAutomaticLoadingIndicators(){
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      $ionicLoading.show();
    });
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      $ionicLoading.hide();
    });
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  return service;
});
