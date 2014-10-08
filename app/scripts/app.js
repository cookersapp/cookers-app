angular.module('app', ['ionic', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'monospaced.elastic', 'pasvaz.bindonce'])

.config(function($stateProvider, $urlRouterProvider, $provide){
  'use strict';
  // catch exceptions in angular
  $provide.decorator('$exceptionHandler', ['$delegate', function($delegate){
    return function(exception, cause){
      $delegate(exception, cause);

      var data = {
        type: 'angular'
      };
      if(cause)               { data.cause    = cause;              }
      if(exception){
        if(exception.message) { data.message  = exception.message;  }
        if(exception.name)    { data.name     = exception.name;     }
        if(exception.stack)   { data.stack    = exception.stack;    }
      }

      Logger.track('exception', {data: data});
    };
  }]);

  $stateProvider
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'views/sidemenu.html',
    controller: 'AppCtrl'
  })
  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      }
    }
  });

  // set default route
  $urlRouterProvider.otherwise('/app/home');
})

.constant('debug', Config.debug)
.constant('appVersion', Config.appVersion)

.constant('backendUrl', Config.backendUrl)
.constant('firebaseUrl', 'https://crackling-fire-7710.firebaseio.com')
.constant('mandrillUrl', 'https://mandrillapp.com/api/1.0')
.constant('mandrillKey', '__YzrUYwZGkqqSM2pe9XFg')
.constant('supportTeamEmail', 'loic@cookers.io')

.constant('$ionicLoadingConfig', {
  template: '<loading color="rgba(255,255,255,0.7)"></loading>',
  noBackdrop: true
})

.value('localStorageDefault', {
  app: {
    version: '',
    firstLaunch: Date.now()
  },
  userCarts: { carts: [] },
  userStandaloneCookedRecipes: { recipes: [] },
  userRecipeHistory: { recipes: [] },
  dataFoods: { foods: {} },
  dataRecipes: { recipes: {} },
  dataSelections: { selections: {} },
  dataGlobalmessages: {
    lastCall: null,
    messages: []
  }
})

.run(function($rootScope, $location, LaunchSrv, StorageSrv, appVersion, debug, PerfSrv){
  'use strict';
  LaunchSrv.launch().then(function(){
    $rootScope.ctx = {
      settings: StorageSrv.getUser().settings,
      debug: debug,
      appVersion: appVersion
    };
  });

  // utils methods
  $rootScope.isActive = function(viewLocation){
    var regex = new RegExp('^'+viewLocation+'$', 'g');
    return regex.test($location.path());
  };
  $rootScope.safeApply = function(fn){
    var phase = this.$root ? this.$root.$$phase : this.$$phase;
    if(phase === '$apply' || phase === '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  // perfs :
  /*var body = angular.element(document.getElementsByTagName('body'));
  var digests = 0;
  $rootScope.$watch(function() {
    digests++;
    var watchers = PerfSrv.getWatchesForElement(body);
    console.log(digests + ' calls ('+watchers.length+' watches)');
  });*/
});
