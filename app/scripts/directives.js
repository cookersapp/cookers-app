angular.module('ionicApp')

.directive('mealSlider', function($timeout, $ionicSlideBoxDelegate){
  'use strict';
  return {
    restrict: 'EA',
    templateUrl: 'views/directives/mealSlider.html',
    scope: {
      meals: '=',
      sliderId: '@',
      index: '@',
      title: '@',
      onSlideChanged: '&'
    },
    link: function(scope, elem, attrs){
      scope.slideHasChanged = function(index){
        scope.onSlideChanged({index:index});
      };

      /*$timeout(function(){
        // ERROR : Delegate for handle "slider-Lundi-lunch" could not find a corresponding element with delegate-handle="slider-Lundi-lunch"! slide() was not called!
        $ionicSlideBoxDelegate.$getByHandle(scope.sliderId).slide(scope.index);
      }, 1000);*/
      // update colors to have the correct first slide
      scope.newMeals = angular.copy(scope.meals);
      for(var i=0; i<scope.index; i++){
        var meal = scope.newMeals.shift();
        scope.newMeals.push(meal);
      }
    }
  };
});