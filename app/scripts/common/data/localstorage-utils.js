angular.module('app')

.factory('LocalForageUtils', function($window, $localForage, $q, Utils, Config){
  'use strict';
  var storageCache = {};
  var storagePrefix = 'ionic-';
  var service = {
    get: _get,
    set: _set,
    remove: _remove,
    clear: _clear,
    clearStartingWith: _clearStartingWith
  };

  function _get(key, defaultValue){
    if(!storageCache[key]){
      if(Config.storage){
        return getAsync(storagePrefix+key).then(function(value){
          try {
            storageCache[key] = JSON.parse(value) || angular.copy(defaultValue);
          } catch (e) {
            storageCache[key] = angular.copy(defaultValue);
          }
          return angular.copy(storageCache[key]);
        }, function(err){
          console.error('ERROR in LocalForageUtils._get('+key+')', err);
        });
      } else {
        storageCache[key] = angular.copy(defaultValue);
        return $q.when(angular.copy(storageCache[key]));
      }
    } else {
      return $q.when(angular.copy(storageCache[key]));
    }
  }

  function _set(key, value){
    if(key === 'user' && value && value.id && $window.localStorage && Config.storage){
      // for the _log.js...
      $window.localStorage.setItem(storagePrefix+key, JSON.stringify({id: value.id}));
    }

    if(!angular.equals(storageCache[key], value)){
      storageCache[key] = angular.copy(value);
      if(Config.storage){
        return setAsync(storagePrefix+key, JSON.stringify(storageCache[key])).then(function(value){
          // return nothing !
        }, function(err){
          console.error('ERROR in LocalForageUtils._set('+key+')', err);
        });
      } else {
        return $q.when();
      }
    } else {
      console.debug('Don\'t save <'+key+'> because values are equals !');
      return $q.when();
    }
  }

  function _remove(key){
    console.debug('Remove <'+key+'> from storage !');
    delete storageCache[key];
    if(Config.storage){
      return removeAsync(storagePrefix+key);
    } else {
      return $q.when();
    }
  }

  function _clear(){
    storageCache = {};
    if(Config.storage){
      return clearAsync();
    } else {
      return $q.when();
    }
  }

  function _clearStartingWith(keyStartWith){
    for(var i in storageCache){
      if(Utils.startsWith(i, keyStartWith)){
        delete storageCache[i];
      }
    }
    if(Config.storage){
      return keysAsync().then(function(keys){
        var promises = [];
        for(var i in keys){
          if(Utils.startsWith(keys[i], storagePrefix+keyStartWith)){
            promises.push(removeAsync(keys[i]));
          }
        }
        return $q.all(promises).then(function(results){
          // nothing
        });
      });
    } else {
      return $q.when();
    }
  }

  function getAsync(key){
    return $localForage.getItem(key);
  }
  function setAsync(key, value){
    return $localForage.setItem(key, value);
  }
  function removeAsync(key){
    return $localForage.removeItem(key);
  }
  function clearAsync(){
    return $localForage.clear();
  }
  function keysAsync(){
    return $localForage.keys();
  }

  return service;
});

/*.factory('LocalStorageUtils', function($window, Utils, Config){
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
        try {
          localStorageCache[key] = JSON.parse($window.localStorage.getItem(localStoragePrefix+key)) || angular.copy(defaultValue);
        } catch (e) {
          localStorageCache[key] = angular.copy(defaultValue);
        }
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
    for(var i in localStorageCache){
      if(Utils.startsWith(i, keyStartWith)){
        delete localStorageCache[i];
      }
    }
    if($window.localStorage && Config.storage){
      for(var i in $window.localStorage){
        if(Utils.startsWith(i, keyStartWith)){
          $window.localStorage.removeItem(i);
        }
      }
    }
  }

  return service;
});*/
