angular.module('ionicApp', ['ionic', 'ngStorage', 'google-maps', 'ionicApp.services', 'ionicApp.controllers', 'ionicApp.tutorial', 'ionicApp.shoppinglist'])


.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/sidemenu/home');

  $stateProvider
  .state('tutorial', {
    url: '/tutorial',
    templateUrl: 'app/views/tutorial/tutorial.html',
    controller: 'TutorialCtrl'
  })
  .state('scan', {
    url: "/scan",
    template: "",
    controller: 'ScanCtrl'
  })
  .state('sidemenu', {
    url: "/sidemenu",
    abstract: true,
    templateUrl: "app/views/sidemenu.html",
    controller: 'SideMenuCtrl'
  })
  .state('sidemenu.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "app/views/home.html",
        controller: 'HomeCtrl'
      }
    }
  })
  .state('sidemenu.history', {
    url: "/history",
    views: {
      'menuContent': {
        templateUrl: "app/views/history/all.html",
        controller: 'HistoryCtrl'
      }
    }
  })
  .state('sidemenu.googlemap', {
    url: "/googlemap",
    views: {
      'menuContent': {
        templateUrl: "app/views/map/googlemap.html",
        controller: 'GoogleMapCtrl'
      }
    }
  })
  .state('sidemenu.product', {
    url: "/product/:barcode?from",
    views: {
      'menuContent': {
        templateUrl: "app/views/products/product.html",
        controller: 'ProductCtrl'
      }
    }
  })
  // sidemenu.product.details
  .state('sidemenu.ingredient', {
    url: "/ingredient/:id?from",
    views: {
      'menuContent': {
        templateUrl: "app/views/ingredients/ingredient.html",
        controller: 'IngredientCtrl'
      }
    }
  })
  .state('sidemenu.recipe', {
    url: "/recipe/:id?from",
    views: {
      'menuContent': {
        templateUrl: "app/views/recipes/recipe.html",
        controller: 'RecipeCtrl'
      }
    }
  })
  // sidemenu.recipe.cook
  // sidemenu.meal
  .state('sidemenu.shoppinglist', {
    url: "/shoppinglist",
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: "app/views/shoppinglist/tabs.html",
        controller: 'ShoppinglistCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.cart', {
    url: "/cart",
    views: {
      'cart-tab': {
        templateUrl: "app/views/shoppinglist/cart.html",
        controller: 'ShoppinglistCartCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.products', {
    url: "/products/:category",
    views: {
      'products-tab': {
        templateUrl: "app/views/shoppinglist/products.html",
        controller: 'ShoppinglistProductsCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.recipes', {
    url: "/recipes",
    views: {
      'recipes-tab': {
        templateUrl: "app/views/shoppinglist/recipes.html",
        controller: 'ShoppinglistRecipesCtrl'
      }
    }
  })
  .state('sidemenu.feedback', {
    url: "/feedback",
    views: {
      'menuContent': {
        templateUrl: "app/views/infos/feedback.html",
        controller: 'FeedbackCtrl'
      }
    }
  })
  .state('sidemenu.faq', {
    url: "/faq",
    views: {
      'menuContent': {
        templateUrl: "app/views/infos/faq.html",
        controller: 'FaqCtrl'
      }
    }
  })
  .state('sidemenu.informations', {
    url: "/informations",
    views: {
      'menuContent': {
        templateUrl: "app/views/infos/informations.html",
        controller: 'InformationsCtrl'
      }
    }
  })
  .state('sidemenu.device', {
    url: "/device",
    views: {
      'menuContent': {
        templateUrl: "app/views/infos/device.html",
        controller: 'DeviceCtrl'
      }
    }
  });
})

.run(function($rootScope) {
  $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from, fromParams) {
    $rootScope.$previousState = from;
  });
});

