angular.module('ionicApp')

.directive('mealSlider', function($timeout, $ionicSlideBoxDelegate){
  'use strict';
  return {
    restrict: 'EA',
    templateUrl: 'views/directives/mealSlider.html',
    scope: {
      meals: '=',
      meal: '=',
      sliderId: '@',
      title: '@'
    },
    link: function(scope, elem, attrs){
      // update meals to have the recommended one in first place
      scope.newMeals = angular.copy(scope.meals);
      for(var i=0; i<scope.meal.recommended; i++){
        var meal = scope.newMeals.shift();
        scope.newMeals.push(meal);
      }

      scope.selectMeal = function(meal){
        var index = _.findIndex(scope.meals, {id: meal.id});
        if(index >= 0){
          scope.meal.selected = index;
          scope.meal.data = meal;
        }
      };
      scope.unselectMeal = function(meal){
        delete meal.selected;
        delete meal.data;
      };
    }
  };
});