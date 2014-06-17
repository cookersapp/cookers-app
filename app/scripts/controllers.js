angular.module('ionicApp')

.controller('AppCtrl', function($scope) {
  'use strict';

})

.controller('HomeCtrl', function($scope) {
  'use strict';

})

.controller('PlanningCtrl', function($scope, PlanningService) {
  'use strict';
  $scope.planning = {};
  PlanningService.getCurrentPlanning().then(function(planning){
    $scope.planning = planning;
  });
})

.controller('MealCtrl', function($scope, $stateParams, MealService) {
  'use strict';
  var mealId = $stateParams.mealId;
  $scope.meal = {
    id: mealId,
    loading: true
  };
  MealService.getMeal(mealId).then(function(meal){
    $scope.meal = meal;
  });
})

.controller('ShoppinglistCtrl', function($scope, ShoppinglistService) {
  'use strict';
  $scope.mealView = true;
  $scope.showMealView = function(){
    $scope.mealView = true;
  };
  $scope.showIngredientView = function(){
    $scope.mealView = false;
  };
  
  $scope.list = ShoppinglistService.getList();
  $scope.itemsByCategory = ShoppinglistService.getListItemsByCategory();
  
  $scope.mealIngredients = function(meal){
    var count = 0;
    if(meal.starter && meal.starter.ingredients){count += meal.starter.ingredients.length;}
    if(meal.mainCourse && meal.mainCourse.ingredients){count += meal.mainCourse.ingredients.length;}
    if(meal.desert && meal.desert.ingredients){count += meal.starter.desert.length;}
    if(meal.wine && meal.wine.ingredients){count += meal.wine.ingredients.length;}
    return count;
  };
  
  $scope.buyItem = function(item){
    ShoppinglistService.buyListItem(item);
    for(var i in $scope.itemsByCategory){
      var category = $scope.itemsByCategory[i];
      var index = _.findIndex(category.items, {food: {name: item.food.name}});
      if(index > -1){
        category.items.splice(index, 1);
        if(category.items.length === 0){
          $scope.itemsByCategory.splice(i, 1);
        }
        break;
      }
    }
  };
})

.controller('SettingsCtrl', function($scope, $localStorage, localStorageDefault) {
  'use strict';
  $scope.resetApp = function(){
    if(confirm('Reset app ?')){
      $localStorage.$reset(localStorageDefault);
    }
  };
});
