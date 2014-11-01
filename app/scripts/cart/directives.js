angular.module('app')

.directive('nutritionGrade', function (){
  'use strict';
  return {
    restrict: 'E',
    scope: {
      grade: '='
    },
    template: '<div ng-show="grade">Note nutritionelle : <span class="label {{color}}">{{grade}}</span></div>',
    link: function(scope, element, attrs){
      if(scope.grade === 'a' || scope.grade === 'b'){
        scope.color = 'label-success';
      } else if(scope.grade === 'c'){
        scope.color = 'label-warning';
      } else if(scope.grade === 'd' || scope.grade === 'e'){
        scope.color = 'label-danger';
      } else {
        scope.color = 'label-default';
      }
    }
  };
})

.directive('nutritionLevel', function (){
  'use strict';
  return {
    restrict: 'E',
    scope: {
      name: '@',
      level: '='
    },
    template: '<div ng-show="level" class="{{color}}"><i class="fa {{icon}}"></i> {{name}}</div>',
    link: function(scope, element, attrs){
      if(scope.level === 'low'){
        scope.icon = 'fa-smile-o';
        scope.color = 'text-success';
      } else if(scope.level === 'moderate'){
        scope.icon = 'fa-meh-o';
        scope.color = 'text-warning';
      } else if(scope.level === 'high'){
        scope.icon = 'fa-frown-o';
        scope.color = 'text-danger';
      } else {
        scope.icon = 'fa-circle-thin';
        scope.color = 'text-muted';
      }
    }
  };
});
