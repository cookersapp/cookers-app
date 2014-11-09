angular.module('app')

.factory('LocalStorageUtils', function($window, Utils, Config){
  'use strict';
  var localStorageCache = {};
  var localStoragePrefix = 'ionic-';
  var service = {
    get: _get,
    set: _set,
    remove: _remove,
    reset: _reset,
    resetStartingWith: _resetStartingWith
  };

  function _get(key, defaultValue){
    if(!localStorageCache[key]){
      if($window.localStorage && Config.storage){
        localStorageCache[key] = JSON.parse($window.localStorage.getItem(localStoragePrefix+key)) || angular.copy(defaultValue);
      } else {
        localStorageCache[key] = angular.copy(defaultValue);
      }
    }
    return angular.copy(localStorageCache[key]);
  }

  function _set(key, value){
    if(!angular.equals(localStorageCache[key], value)){
      localStorageCache[key] = angular.copy(value);
      if($window.localStorage && Config.storage){
        $window.localStorage.setItem(localStoragePrefix+key, JSON.stringify(localStorageCache[key]));
      }
    } else {
      console.debug('Don\'t save <'+key+'> because values are equals !');
    }
  }

  function _remove(key){
    delete localStorageCache[key];
    if($window.localStorage && Config.storage){
      $window.localStorage.removeItem(localStoragePrefix+key);
    }
  }

  function _reset(){
    localStorageCache = {};
    if($window.localStorage && Config.storage){
      for(var i in $window.localStorage){
        $window.localStorage.removeItem(i);
      }
    }
  }

  function _resetStartingWith(keyStartWith){
    if($window.localStorage && Config.storage){
      for(var i in $window.localStorage){
        if(Utils.startsWith(i, keyStartWith)){
          $window.localStorage.removeItem(i);
        }
      }
    }
    for(var i in localStorageCache){
      if(Utils.startsWith(i, keyStartWith)){
        delete localStorageCache[i];
      }
    }
  }

  return service;
});
