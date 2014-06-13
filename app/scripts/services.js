angular.module('ionicApp')

.factory('PlanningService', function($http, $q, $localStorage){
  'use strict';
  if(!$localStorage.plannings){$localStorage.plannings = [];}
  var service = {
    getCurrentPlanning: function(){ return getPlanning(moment().week()); },
    getPlanning: getPlanning
  };

  function getPlanning(week){
    var planning = _.find($localStorage.plannings, {week: week});
    if(planning){
      return $q.when(planning);
    } else {
      return downloadPlanning(week);
    }
  }

  function downloadPlanning(week){
    return $http.get('data/planning.json').then(function(result){
      $localStorage.plannings.push(result.data);
      return result.data;
    });
  }

  return service;
})

.factory('MealService', function(PlanningService){
  'use strict';
  var service = {
    getMeal: getMeal
  };

  function getMeal(mealId){
    return PlanningService.getCurrentPlanning().then(function(planning){
      return _.find(planning.meals, {id: mealId});
    });
  }

  return service;
});