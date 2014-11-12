angular.module('app')

.factory('LaunchSrv', function($rootScope, $q, $ionicLoading, $window, StorageSrv, BackendUserSrv, AccountsSrv, ToastSrv, InsomniaSrv, LogSrv, Utils, Config){
  'use strict';
  var service = {
    launch: function(){
      return _initStorage().then(function(){
        return StorageSrv.getUser();
      }).then(function(user){
        if(user && user.id){
          return launch();
        } else {
          return firstLaunch(user ? user.upgrade : null);
        }
      });
    }
  };

  function firstLaunch(upgrade){
    var defer = $q.defer();

    AccountsSrv.getEmailOrAsk().then(function(email){
      var promise =  BackendUserSrv.findUser(email).then(function(user){
        if(user){
          return StorageSrv.setUser(user).then(function(){
            return BackendUserSrv.setUserDevice(user.id, Utils.getDevice());
          });
        }
      }, function(error){
        if(!error){error = {};}
        else if(typeof error === 'string'){error = {message: error};}
        LogSrv.trackError('userNotFound', error);
        return StorageSrv.setUser({
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

  function _updateUser(){
    return StorageSrv.getUser().then(function(user){
      if(user && user.email){
        return BackendUserSrv.findUser(user.email).then(function(backendUser){
          if(backendUser){
            return StorageSrv.setUser(backendUser);
          }
        });
      }
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
