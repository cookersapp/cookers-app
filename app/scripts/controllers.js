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
  PlanningService.getPlanning().then(function(planning){
    $scope.planning = planning;
  });

  $scope.changeMeal = function(meal, index){
    console.log('controller.changeMeal('+index+') for ', meal);
    meal.index = index;
  };
});
