angular.module('ionicApp', ['ionic', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'ionicApp.controllers'])

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
  $urlRouterProvider.otherwise('/app/home');
  
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
  });
});

