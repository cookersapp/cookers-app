angular.module('app')

.factory('LaunchSrv', function($rootScope, $state, $q, $ionicPlatform, $ionicLoading, StorageSrv, BackendUserSrv, AccountsSrv, ToastSrv, InsomniaSrv, LogSrv, Utils, debug){
  'use strict';
  var service = {
    launch: function(){
      $ionicPlatform.ready(function(){
        var user = StorageSrv.getUser();
        if(user && user.id){
          launch();
        } else {
          firstLaunch();
        }
      });
    }
  };

  function firstLaunch(){
    var user = StorageSrv.getUser();
    user.device = Utils.getDevice();
    AccountsSrv.getEmailOrAsk().then(function(email){
      user.email = email;
      BackendUserSrv.getUserId(email).then(function(userId){
        if(userId)  {
          user.id = userId;
          return BackendUserSrv.getUser(userId);
        } else {
          user.id = Utils.createUuid();
          return $q.when(user);
        }
      }).then(function(backendUser){
        angular.extend(user, backendUser);
        StorageSrv.saveUser(user);
        LogSrv.trackInstall();
        launch();
      }, function(error){
        if(!error){error = {};}
        else if(typeof error === 'string'){error = {message: error};}
        error.email = email;
        LogSrv.trackError('network:userNotFound', error);

        StorageSrv.saveUser(user);
        LogSrv.trackInstall();
        launch();
      });
    });
  }

  function launch(){
    _trackLaunch();
    _updateUser();
    _initTrackStateErrors();
    _initNoSleepMode();
    _initAutomaticLoadingIndicators();
  }

  function _trackLaunch(){
    // INIT is defined in top of index.html
    var user = StorageSrv.getUser();
    var launchTime = Date.now()-INIT;
    if(debug && ionic.Platform.isWebView()){ToastSrv.show('Application started in '+launchTime+' ms');}
    LogSrv.trackLaunch(launchTime);
  }

  function _updateUser(){
    var user = StorageSrv.getUser();
    BackendUserSrv.getUser(user.id).then(function(backendUser){
      angular.extend(user, backendUser);
      StorageSrv.saveUser(user, true);
    });
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
