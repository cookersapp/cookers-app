angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.cart', {
    url: '/cart',
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: 'scripts/cart/cart.html',
        controller: 'CartCtrl'
      }
    }
  })
  .state('app.cart.recipes', {
    url: '/recipes',
    templateUrl: 'scripts/cart/cart-recipes.html',
    controller: 'CartRecipesCtrl'
  })
  .state('app.cart.ingredients', {
    url: '/ingredients',
    templateUrl: 'scripts/cart/cart-ingredients.html',
    controller: 'CartIngredientsCtrl',
    data: {
      noSleep: true
    }
  })
  .state('app.cart.selfscan', {
    url: '/selfscan',
    templateUrl: 'scripts/cart/cart-selfscan.html',
    controller: 'CartIngredientsCtrl',
    data: {
      noSleep: true
    }
  });
});
