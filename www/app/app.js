angular.module('ionicApp', ['ionic', 'ngStorage', 'ionicApp.services', 'ionicApp.controllers', 'ionicApp.utils', 'ionicApp.tutorial', 'ionicApp.sidemenu', 'ionicApp.shoppinglist', 'ionicApp.informations'])


.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/sidemenu/home');

  $stateProvider
  .state('tutorial', {
    url: '/tutorial',
    templateUrl: 'app/tutorial/tutorial.html',
    controller: 'TutorialCtrl'
  })
  .state('sidemenu', {
    url: "/sidemenu",
    abstract: true,
    templateUrl: "app/layout/sidemenu.html",
    controller: 'SideMenuCtrl'
  })
  .state('sidemenu.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "app/home.html",
        controller: 'HomeCtrl'
      }
    }
  })
  .state('sidemenu.product', {
    url: "/product/:barcode?from",
    views: {
      'menuContent': {
        templateUrl: "app/product.html",
        controller: 'ProductCtrl'
      }
    }
  })
  // sidemenu.product.details
  .state('sidemenu.ingredient', {
    url: "/ingredient/:id?from",
    views: {
      'menuContent': {
        templateUrl: "app/ingredient.html",
        controller: 'IngredientCtrl'
      }
    }
  })
  .state('sidemenu.recipe', {
    url: "/recipe/:id?from",
    views: {
      'menuContent': {
        templateUrl: "app/recipe.html",
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
        templateUrl: "app/shoppinglist/tabs.html",
        controller: 'ShoppinglistCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.cart', {
    url: "/cart",
    views: {
      'cart-tab': {
        templateUrl: "app/shoppinglist/cart.html",
        controller: 'ShoppinglistCartCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.products', {
    url: "/products/:category",
    views: {
      'products-tab': {
        templateUrl: "app/shoppinglist/ingredients.html",
        controller: 'ShoppinglistProductsCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.recipes', {
    url: "/recipes",
    views: {
      'recipes-tab': {
        templateUrl: "app/shoppinglist/recipes.html",
        controller: 'ShoppinglistRecipesCtrl'
      }
    }
  })
  .state('sidemenu.feedback', {
    url: "/feedback",
    views: {
      'menuContent': {
        templateUrl: "app/infos/feedback.html",
        controller: 'FeedbackCtrl'
      }
    }
  })
  .state('sidemenu.faq', {
    url: "/faq",
    views: {
      'menuContent': {
        templateUrl: "app/infos/faq.html",
        controller: 'FaqCtrl'
      }
    }
  })
  .state('sidemenu.informations', {
    url: "/informations",
    views: {
      'menuContent': {
        templateUrl: "app/infos/informations.html",
        controller: 'InformationsCtrl'
      }
    }
  })
  .state('sidemenu.device', {
    url: "/device",
    views: {
      'menuContent': {
        templateUrl: "app/infos/device.html",
        controller: 'DeviceCtrl'
      }
    }
  });
});

