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
    template: '<div ng-show="level" class="nutrition {{level}}"><i class="fa {{icon}}"></i> {{name}}</div>',
    link: function(scope, element, attrs){
      if(scope.level === 'low'){
        scope.icon = 'fa-smile-o';
      } else if(scope.level === 'moderate'){
        scope.icon = 'fa-meh-o';
      } else if(scope.level === 'high'){
        scope.icon = 'fa-frown-o';
      } else {
        scope.icon = 'fa-circle-thin';
      }
    }
  };
})

.directive('additif', function (){
  'use strict';
  return {
    restrict: 'E',
    scope: {
      data: '='
    },
    template: '<span class="additive danger{{data.danger.level}}">'+
    '<i class="fa {{icon}}"></i> {{data.fullName}} <span ng-show="data.category">({{data.category}})</span>'+
    '</span>',
    link: function(scope, element, attrs){
      if(scope.data.danger.level === 1 || scope.data.danger.level === 2){
        scope.icon = 'fa-smile-o';
      } else if(scope.data.danger.level === 3 || scope.data.danger.level === 4){
        scope.icon = 'fa-meh-o';
      } else if(scope.data.danger.level === 5 || scope.data.danger.level === 6){
        scope.icon = 'fa-frown-o';
      } else {
        scope.icon = 'fa-circle-thin';
      }
    }
  };
});
