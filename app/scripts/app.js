angular.module('ionicApp', ['ionic', 'ngStorage', 'ionicApp.services', 'ionicApp.controllers', 'ionicApp.filters'])

.run(function($ionicPlatform) {
  'use strict';
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      window.StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  'use strict';
  $urlRouterProvider.otherwise('/sidemenu/home');

  $stateProvider
  .state('scan', {
    url: '/scan',
    template: '',
    controller: 'ScanCtrl'
  })
  .state('sidemenu', {
    url: '/sidemenu',
    abstract: true,
    templateUrl: 'views/sidemenu.html',
    controller: 'SideMenuCtrl'
  })
  .state('sidemenu.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist', {
    url: '/shoppinglist',
    abstract: true,
    views: {
      'menuContent': {
        template: '<ui-view></ui-view>',
        controller: 'ShoppinglistCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.cart', {
    url: '/cart',
    templateUrl: 'views/shoppinglist/current.html',
    controller: 'ShoppinglistCartCtrl'
  })
  .state('sidemenu.shoppinglist.ingredients', {
    url: '/ingredients/:category',
    templateUrl: 'views/shoppinglist/ingredients.html',
    controller: 'ShoppinglistIngredientsCtrl'
  })
  .state('sidemenu.recipes', {
    url: '/recipes',
    abstract: true,
    views: {
      'menuContent': {
        template: '<ui-view></ui-view>',
        controller: 'RecipesCtrl'
      }
    }
  })
  .state('sidemenu.recipes.search', {
    url: '/search',
    templateUrl: 'views/recipes/search.html',
    controller: 'RecipesSearchCtrl'
  })
  .state('sidemenu.recipes.results', {
    url: '/results',
    templateUrl: 'views/recipes/results.html',
    controller: 'RecipesResultsCtrl'
  })
  .state('sidemenu.recipes.recipe', {
    url: '/:id',
    templateUrl: 'views/recipes/recipe.html',
    controller: 'RecipeCtrl'
  })
  .state('sidemenu.product', {
    url: '/product/:barcode?from',
    views: {
      'menuContent': {
        templateUrl: 'views/products/product.html',
        controller: 'ProductCtrl'
      }
    }
  })
  .state('sidemenu.logs', {
    url: '/logs',
    views: {
      'menuContent': {
        templateUrl: 'views/hidden/logs.html',
        controller: 'LogsCtrl'
      }
    }
  })
  .state('sidemenu.device', {
    url: '/device',
    views: {
      'menuContent': {
        templateUrl: 'views/hidden/device.html',
        controller: 'DeviceCtrl'
      }
    }
  });
});

