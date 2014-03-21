angular.module('ionicApp.controllers', [])


.controller('TutorialCtrl', function($scope, $state, $localStorage){
  $scope.$storage = $localStorage;

  function startApp(){
    $state.go('sidemenu.home');
    $scope.$storage.didTutorial = true;
  }

  // Move to the next slide
  $scope.next = function() {
    $scope.$broadcast('slideBox.nextSlide');
  };

  // Our initial right buttons
  var rightButtons = [
    {
      content: 'Next',
      type: 'button-positive button-clear',
      tap: function(e) {
        // Go to the next slide on tap
        $scope.next();
      }
    }
  ];

  // Our initial left buttons
  var leftButtons = [
    {
      content: 'Skip',
      type: 'button-positive button-clear',
      tap: function(e) {
        // Start the app on tap
        startApp();
      }
    }
  ];

  // Bind the left and right buttons to the scope
  $scope.leftButtons = leftButtons;
  $scope.rightButtons = rightButtons;


  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    // Check if we should update the left buttons
    if(index > 0) {
      // If this is not the first slide, give it a back button
      $scope.leftButtons = [
        {
          content: 'Back',
          type: 'button-positive button-clear',
          tap: function(e) {
            // Move to the previous slide
            $scope.$broadcast('slideBox.prevSlide');
          }
        }
      ];
    } else {
      // This is the first slide, use the default left buttons
      $scope.leftButtons = leftButtons;
    }

    // If this is the last slide, set the right button to
    // move to the app
    if(index == 2) {
      $scope.rightButtons = [
        {
          content: 'Start using MyApp',
          type: 'button-positive button-clear',
          tap: function(e) {
            startApp();
          }
        }
      ];
    } else {
      // Otherwise, use the default buttons
      $scope.rightButtons = rightButtons;
    }
  };
})


.controller('SideMenuCtrl', function($scope, $state, $localStorage){
  $scope.$storage = $localStorage;

  // Check if the user already did the tutorial and play it if not
  if(!$scope.$storage.didTutorial) {
    $state.go('tutorial');
  }

  $scope.sideMenuClick = function(path, args){
    if(path === 'scan'){
      $scope.sideMenuController.close();
      $scope.makeScan();
    } else {
      $state.go(path, args);
      $scope.sideMenuController.close();
    }
  };

  $scope.leftButtons = [{
    type: 'button-icon button-clear ion-navicon',
    tap: function(e) {
      $scope.sideMenuController.toggleLeft();
    }
  }];

  $scope.makeScan = function(from) {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        if(!result.cancelled){
          $state.go('sidemenu.product', {barcode: result.text, from: from});
        }
      }, 
      function (error) {
        alert("Scanning failed: " + error);
      }
    );
  };
})


.controller('HomeCtrl', function($scope){

})


.controller('ProductCtrl', function($scope, $stateParams, ProductService, RecipeService){
  var barcode = $stateParams.barcode;
  var from = $stateParams.from;

  $scope.product = {
    barcode: barcode
  };
  $scope.linkedRecipes = [];

  ProductService.getAsync(barcode).then(function(product){
    $scope.product = product;
    RecipeService.getAllAsync(product.linkedRecipes).then(function(recipes){
      $scope.linkedRecipes = recipes;
    });
  });
})


.controller('IngredientCtrl', function($scope, $stateParams){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.ingredient = {
    id: id
  };
})


.controller('RecipeCtrl', function($scope, $state, $stateParams, $ionicModal, RecipeService, ShoppinglistService){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.recipe = {
    id: id
  };
  RecipeService.getAsync(id).then(function(recipe){
    $scope.recipe = recipe;
  });

  // add ingredients to list
  $scope.ingredientsModal = {};
  $ionicModal.fromTemplateUrl('templates/add-recipe-ingredients.modal.html', function(modal) {
    $scope.ingredientsModal.modal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
  $scope.ingredientsModal.open = function(){
    $scope.ingredientsModal.data = {
      ingredients: $scope.recipe.ingredients
    };
    $scope.ingredientsModal.modal.show();
  };
  $scope.ingredientsModal.close = function(){
    $scope.ingredientsModal.modal.hide();
  };
  $scope.ingredientsModal.addToCart = function(){
    for(var i in $scope.ingredientsModal.data.ingredients){
      var ingredient = $scope.ingredientsModal.data.ingredients[i];
      ShoppinglistService.addToCurrentCart(ingredient.ingredient, "("+$scope.recipe.name+")", ingredient.quantity, ingredient.unit);
    }
    $scope.ingredientsModal.modal.hide();
    $state.go('sidemenu.shoppinglist.cart');
  };

  $scope.$on('$destroy', function() {
    $scope.ingredientsModal.modal.remove();
  });
})


.controller('ShoppinglistCtrl', function($scope, $ionicModal, ShoppinglistService){
  $scope.rightButtons = [];
  $scope.current = {
    cart: ShoppinglistService.getCurrentCart()
  };


  $scope.cartItemClick = function(item){
    // TODO
    console.log('click on item', item);
  };

  $scope.isInCart = function(ingredient){
    return ShoppinglistService.getCurrentCartItem(ingredient)!== undefined;
  };

  $scope.rightButtons = [
    {
      type: 'button-icon button-clear ion-compose',
      tap: function(e) {
        $scope.cartModal.open();
      }
    },
    {
      type: 'button-icon button-clear ion-shuffle',
      tap: function(e) {
        $scope.changeCart();
      }
    }
  ];

  $scope.changeCart = function(){
    console.log('TODO : changeCart');
  };

  // edit cart modal
  $scope.cartModal = {};
  $ionicModal.fromTemplateUrl('templates/shoppinglist/edit-cart.modal.html', function(modal) {
    $scope.cartModal.modal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });
  $scope.cartModal.open = function(){
    $scope.cartModal.title = "Informations liste";
    $scope.cartModal.data = {
      name: $scope.current.cart.name
    };
    $scope.cartModal.modal.show();
  };
  $scope.cartModal.close = function(){
    $scope.cartModal.modal.hide();
  };
  $scope.cartModal.deleteCart = function(){
    // TODO delete cart !!!
    ShoppinglistService.clearCurrentCart();
    $scope.cartModal.modal.hide();
  };
  $scope.cartModal.save = function(){
    $scope.current.cart.name = $scope.cartModal.data.name;
    $scope.cartModal.modal.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.cartModal.modal.remove();
  });
})


.controller('ShoppinglistCartCtrl', function($scope){

})


.controller('ShoppinglistProductsCtrl', function($scope, $state, $stateParams, IngredientService, ShoppinglistService, UtilService){
  var category = $stateParams.category ? $stateParams.category : 'root';

  $scope.ingredient = {};
  $scope.rowIngredients = [];
  IngredientService.getAsync(category).then(function(ingredient){
    $scope.ingredient = ingredient;
    if($scope.ingredient.products){
      $scope.rowIngredients = UtilService.toRows(_.filter($scope.ingredient.products, function(product){
        return product.grid;
      }), 4);
    }
  });

  $scope.ingredientClick = function(ingredient){
    if(ingredient.isCategory){
      $state.go('sidemenu.shoppinglist.products', {category: ingredient.id});
    } else {
      var cartItem = ShoppinglistService.getCurrentCartItem(ingredient);
      if(cartItem){
        console.log('TODO: show cart item details !');
        $scope.cartItemClick(cartItem);
      } else {
        ShoppinglistService.addToCurrentCart(ingredient);
      }
    }
  };
})


.controller('ShoppinglistRecipesCtrl', function($scope){

})


.controller('FeedbackCtrl', function($scope){

})


.controller('FaqCtrl', function($scope){

})


.controller('InformationsCtrl', function($scope){
  $scope.app = {
    version: "0.0.1"
  };
})


.controller('DeviceCtrl', function($scope, $localStorage){
  $scope.$storage = $localStorage;

  ionic.Platform.ready(function(){
    $scope.device = ionic.Platform.device();
  });

  $scope.resetApp = function(){
    $scope.$storage.$reset();
    alert('Application réinitialisée !');
    ionic.Platform.exitApp();
  };
});
