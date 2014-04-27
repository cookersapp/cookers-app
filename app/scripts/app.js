angular.module('ionicApp', ['ionic', 'ngStorage', 'ionicApp.services', 'ionicApp.controllers'])

.run(function($ionicPlatform) {
  'use strict';
  $ionicPlatform.ready(function() {
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  'use strict';
  $urlRouterProvider.otherwise('/sidemenu/home');

  $stateProvider
  .state('sidemenu', {
    url: "/sidemenu",
    abstract: true,
    templateUrl: "views/sidemenu.html",
    controller: 'SideMenuCtrl'
  })
  .state('sidemenu.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "views/home.html",
        controller: 'HomeCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist', {
    url: "/shoppinglist",
    abstract: true,
    views: {
      'menuContent': {
        template: "<ui-view></ui-view>",
        controller: 'ShoppinglistCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.cart', {
    url: "/cart",
    templateUrl: "views/shoppinglist/current.html",
    controller: 'ShoppinglistCartCtrl'
  })
  .state('sidemenu.shoppinglist.addingredients', {
    url: "/addproducts",
    templateUrl: "views/shoppinglist/addingredients.html",
    controller: 'ShoppinglistProductsCtrl'
  })
  .state('sidemenu.recipes', {
    url: "/recipes",
    abstract: true,
    views: {
      'menuContent': {
        template: "<ui-view></ui-view>",
        controller: 'RecipesCtrl'
      }
    }
  })
  .state('sidemenu.recipes.search', {
    url: "/search",
    templateUrl: "views/recipes/search.html",
    controller: 'RecipesSearchCtrl'
  })
  .state('sidemenu.recipes.results', {
    url: "/results",
    templateUrl: "views/recipes/results.html",
    controller: 'RecipesResultsCtrl'
  })
  .state('sidemenu.recipes.recipe', {
    url: "/:id",
    templateUrl: "views/recipes/recipe.html",
    controller: 'RecipeCtrl'
  });
});

