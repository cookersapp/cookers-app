angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.cart', {
    url: '/cart',
    views: {
      'menuContent': {
        templateUrl: 'scripts/cart/cart.html',
        controller: 'CartCtrl'
      }
    }
  });
});
