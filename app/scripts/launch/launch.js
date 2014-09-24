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

.controller('IntroCtrl', function($scope, $state, StorageSrv, LogSrv){
  'use strict';
  var currentSlide = 0;

  $scope.startApp = function(){
    LogSrv.trackIntroExit(currentSlide);
    $state.go('app.home');
  };

  $scope.slideChanged = function(index){
    LogSrv.trackIntroChangeSlide(currentSlide, index);
    currentSlide = index;
  };
})

.factory('LaunchSrv', function($rootScope, $state, $ionicPlatform, $ionicLoading, StorageSrv, BackendUserSrv, AccountsSrv, ToastSrv, InsomniaSrv, LogSrv, Utils, debug){
  'use strict';
  var service = {
    launch: function(){
      $ionicPlatform.ready(function(){
        var user = StorageSrv.getUser();
        console.log('user', user);
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
    AccountsSrv.getEmail(function(email){
      BackendUserSrv.getUserId(email).then(function(userId){
        user.email = email;
        if(userId)  {
          user.id = userId;
          return BackendUserSrv.getUser(userId);
        } else {
          user.id = Utils.createUuid();
          return $q.when(user);
        }
      }).then(function(backendUser){
        angular.extend(user.data, backendUser.data);
        angular.extend(user.settings, backendUser.settings);
        StorageSrv.saveUser(user);
        LogSrv.trackInstall(user.id);
        launch();
      }, function(error){
        if(!error){error = {};}
        else if(typeof error === 'string'){error = {message: error};}
        error.email = email;
        LogSrv.trackError('network:userNotFound', error);

        StorageSrv.saveUser(user);
        launch();
      });
    });
  }

  function launch(){
    var user = StorageSrv.getUser();
    LogSrv.identify();

    // INIT is defined in top of index.html
    var launchTime = Date.now()-INIT;
    if(debug && ionic.Platform.isWebView()){ToastSrv.show('Application started in '+launchTime+' ms');}
    LogSrv.trackLaunch(user.id, launchTime);

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

    // phone will not sleep on states with attribute 'noSleep'
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      if(toState && toState.data && toState.data.noSleep){
        InsomniaSrv.keepAwake();
      } else {
        InsomniaSrv.allowSleepAgain();
      }
    });

    // show loadings
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
