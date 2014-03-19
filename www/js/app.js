angular.module('ionicApp', ['ionic', 'ngStorage', 'ionicApp.services', 'ionicApp.controllers'])


.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/sidemenu/home');

  $stateProvider
  .state('tutorial', {
    url: '/tutorial',
    templateUrl: 'templates/tutorial.html',
    controller: 'TutorialCtrl'
  })
  .state('sidemenu', {
    url: "/sidemenu",
    abstract: true,
    templateUrl: "templates/side-menu.html",
    controller: 'SideMenuCtrl'
  })
  .state('sidemenu.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "templates/home.html",
        controller: 'HomeCtrl'
      }
    }
  })
  .state('sidemenu.product', {
    url: "/product/:id?from",
    views: {
      'menuContent': {
        templateUrl: "templates/product.html",
        controller: 'ProductCtrl'
      }
    }
  })
  .state('sidemenu.ingredient', {
    url: "/ingredient/:id?from",
    views: {
      'menuContent': {
        templateUrl: "templates/ingredient.html",
        controller: 'IngredientCtrl'
      }
    }
  })
  .state('sidemenu.recipe', {
    url: "/recipe/:id?from",
    views: {
      'menuContent': {
        templateUrl: "templates/recipe.html",
        controller: 'RecipeCtrl'
      }
    }
  })
  .state('sidemenu.feedback', {
    url: "/feedback",
    views: {
      'menuContent': {
        templateUrl: "templates/feedback.html",
        controller: 'FeedbackCtrl'
      }
    }
  })
  .state('sidemenu.faq', {
    url: "/faq",
    views: {
      'menuContent': {
        templateUrl: "templates/faq.html",
        controller: 'FaqCtrl'
      }
    }
  })
  .state('sidemenu.informations', {
    url: "/informations",
    views: {
      'menuContent': {
        templateUrl: "templates/informations.html",
        controller: 'InformationsCtrl'
      }
    }
  })
  .state('sidemenu.device', {
    url: "/device",
    views: {
      'menuContent': {
        templateUrl: "templates/device.html",
        controller: 'DeviceCtrl'
      }
    }
  });
});

