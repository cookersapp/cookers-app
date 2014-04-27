angular.module('ionicApp.controllers', [])


.controller('SideMenuCtrl', function($scope) {
  'use strict';
  $scope.header = {
    style: 'bar-positive',
    align: 'center'
  };
})


.controller('HomeCtrl', function($scope, Log) {
  'use strict';
  $scope.header.style = 'bar-positive';
  $scope.header.align = 'center';
  Log.info('test');
})


.controller('ShoppinglistCtrl', function($scope, IngredientService) {
  'use strict';
  $scope.header.style = 'bar-royal';
  $scope.header.align = 'left';
  $scope.ingredients = [];
  $scope.ingredientGrid = {};
  $scope.list = {
    name: 'Your list',
    cart: []
  };
  
  IngredientService.getAsync().then(function(ingredients){
    $scope.ingredients = ingredients;
  });
})


.controller('ShoppinglistCartCtrl', function($scope, Log) {
  'use strict';
  $scope.search = '';

  $scope.editList = function(){
    Log.alert('editList : not implemented yet !');
  };
  $scope.changeList = function(){
    Log.alert('changeList : not implemented yet !');
  };
  $scope.shareList = function(){
    Log.alert('shareList : not implemented yet !');
  };
  $scope.addToList = function(ingredient){
    
  };
})


.controller('ShoppinglistProductsCtrl', function($scope, Log) {
  'use strict';

  $scope.done = function(){
    Log.alert('done : not implemented yet !');
  };
})


.controller('RecipesCtrl', function($scope) {
  'use strict';
  $scope.header.style = 'bar-assertive';
  $scope.header.align = 'center';
})


.controller('RecipesSearchCtrl', function($scope) {
  'use strict';

})


.controller('RecipesResultsCtrl', function($scope) {
  'use strict';

})


.controller('RecipeCtrl', function($scope, Log) {
  'use strict';
  
  $scope.favorite = function(){
    Log.alert('favorite : not implemented yet !');
  };
  $scope.share = function(){
    Log.alert('share : not implemented yet !');
  };
  $scope.addToList = function(){
    Log.alert('addToList : not implemented yet !');
  };
})


.controller('LogsCtrl', function($scope, UserService){
  'use strict';
  $scope.formated = true;
  $scope.logs = UserService.getLogHistory();
})


.controller('DeviceCtrl', function($scope, $localStorage, Log){
  'use strict';
  $scope.$storage = $localStorage;

  window.ionic.Platform.ready(function(){
    $scope.device = window.ionic.Platform.device();
  });

  $scope.resetApp = function(){
    $scope.$storage.$reset();
    Log.alert('Application réinitialisée !');
    window.ionic.Platform.exitApp();
  };
});
