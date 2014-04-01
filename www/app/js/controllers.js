angular.module('ionicApp.controllers', [])


.controller('SideMenuCtrl', function($scope, $state, $localStorage){
  $scope.$storage = $localStorage;

  // Check if the user already did the tutorial and play it if not
  if(!$scope.$storage.didTutorial) {
    $state.go('tutorial');
  }

  $scope.sideMenuClick = function(path, args){
    $state.go(path, args);
    $scope.sideMenuController.close();
  };

  $scope.leftButtons = [{
    type: 'button-icon button-clear ion-navicon',
    tap: function(e) {
      $scope.sideMenuController.toggleLeft();
    }
  }];
})


.controller('ScanCtrl', function($scope, $state, $stateParams){
  var from = $stateParams.from;

  cordova.plugins.barcodeScanner.scan(
    function (result) {
      if(!result.cancelled){
        $state.go('sidemenu.product', {barcode: result.text, from: from});
      } else {
        $state.go($rootScope.$previousState);
      }
    }, 
    function (error) {
      alert("Scanning failed: " + error);
    }
  );
})


.controller('HomeCtrl', function($scope, RecipeService, UserService){
  $scope.boughtRecipes = [];

  var boughtRecipesIds = _.map(UserService.getBoughtRecipes(5), function(hist){return hist.id;});

  RecipeService.getAsync(boughtRecipesIds).then(function(recipes){
    $scope.boughtRecipes = recipes;
  });
})


.controller('HistoryCtrl', function($scope, ProductService, RecipeService, UserService){
  $scope.recipeHistory = [];
  $scope.productHistory = [];

  var recipeHistoryIds = _.map(UserService.getSeenRecipes(5), function(hist){return hist.id;});
  console.log(recipeHistoryIds);
  var productHistoryIds = _.map(UserService.getScannedProducts(5), function(hist){return hist.id;});

  RecipeService.getAsync(recipeHistoryIds).then(function(recipes){
    $scope.recipeHistory = recipes;
  });
  ProductService.getAsync(productHistoryIds).then(function(products){
    $scope.productHistory = products;
  });
})


.controller('ProductCtrl', function($scope, $stateParams, ProductService, RecipeService, UserService){
  var barcode = $stateParams.barcode;
  var from = $stateParams.from;

  $scope.product = {
    barcode: barcode
  };
  $scope.linkedRecipes = [];

  ProductService.getAsync(barcode).then(function(product){
    $scope.product = product;
    if(product){
      UserService.seeProduct(product);
      RecipeService.getAsync(product.linkedRecipes).then(function(recipes){
        $scope.linkedRecipes = recipes;
      });
    }
  });
})


.controller('IngredientCtrl', function($scope, $stateParams){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.ingredient = {
    id: id
  };
})


.controller('RecipeCtrl', function($scope, $state, $stateParams, RecipeService, ShoppinglistService, ModalService, UserService){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.recipe = {
    id: id
  };
  RecipeService.getAsync(id).then(function(recipe){
    $scope.recipe = recipe;
    UserService.seeRecipe(recipe);
  });

  // add ingredients to list
  $scope.ingredientsModal = {};
  ModalService.recipe.addIngredientsToList($scope, function(modal) {
    $scope.ingredientsModal.modal = modal;
  });
  $scope.ingredientsModal.open = function(){
    $scope.ingredientsModal.data = {
      recipe: $scope.recipe,
      ingredients: $scope.recipe.ingredients
    };
    for(var i in $scope.ingredientsModal.data.ingredients){
      var ingredient = $scope.ingredientsModal.data.ingredients[i];
      ingredient.shouldAdd = ingredient.role !== 'usual';
    }
    $scope.ingredientsModal.modal.show();
  };
  $scope.ingredientsModal.close = function(){
    $scope.ingredientsModal.modal.hide();
  };
  $scope.ingredientsModal.addToCart = function(){
    for(var i in $scope.ingredientsModal.data.ingredients){
      var ingredient = $scope.ingredientsModal.data.ingredients[i];
      if(ingredient.shouldAdd){
        ShoppinglistService.addToCurrentCart(ingredient, "("+$scope.recipe.name+")", ingredient.quantity, ingredient.unit);
      }
    }
    $scope.ingredientsModal.modal.hide();
    UserService.boughtRecipe($scope.ingredientsModal.data.recipe);
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
