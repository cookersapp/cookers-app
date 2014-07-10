angular.module('ionicApp', ['ionic', 'ionic.contrib.ui.cards', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'ngStorage', 'angular-md5'])

.config(function($stateProvider, $urlRouterProvider){
  'use strict';
  $urlRouterProvider.otherwise('/app/home');

  $stateProvider
  .state('intro', {
    url: '/intro',
    templateUrl: 'views/intro.html',
    controller: 'IntroCtrl'
  })
  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'views/sidemenu.html',
    controller: 'AppCtrl'
  })
  .state('app.home', {
    url: '/home',
    views: {
      'menuContent' :{
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      }
    }
  })
  .state('app.recipes', {
    url: '/recipes',
    views: {
      'menuContent' :{
        templateUrl: 'views/recipes.html',
        controller: 'RecipesCtrl'
      }
    }
  })
  .state('app.recipe', {
    url: '/recipe/:recipeId',
    views: {
      'menuContent' :{
        templateUrl: 'views/recipe.html',
        controller: 'RecipeCtrl'
      }
    }
  })
  .state('app.cart', {
    url: '/cart',
    abstract: true,
    views: {
      'menuContent' :{
        templateUrl: 'views/cart/main.html',
        controller: 'CartCtrl'
      }
    }
  })
  .state('app.cart.recipes', {
    url: '/recipes',
    templateUrl: 'views/cart/recipes.html',
    controller: 'CartRecipesCtrl'
  })
  .state('app.cart.ingredients', {
    url: '/ingredients',
    templateUrl: 'views/cart/ingredients.html',
    controller: 'CartIngredientsCtrl'
  })
  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent' :{
        templateUrl: 'views/profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })
  .state('app.feedback', {
    url: '/feedback',
    views: {
      'menuContent' :{
        templateUrl: 'views/feedback.html',
        controller: 'FeedbackCtrl'
      }
    }
  })
  .state('app.debug', {
    url: '/debug',
    views: {
      'menuContent' :{
        templateUrl: 'views/debug.html',
        controller: 'DebugCtrl'
      }
    }
  });
})

.constant('debug', true)
.constant('APP_VERSION', '0.0.1')

.constant('firebaseUrl', 'https://crackling-fire-7710.firebaseio.com')
.constant('mandrillUrl', 'https://mandrillapp.com/api/1.0')
.constant('mandrillKey', '__YzrUYwZGkqqSM2pe9XFg')
.constant('supportTeamMail', 'loicknuchel@gmail.com')

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
  user: {
    settings: {
      showPrices: false,
      bigImages: true
    }
  },
  foods: [],
  recipes: [],
  weekrecipes: [],
  recipesHistory: [],
  carts: {
    current: null,
    contents: []
  },
  userinfo: {
    lastCall: null,
    messages: []
  }
})

.run(function($rootScope, $location, $ionicPlatform, $localStorage, localStorageDefault, UserSrv, LogSrv, debug, APP_VERSION){
  'use strict';
  if(!$localStorage.user){$localStorage.user = localStorageDefault.user;}
  if(!$localStorage.foods){$localStorage.foods = localStorageDefault.foods;}
  if(!$localStorage.recipes){$localStorage.recipes = localStorageDefault.recipes;}
  if(!$localStorage.weekrecipes){$localStorage.weekrecipes = localStorageDefault.weekrecipes;}
  if(!$localStorage.recipesHistory){$localStorage.recipesHistory = localStorageDefault.recipesHistory;}
  if(!$localStorage.carts){$localStorage.carts = localStorageDefault.carts;}
  if(!$localStorage.userinfo){$localStorage.userinfo = localStorageDefault.userinfo;}
  
  LogSrv.trackStates();

  $rootScope.settings = $localStorage.user.settings;
  $rootScope.debug = debug;
  $rootScope.appVersion = APP_VERSION;

  $rootScope.showIntro = false;
  if(UserSrv.isFirstLaunch()){
    $rootScope.showIntro = true;
    UserSrv.firstLaunch();
  } else {
    UserSrv.launch();
  }

  $rootScope.isActive = function(viewLocation){
    var regex = new RegExp('^'+viewLocation+'$', 'g');
    return regex.test($location.path());
  };
});
