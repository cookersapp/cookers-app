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

.controller('SettingsCtrl', function($scope, $localStorage) {
  'use strict';
  $scope.resetApp = function(){
    if(confirm('Reset app ?')){
      $localStorage.$reset({
        plannings: []
      });
    }
  };
});
