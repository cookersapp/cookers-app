angular.module('ionicApp.controllers', [])

.controller('SideMenuCtrl', function($scope) {
  'use strict';
  $scope.header = {
    style: "bar-positive",
    align: "center"
  };
})

.controller('HomeCtrl', function($scope, Log) {
  'use strict';
  $scope.header.style = "bar-positive";
  $scope.header.align = "center";
  Log.info('test');
})

.controller('ShoppinglistCtrl', function($scope, IngredientService) {
  'use strict';
  $scope.header.style = "bar-royal";
  $scope.header.align = "left";
  $scope.ingredients = [];
  $scope.ingredientGrid = {};
  $scope.list = {
    name: "Your list",
    cart: []
  };
  
  IngredientService.getAsync().then(function(ingredients){
    $scope.ingredients = ingredients;
  });
})

.controller('ShoppinglistCartCtrl', function($scope) {
  'use strict';
  $scope.search = "";

  $scope.editList = function(){
    alert('editList : not implemented yet !');
  };
  $scope.changeList = function(){
    alert('changeList : not implemented yet !');
  };
  $scope.shareList = function(){
    alert('shareList : not implemented yet !');
  };
})

.controller('ShoppinglistProductsCtrl', function($scope) {
  'use strict';

  $scope.done = function(){
    alert('done : not implemented yet !');
  };
})

.controller('RecipesCtrl', function($scope) {
  'use strict';
  $scope.header.style = "bar-assertive";
  $scope.header.align = "center";
})

.controller('RecipesSearchCtrl', function($scope) {
  'use strict';

})

.controller('RecipesResultsCtrl', function($scope) {
  'use strict';

})

.controller('RecipeCtrl', function($scope) {
  'use strict';
  
  $scope.favorite = function(){
    alert('favorite : not implemented yet !');
  };
  $scope.share = function(){
    alert('share : not implemented yet !');
  };
  $scope.addToList = function(){
    alert('addToList : not implemented yet !');
  };
});
