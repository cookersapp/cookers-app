angular.module('ionicApp')

.controller('AppCtrl', function($scope){
  'use strict';

})

.controller('HomeCtrl', function($scope){
  'use strict';

})

.controller('RecipesCtrl', function($scope, WeekrecipeService, CartService){
  'use strict';
  $scope.weekrecipes = [];
  WeekrecipeService.get(27).then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes;
  });

  $scope.cartHasRecipe = CartService.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    // TODO add toast
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    // TODO add toast
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, RecipeService, CartService){
  'use strict';
  $scope.recipe = {};
  RecipeService.get($stateParams.recipeId).then(function(recipe){
    $scope.recipe = recipe;
  });

  $scope.cartHasRecipe = CartService.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    // TODO add toast
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    // TODO add toast
  };
})

.controller('CartCtrl', function($scope, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();
  $scope.archiveCart = function(){
    if(confirm('Archiver cette liste ?')){
      CartService.archiveCart();
    }
  };
})

.controller('CartRecipesCtrl', function($scope, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();

  $scope.removeRecipeFromCart = function(recipe){
    if(CartService.hasCarts()){
      CartService.removeRecipeFromCart(recipe);
    }
    // TODO add toast
  };
})

.controller('CartIngredientsCtrl', function($scope, CartService){
  'use strict';
  $scope.items = CartService.getCurrentCartItems();
  $scope.boughtItems = CartService.getCurrentCartBoughtItems();

  $scope.buyItem = function(item){
    CartService.buyCartItem(item);
    updateCart();
  };
  $scope.buySource = function(source, item){
    CartService.buyCartItemSource(source, item);
    updateCart();
  };
  $scope.unbuyItem = function(item){
    CartService.unbuyCartItem(item);
    updateCart();
  };

  function updateCart(){
    $scope.items = CartService.getCurrentCartItems();
    $scope.boughtItems = CartService.getCurrentCartBoughtItems();
  }
})

.controller('SettingsCtrl', function($scope, $localStorage, localStorageDefault){
  'use strict';
  $scope.resetApp = function(){
    if(window.confirm('Reset app ?')){
      $localStorage.$reset(localStorageDefault);
      ionic.Platform.exitApp();
    }
  };
});
