angular.module('app')

.factory('PerfSrv', function($window, $timeout){
  'use strict';
  var service = {
    loadController: loadController,
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

  function loadController($scope, controllerFn){
    // $stateChangeSuccess
    // $viewContentLoaded
    // http://ionicframework.com/docs/nightly/api/directive/ionView/

    /*if($window.requestAnimationFrame){
      $window.requestAnimationFrame(function(){
        controllerFn();
      });
    } else {*/
    $timeout(function(){
      controllerFn();
    }, 700);
    //}
  }

  return service;
});
