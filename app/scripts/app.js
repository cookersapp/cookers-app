angular.module('app', ['app.utils', 'app.logger', 'app.cart', 'ionic', 'ionic.contrib.ui.cards', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'firebase', 'ngStorage', 'angular-md5', 'monospaced.elastic'])

.config(function($stateProvider, $urlRouterProvider, $provide, debug){
  'use strict';

  $stateProvider
  .state('intro', {
    url: '/intro',
    templateUrl: 'views/intro.html',
    controller: 'IntroCtrl'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'views/login.html',
    controller: 'LoginCtrl',
    data: {
      restrict: 'notConnected'
    }
  })
  .state('login-email', {
    url: '/login-email',
    templateUrl: 'views/login-email.html',
    controller: 'LoginCtrl',
    data: {
      restrict: 'notConnected'
    }
  })
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
      'menuContent' :{
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.recipes', {
    url: '/recipes',
    views: {
      'menuContent' :{
        templateUrl: 'views/recipes.html',
        controller: 'RecipesCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.recipe', {
    url: '/recipe/:recipeId',
    views: {
      'menuContent' :{
        templateUrl: 'views/recipe.html',
        controller: 'RecipeCtrl'
      }
    },
    data: {
      noSleep: true,
      restrict: 'connected'
    }
  })
  .state('app.cart', {
    url: '/cart',
    abstract: true,
    views: {
      'menuContent' :{
        templateUrl: 'scrips/cart/main.html',
        controller: 'CartCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.cart.recipes', {
    url: '/recipes',
    templateUrl: 'scrips/cart/recipes.html',
    controller: 'CartRecipesCtrl',
    data: {
      restrict: 'connected'
    }
  })
  .state('app.cart.ingredients', {
    url: '/ingredients',
    templateUrl: 'scrips/cart/ingredients.html',
    controller: 'CartIngredientsCtrl',
    data: {
      noSleep: true,
      restrict: 'connected'
    }
  })
  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent' :{
        templateUrl: 'views/profile.html',
        controller: 'ProfileCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.feedback', {
    url: '/feedback?source',
    views: {
      'menuContent' :{
        templateUrl: 'views/feedback.html',
        controller: 'FeedbackCtrl'
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

  // catch exceptions in angular and send them to mixpanel !
  $provide.decorator('$exceptionHandler', ['$delegate', function($delegate){
    return function(exception, cause){
      $delegate(exception, cause);

      if(debug){
        console.log('exception', exception);
        window.alert('Error '+cause);
      } else {
        mixpanel.track('exception', {
          exception: exception,
          cause: cause,
          url: window.location.hash,
          localtime: Date.now()
        });
      }
    };
  }]);
})

.constant('debug', true)
.constant('appVersion', '~0.1.0')

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
    settings: {
      defaultServings: 2,
      //strictIngredients: false,
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

.run(function($rootScope, $location, $localStorage, localStorageDefault, LaunchSrv, StorageSrv, appVersion, debug){
  'use strict';
  if(!$localStorage.app){$localStorage.app = localStorageDefault.app;}
  if(!$localStorage.user){$localStorage.user = localStorageDefault.user;}
  if(!$localStorage.data){$localStorage.data = localStorageDefault.data;}
  if(!$localStorage.logs){$localStorage.logs = localStorageDefault.logs;}

  if($localStorage.app.version !== appVersion){
    StorageSrv.migrate($localStorage.app.version);
    $localStorage.app.version = appVersion;
  }

  $rootScope.settings = $localStorage.user.settings;
  $rootScope.debug = debug;
  $rootScope.appVersion = appVersion;

  LaunchSrv.launch();

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
