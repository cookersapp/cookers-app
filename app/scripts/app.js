angular.module('ionicApp', ['ionic', 'ionic.contrib.ui.cards', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'ngStorage'])

.config(function($stateProvider, $urlRouterProvider) {
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
  .state('app.recipes2', {
    url: '/recipes2',
    views: {
      'menuContent' :{
        templateUrl: 'views/recipes2.html',
        controller: 'Recipes2Ctrl'
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
  .state('app.settings', {
    url: '/settings',
    views: {
      'menuContent' :{
        templateUrl: 'views/settings.html',
        controller: 'SettingsCtrl'
      }
    }
  });
})

.constant('APP_VERSION','0.0.1')

.constant('firebaseUrl', 'https://crackling-fire-7710.firebaseio.com')

.value('localStorageDefault', {
  user: {},
  weekrecipes: [],
  recipes: [],
  selectedRecipes: [],
  carts: {
    current: null,
    contents: []
  }
})

.run(function($rootScope, $location, $ionicPlatform, $localStorage, localStorageDefault, UserService){
  'use strict';
  if(!$localStorage.user){$localStorage.user = localStorageDefault.user;}
  if(!$localStorage.weekrecipes){$localStorage.weekrecipes = localStorageDefault.weekrecipes;}
  if(!$localStorage.recipes){$localStorage.recipes = localStorageDefault.recipes;}
  if(!$localStorage.selectedRecipes){$localStorage.selectedRecipes = localStorageDefault.selectedRecipes;}
  if(!$localStorage.carts){$localStorage.carts = localStorageDefault.carts;}

  /*$ionicPlatform.ready(function(){
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });*/

  $rootScope.isActive = function(viewLocation){
    var regex = new RegExp('^'+viewLocation+'$', 'g');
    return regex.test($location.path());
  };

  $rootScope.showIntro = false;
  if(UserService.isFirstLaunch()){
    $rootScope.showIntro = true;
    UserService.firstLaunch();
  } else {
    UserService.launch();
  }
});
