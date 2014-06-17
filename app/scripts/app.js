angular.module('ionicApp', ['ionic', 'ngSanitize', 'ngAnimate', 'ngTouch', 'ngCordova', 'ngStorage'])

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
  .state('app.planning', {
    url: '/planning',
    views: {
      'menuContent' :{
        templateUrl: 'views/planning.html',
        controller: 'PlanningCtrl'
      }
    }
  })
  .state('app.planning2', {
    url: '/planning2',
    views: {
      'menuContent' :{
        templateUrl: 'views/planning2.html',
        controller: 'PlanningCtrl'
      }
    }
  })
  .state('app.meal', {
    url: '/meal/:mealId',
    views: {
      'menuContent' :{
        templateUrl: 'views/meal.html',
        controller: 'MealCtrl'
      }
    }
  })
  .state('app.shoppinglist', {
    url: '/shoppinglist',
    views: {
      'menuContent' :{
        templateUrl: 'views/shoppinglist.html',
        controller: 'ShoppinglistCtrl'
      }
    }
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
.value('localStorageDefault', {
  plannings: [],
  shoppinglists: {
    current: null,
    lists: []
  }
})

.run(function($localStorage, localStorageDefault){
  if(!$localStorage.plannings){$localStorage.plannings = localStorageDefault.plannings;}
  if(!$localStorage.shoppinglists){$localStorage.shoppinglists = localStorageDefault.shoppinglists;}
});
