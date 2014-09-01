angular.module('app', ['ionic', 'ionic.contrib.ui.cards', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'firebase', 'angular-md5', 'monospaced.elastic'])

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

      Logger.track('exception', data);
    };
  }]);

  $stateProvider
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'views/sidemenu.html',
    controller: 'AppCtrl',
    data: {
      restrict: 'connected'
    }
  })
  .state('app.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  });

  // choose default route depending on application state
  var user = JSON.parse(localStorage.getItem('ionic-user'));
  if(user){
    if(user.skipIntro){
      if(user.isLogged){
        $urlRouterProvider.otherwise('/app/home');
      } else {
        $urlRouterProvider.otherwise('/login');
      }
    } else {
      $urlRouterProvider.otherwise('/intro');
    }
  } else {
    $urlRouterProvider.otherwise('/intro');
  }
})

.constant('debug', Config.debug)
.constant('appVersion', Config.appVersion)

.constant('firebaseUrl', 'https://crackling-fire-7710.firebaseio.com')
.constant('mandrillUrl', 'https://mandrillapp.com/api/1.0')
.constant('mandrillKey', '__YzrUYwZGkqqSM2pe9XFg')
.constant('supportTeamEmail', 'loicknuchel@gmail.com')

.constant('unitConversion', [
  {ref: 'g', convert: [
    {unit: 'g', factor: 1},
    {unit: 'kg', factor: 1000}
  ]},
  {ref: 'ml', convert: [
    {unit: 'cl', factor: 10},
    {unit: 'litre', factor: 1000}
  ]}
])

.value('localStorageDefault', {
  app: {
    version: '',
    firstLaunch: Date.now()
  },
  user: {
    skipIntro: false,
    isLogged: false,
    loggedWith: null,
    email: '',
    name: 'Anonymous',
    avatar: 'images/user.jpg',
    background: '#6f5499',
    backgroundCover: 'images/profile-covers/cover01.jpg',
    firstName: '',
    lastName: '',
    more: {},
    device: {},
    settings: {
      defaultServings: 2,
      showPrices: false,
      bigImages: true
    },
    data: {
      skipCookFeatures: false,
      skipCartFeatures: false
    }
  },
  userSocialProfiles: {},
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

.run(function($rootScope, $location, $ionicPlatform, LaunchSrv, StorageSrv, appVersion, debug){
  'use strict';
  StorageSrv.init();

  $rootScope.ctx = {
    settings: StorageSrv.getUser().settings,
    debug: debug,
    appVersion: appVersion
  };

  $ionicPlatform.ready(function(){
    LaunchSrv.launch();
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
});
