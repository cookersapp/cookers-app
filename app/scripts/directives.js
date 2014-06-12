angular.module('ionicApp')

.directive('mealSlider', function($timeout, $ionicSlideBoxDelegate){
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
        console.log('directive.slideHasChanged('+index+')');
        scope.onSlideChanged({index:index});
      };

      $timeout(function(){
        $ionicSlideBoxDelegate.$getByHandle(scope.sliderId).slide(scope.index);
      }, 1000);
    }
  };
});