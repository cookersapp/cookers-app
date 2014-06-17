angular.module('ionicApp')

.directive('mealSlider', function($timeout, $ionicSlideBoxDelegate, ShoppinglistService, ModalService){
  'use strict';
  return {
    restrict: 'E',
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
        if(index > -1){
          scope.meal.selected = index;
          scope.meal.bought = false;
          scope.meal.data = meal;
        }
      };
      scope.unselectMeal = function(meal){
        delete meal.selected;
        delete meal.bought;
        delete meal.data;
      };
      scope.addMealToList = function(meal){
        if(!ShoppinglistService.hasLists()){
          ShoppinglistService.addList(ShoppinglistService.createList());
        }
        ShoppinglistService.addMealToList(meal);
        scope.meal.bought = true;
      };
      scope.removeMealFromList = function(meal){
        ShoppinglistService.removeMealFromList(meal);
        scope.meal.bought = false;
      };

      scope.mealDetails = {};
      ModalService.meal.details(scope, function(modal) {
        scope.mealDetails.modal = modal;
      });
      scope.showMealDetails = function(meal){
        scope.mealDetails.meal = meal;
        scope.mealDetails.modal.show();
      };
      scope.hideMealDetails = function(){
        scope.mealDetails.modal.hide();
      }
    }
  };
})

.directive('iconProgress', function(){
  'use strict';
  return {
    restrict: 'E',
    templateUrl: 'views/directives/iconProgress.html',
    scope: {
      icon: '@',
      color: '@',
      background: '@',
      progress: '='
    },
    compile: function(element, attrs){
      if(!attrs.icon){ attrs.icon = 'fa-info'; }
      if(!attrs.color){ attrs.color = 'red'; }
      if(!attrs.background){ attrs.background = '#ddd'; }
    }
  };
});