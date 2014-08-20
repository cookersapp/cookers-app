angular.module('app', ['app.launch', 'app.auth', 'app.cart', 'app.recipe', 'app.user', 'ionic', 'ionic.contrib.ui.cards', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'firebase', 'ngStorage', 'angular-md5', 'monospaced.elastic'])

.config(function($stateProvider, $urlRouterProvider, $provide, debug){
  'use strict';

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
  var user = JSON.parse(localStorage.getItem('ngStorage-user'));
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

  // catch exceptions and send them to mixpanel !
  // http://bahmutov.calepin.co/catch-all-errors-in-angular-app.html
  $provide.decorator('$exceptionHandler', ['$delegate', function($delegate){
    return function(exception, cause){
      $delegate(exception, cause);

      var data = {
        type: 'angular',
        url: window.location.hash,
        localtime: Date.now()
      };
      if(cause)               { data.cause    = cause;              }
      if(exception){
        if(exception.message) { data.message  = exception.message;  }
        if(exception.name)    { data.name     = exception.name;     }
        if(exception.stack)   { data.stack    = exception.stack;    }
      }

      if(debug){
        console.log('exception', data);
        window.alert('Error: '+data.message);
      } else {
        mixpanel.track('exception', data);
      }
    };
  }]);
  window.onerror = function(message, url, line, col, error){
    var stopPropagation = debug ? false : true;
    var data = {
      type: 'javascript',
      url: window.location.hash,
      localtime: Date.now()
    };
    if(message)       { data.message      = message;      }
    if(url)           { data.fileName     = url;          }
    if(line)          { data.lineNumber   = line;         }
    if(col)           { data.columnNumber = col;          }
    if(error){
      if(error.name)  { data.name         = error.name;   }
      if(error.stack) { data.stack        = error.stack;  }
    }

    if(debug){
      console.log('exception', data);
      window.alert('Error: '+data.message);
    } else {
      mixpanel.track('exception', data);
    }
    return stopPropagation;
  };
})

.constant('debug', true)
.constant('appVersion', '~0.2.0')

.constant('firebaseUrl', 'https://crackling-fire-7710.firebaseio.com')
.constant('mandrillUrl', 'https://mandrillapp.com/api/1.0')
.constant('mandrillKey', '__YzrUYwZGkqqSM2pe9XFg')
.constant('supportTeamEmail', 'loicknuchel@gmail.com')

.constant('dataList', {
  foodCategories:   ['Viandes & Poissons', 'Fruits & Légumes', 'Pains & Pâtisseries', 'Frais', 'Surgelés', 'Épicerie salée', 'Épicerie sucrée', 'Boissons', 'Bébé', 'Bio', 'Hygiène & Beauté', 'Entretien & Nettoyage', 'Animalerie', 'Bazar & Textile'],
  recipeCategories: ['Plat principal', 'Entrée', 'Dessert', 'Vin'],
  currencies:       ['€'],
  servingUnits:     ['personnes'],
  timeUnits:        ['minutes', 'secondes'],
  quantityUnits:    ['g', 'kg', 'cl', 'litre', 'pièce'],
  foodRoles:        ['essentiel', 'secondaire', 'accompagnement', 'facultatif'],
  days:             ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
})
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
    email: '',
    name: 'Anonymous',
    avatar: 'images/user.jpg',
    background: '#6f5499',
    backgroundCover: 'images/profile-covers/cover01.jpg',
    firstName: '',
    lastName: '',
    score: {
      value: 0,
      level: {},
      events: []
    },
    device: {},
    profiles: {
      gravatar: {}
    },
    carts: [],
    standaloneCookedRecipes: [],
    settings: {
      defaultServings: 2,
      showPrices: false,
      bigImages: true
    }
  },
  data: {
    foods: [],
    recipes: [],
    recipesOfWeek: [],
    globalmessages: {
      lastCall: null,
      messages: []
    }
  },
  logs: {
    recipesHistory: [],
    launchs: []
  }
})

.run(function($rootScope, $location, $localStorage, $ionicPlatform, localStorageDefault, LaunchSrv, StorageSrv, appVersion, debug){
  'use strict';
  if(!$localStorage.app){$localStorage.app = localStorageDefault.app;}
  if(!$localStorage.user){$localStorage.user = localStorageDefault.user;}
  if(!$localStorage.data){$localStorage.data = localStorageDefault.data;}
  if(!$localStorage.logs){$localStorage.logs = localStorageDefault.logs;}

  if($localStorage.app.version !== appVersion && $localStorage.carts){
    StorageSrv.migrate($localStorage.app.version, appVersion);
    $localStorage.app.version = appVersion;
  }

  $rootScope.settings = $localStorage.user.settings;
  $rootScope.debug = debug;
  $rootScope.appVersion = appVersion;

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
