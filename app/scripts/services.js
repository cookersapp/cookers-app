angular.module('ionicApp')

.factory('PlanningService', function($http){
  'use strict';
  var service = {
    getPlanning: function(){
      return $http.get('data/planning.json').then(function(result){
        return result.data;
      });
    }
  };
  
  return service;
});