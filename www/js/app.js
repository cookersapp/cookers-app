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
    url: "/product/:barcode?from",
    views: {
      'menuContent': {
        templateUrl: "templates/product.html",
        controller: 'ProductCtrl'
      }
    }
  })
  // sidemenu.product.details
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
  // sidemenu.recipe.cook
  // sidemenu.meal
  .state('sidemenu.shoppinglist', {
    url: "/shoppinglist",
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: "templates/shoppinglist/tabs.html",
        controller: 'ShoppinglistCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.cart', {
    url: "/cart",
    views: {
      'cart-tab': {
        templateUrl: "templates/shoppinglist/cart.html",
        controller: 'ShoppinglistCartCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.products', {
    url: "/products/:category",
    views: {
      'products-tab': {
        templateUrl: "templates/shoppinglist/ingredients.html",
        controller: 'ShoppinglistProductsCtrl'
      }
    }
  })
  .state('sidemenu.shoppinglist.recipes', {
    url: "/recipes",
    views: {
      'recipes-tab': {
        templateUrl: "templates/shoppinglist/recipes.html",
        controller: 'ShoppinglistRecipesCtrl'
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

