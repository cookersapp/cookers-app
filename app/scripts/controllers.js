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
  
  $scope.listHasRecipe = CartService.listHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    if(!CartService.hasLists()){
      CartService.addList(CartService.createList());
    }
    CartService.addRecipeToList(recipe);
    // TODO add toast
  };
  $scope.removeRecipeFromCart = function(recipe){
    if(CartService.hasLists()){
      CartService.removeRecipeFromList(recipe);
    }
    // TODO add toast
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, RecipeService){
  'use strict';
  $scope.recipe = {};
  RecipeService.get($stateParams.recipeId).then(function(recipe){
    $scope.recipe = recipe;
  });
})

.controller('CartCtrl', function($scope){
  'use strict';
})

.controller('CartRecipesCtrl', function($scope, CartService){
  'use strict';
  $scope.list = CartService.getList();
})

.controller('CartIngredientsCtrl', function($scope, CartService){
  'use strict';
  $scope.items = CartService.getListItems();

  $scope.buyItem = function(item){
    CartService.buyListItem(item);
  };
  $scope.buySource = function(source, item){
    CartService.buyListItemSource(source, item);
  };
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
