angular.module('ionicApp', ['ionic', 'ionicApp.controllers'])

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
  .state('sidemenu.shoppinglist.addproducts', {
    url: "/addproducts",
    templateUrl: "views/shoppinglist/addproducts.html",
    controller: 'ShoppinglistProductsCtrl'
  });
});

