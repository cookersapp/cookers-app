angular.module('app')

.factory('LaunchSrv', function($rootScope, $state, $q, $ionicPlatform, $ionicLoading, StorageSrv, BackendUserSrv, AccountsSrv, ToastSrv, InsomniaSrv, LogSrv, Utils, _LocalStorageSrv, localStorageDefault, Config){
  'use strict';
  var service = {
    launch: function(){
      var defer = $q.defer();
      _initStorage();
      var user = StorageSrv.getUser();
      if(user && user.id){
        launch().then(function(){
          defer.resolve();
        });
      } else {
        firstLaunch(user ? user.upgrade : null).then(function(){
          defer.resolve();
        });
      }
      return defer.promise;
    }
  };

  function firstLaunch(upgrade){
    var defer = $q.defer();

    AccountsSrv.getEmailOrAsk().then(function(email){
      var promise =  BackendUserSrv.findUser(email).then(function(user){
        StorageSrv.saveUser(user);
        BackendUserSrv.setUserDevice(user.id, Utils.getDevice());
      }, function(error){
        if(!error){error = {};}
        else if(typeof error === 'string'){error = {message: error};}
        LogSrv.trackError('userNotFound', error);
        StorageSrv.saveUser({
          email: email,
          settings: {}
        });
      });

      promise['finally'](function(){
        if(upgrade){
          LogSrv.trackUpgrade(upgrade, Config.appVersion);
        } else {
          LogSrv.trackInstall();
        }
        launch().then(function(){
          defer.resolve();
        });
      });
    });

    return defer.promise;
  }

  function launch(){
    _trackLaunch();
    _updateUser();
    _initTrackStateErrors();
    _initNoSleepMode();
    _initAutomaticLoadingIndicators();
    return $q.when();
  }

  function _initStorage(){
    var app = _LocalStorageSrv.getApp();
    if(!app || app.version !== Config.appVersion){
      for(var i in localStorageDefault){
        var key = i;
        var defaultValue = localStorageDefault[key] || {};
        var storageValue = _LocalStorageSrv.get(key) || {};
        var extendedValue = Utils.extendDeep({}, defaultValue, storageValue);
        _LocalStorageSrv.set(key, extendedValue);
      }

      app = _LocalStorageSrv.getApp();
      if(app.version !== ''){
        /* Migration code */
        _LocalStorageSrv.setUser({upgrade: app.version, data: {welcomeMailSent: true}});
        /* End migration code */
      }

      app = _LocalStorageSrv.getApp();
      app.version = Config.appVersion;
      _LocalStorageSrv.setApp(app);
    }
  }


  function _trackLaunch(){
    // INIT is defined in top of index.html
    var launchTime = Date.now()-INIT;
    if(Config.debug && ionic.Platform.isWebView()){ToastSrv.show('Application started in '+launchTime+' ms');}
    LogSrv.trackLaunch(launchTime);
  }

  function _updateUser(){
    var user = StorageSrv.getUser();
    if(user && user.email){
      BackendUserSrv.findUser(user.email).then(function(backendUser){
        StorageSrv.saveUser(backendUser);
      });
    }
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
