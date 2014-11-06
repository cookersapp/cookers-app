angular.module('app', ['ionic', 'ngSanitize', 'ngAnimate', 'ngTouch', 'pasvaz.bindonce', 'ngCordova', 'dcbImgFallback', 'monospaced.elastic'])

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

.constant('Config', Config)
.constant('supportTeamEmail', 'loic@cookers.io')

.constant('$ionicLoadingConfig', {
  template: '<loading color="rgba(255,255,255,0.7)"></loading>',
  noBackdrop: true
})

.constant('imagesPlaceholders', {
  recipe: {
    portrait: 'images/recipe_placeholder_384x524.jpg',
    landing: 'images/recipe_placeholder_400x225.jpg',
    thumbnail: 'images/recipe_placeholder_200x200.jpg'
  }
})

.value('localStorageDefault', {
  app: { version: '' },
  userCarts: { carts: [] },
  userStandaloneCookedRecipes: { recipes: [] },
  userRecipeHistory: { recipes: [] },
  dataFoods: { foods: {} },
  dataRecipes: { recipes: {} },
  dataSelections: { selections: {} },
  dataGlobalmessages: {
    lastCall: null,
    messages: [],
    hiddenMessageIds: []
  }
})

.run(function($rootScope, $location, LaunchSrv, StorageSrv, imagesPlaceholders, Config, PerfSrv){
  'use strict';
  var user = StorageSrv.getUser();
  $rootScope.ctx = {
    cfg: {
      imagesPlaceholders: imagesPlaceholders
    },
    settings: user ? user.settings : {defaultServings: 2},
    debug: Config.debug,
    appVersion: Config.appVersion
  };

  LaunchSrv.launch().then(function(){
    user = StorageSrv.getUser();
    if(user){
      $rootScope.ctx.settings = user.settings;
    }
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
