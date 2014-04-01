angular.module('ionicApp.controllers', [])


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


.controller('RecipeCtrl', function($scope, $state, $stateParams, RecipeService, ShoppinglistService, ModalService){
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
  ModalService.recipe.addIngredientsToList($scope, function(modal) {
    $scope.ingredientsModal.modal = modal;
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
      ShoppinglistService.addToCurrentCart(ingredient, "("+$scope.recipe.name+")", ingredient.quantity, ingredient.unit);
    }
    $scope.ingredientsModal.modal.hide();
    $state.go('sidemenu.shoppinglist.cart');
  };

  $scope.$on('$destroy', function() {
    $scope.ingredientsModal.modal.remove();
  });
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
