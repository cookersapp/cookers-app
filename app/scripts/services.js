angular.module('app')

.factory('PerfSrv', function(){
  'use strict';
  var service = {
    getWatchesForElement: getWatchesForElement
  };

  function getWatchesForElement(element){
    var watchers = [];
    if(element.data().hasOwnProperty('$scope')){
      angular.forEach(element.data().$scope.$$watchers, function(watcher){
        watchers.push(watcher);
      });
    }

    angular.forEach(element.children(), function(childElement){
      watchers = watchers.concat(getWatchesForElement(angular.element(childElement)));
    });
    return watchers;
  }

  return service;
});
