angular.module('app')

.factory('GlobalMessageSrv', function(BackendUtils, $q, StorageSrv, Config){
  'use strict';
  var service = {
    getMessage: getMessage,
    getStickyMessages: getStickyMessages,
    hideMessage: hideMessage
  };
  var day = 1000*60*60*24;
  var dataPromise = null;
  _init();

  function getMessage(){
    return dataPromise.then(function(data){
      return _.find(data.messages, function(msg){
        return !msg.sticky && msg.versions.indexOf(Config.appVersion) > -1 && data.hiddenMessageIds.indexOf(msg.id) === -1;
      });
    });
  }

  function getStickyMessages(){
    return dataPromise.then(function(data){
      return _.filter(data.messages, function(msg){
        return msg.sticky && msg.versions.indexOf(Config.appVersion) > -1;
      });
    });
  }

  function hideMessage(message){
    dataPromise.then(function(data){
      if(!data.hiddenMessageIds){data.hiddenMessageIds = [];}
      if(data.hiddenMessageIds.indexOf(message.id) === -1){
        data.hiddenMessageIds.push(message.id);
        StorageSrv.setGlobalmessages(data);
      }
    });
  }

  function _init(){
    var globalmessages = StorageSrv.getGlobalMessages();
    // compatibility with 1.1.0
    if(!globalmessages.hiddenMessageIds){globalmessages.hiddenMessageIds = [];}

    if(!globalmessages.lastCall || Date.now() - globalmessages.lastCall > day){
      dataPromise = BackendUtils.get('/globalmessages').then(function(messages){
        if(messages){
          var newGlobalMessages = {
            lastCall: Date.now(),
            messages: messages,
            hiddenMessageIds: globalmessages.hiddenMessageIds
          };
          StorageSrv.setGlobalmessages(newGlobalMessages);
          return newGlobalMessages;
        }
      });
    } else {
      dataPromise = $q.when(globalmessages);
    }
  }

  return service;
})

.factory('EmailSrv', function(BackendUtils){
  'use strict';
  var service = {
    sendFeedback: sendFeedback
  };

  function sendFeedback(email, feedback){
    return BackendUtils.post('/app-feedback', {
      from: email,
      content: feedback,
      source: 'mobile-app'
    }).then(function(data){
      if(data){ return data === 'sent'; }
      return false;
    });
  }

  return service;
})

.factory('BackendUserSrv', function(BackendUtils){
  'use strict';
  var service = {
    findUser          : function(email)                   { return BackendUtils.get('/users/find?email='+email);                             },
    updateUserSetting : function(userId, setting, value)  { return BackendUtils.put('/users/'+userId+'/settings/'+setting, {value: value});  },
    setUserDevice     : function(userId, device)          { return BackendUtils.put('/users/'+userId+'/device', device);                     }
  };

  return service;
})

.factory('FoodSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get: function(id){ return BackendUtils.getWithCache('foods', id, timeToUpdate); },
    getAll: function(_quickNDirty){ return BackendUtils.getAllWithCache('foods', _quickNDirty); }
  };

  return service;
})

.factory('RecipeSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get: function(id){ return BackendUtils.getWithCache('recipes', id, timeToUpdate); }
  };

  return service;
})

.factory('SelectionSrv', function(BackendUtils, Config){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    getCurrent: function(){ return get(moment().week()+(Config.debug ? 2 : 0)); },
    get: get
  };

  function get(id){
    return BackendUtils.getWithCache('selections', id, timeToUpdate);
  }

  return service;
})

.factory('ProductSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get           : function(barcode)         { return BackendUtils.getWithCache('products', barcode, timeToUpdate);     },
    //get           : function(barcode)         { return BackendUtils.get('/products/'+barcode);     },
    getWithStore  : function(store, barcode)  { return BackendUtils.get('/stores/'+store+'/products/'+barcode);  },
    setFoodId     : function(barcode, foodId) { return BackendUtils.put('/products/'+barcode+'?foodId='+foodId); }
  };

  return service;
})

.factory('StoreSrv', function(BackendUtils){
  'use strict';
  var service = {
    getAll: function(_quickNDirty){ return BackendUtils.getAllWithCache('stores', _quickNDirty); }
  };

  return service;
})

.factory('BackendUtils', function($http, $q, _LocalStorageSrv, CollectionUtils, Config){
  'use strict';
  var keyPrefix = 'cache-', cacheDefaultMaxSize = 50;
  var service = {
    get: get,
    put: put,
    post: post,
    getWithCache: getWithCache,
    getAllWithCache: getAllWithCache
  };
  var cache = {
    defaultMaxSize: {foods: 1000, recipes: 100, selections: 4, additives: 700, products: 500},
    elts: {},
    eltPromises: {},
    allElts: {}
  };

  function getWithCache(name, id, _timeToUpdate, _timeToExpire){
    if(!cache.elts[name]){ cache.elts[name] = {}; }
    if(!cache.eltPromises[name]){ cache.eltPromises[name] = {}; }

    if(cache.elts[name][id] && cache.elts[name][id].data && !_isExpired(cache.elts[name][id], _timeToExpire)){ // found in inMemoryCache
      if(_isExpired(cache.elts[name][id], _timeToUpdate)){ _backgroundUpdate(name, id); }
      return $q.when(cache.elts[name][id].data);
    } else if(cache.eltPromises[name][id]){ // data already requested, will return it as soon as possible
      return cache.eltPromises[name][id];
    } else {
      var localCache = _getLocalCache(name);
      if(localCache.elts[id] && !_isExpired(localCache.elts[id], _timeToExpire)){ // found in localCache
        _updateCacheData(name, id, localCache.elts[id]);
        if(_isExpired(cache.elts[name][id], _timeToUpdate)){ _backgroundUpdate(name, id); }
        return $q.when(cache.elts[name][id].data);
      } else { // not found in caches, get it from server and store it in caches
        cache.eltPromises[name][id] = get('/'+name+'/'+id).then(function(elt){
          if(elt){
            _updateCacheData(name, id, _createCacheData(elt));
            localCache.elts[id] = cache.elts[name][id];
            _saveLocalCache(name, localCache);
          }
          delete cache.eltPromises[name][id];
          return cache.elts[name][id].data;
        });
        return cache.eltPromises[name][id];
      }
    }
  }

  function _backgroundUpdate(name, id){
    return get('/'+name+'/'+id).then(function(elt){
      if(elt){
        var localCache = _getLocalCache(name);
        _updateCacheData(name, id, _createCacheData(elt));
        localCache.elts[id] = cache.elts[name][id];
        _saveLocalCache(name, localCache);
      }
    });
  }

  function _isExpired(cachedData, timeToExpire){
    if(typeof timeToExpire === 'number'){
      return !cachedData || !cachedData.updated || Date.now()-cachedData.updated > timeToExpire;
    } else {
      return false;
    }
  }

  /*
   * Can't return only cache because it has limited size...
   * So, with _quickNDirty mode, return cached elts and update them after to add all loaded elts
   */
  function getAllWithCache(name, _quickNDirty, _timeToExpire){
    if(!cache.elts[name]){ cache.elts[name] = {}; }

    if(cache.allElts[name] && !_isExpired(cache.allElts[name], _timeToExpire)){
      return $q.when(angular.copy(cache.allElts[name].data));
    } else {
      if(_quickNDirty){ // return elements presents in cache and update them with loaded results
        var localCache = _getLocalCache(name);
        var results = _.map(localCache.elts, function(elt){
          if(elt && elt.data && elt.data.id){ _updateCacheData(name, elt.data.id, elt); }
          return elt.data;
        });
        get('/'+name).then(function(elts){
          if(elts){
            cache.allElts[name] = _createCacheData(elts);
            var localCache = _getLocalCache(name);
            for(var i in elts){
              if(elts[i] && elts[i].id){
                var id = elts[i].id;
                _updateCacheData(name, id, _createCacheData(elts[i]));
                localCache.elts[id] = cache.elts[name][id];

                // update returned elts
                var result = _.find(results, {id: elts[i].id});
                if(result){
                  angular.copy(elts[i], result);
                } else {
                  results.push(elts[i]);
                }
              }
            }
            _saveLocalCache(name, localCache);
          }
        });
        return $q.when(results);
      } else { // load all elements, update the cache and return theù
        return get('/'+name).then(function(elts){
          if(elts){
            cache.allElts[name] = _createCacheData(elts);
            var localCache = _getLocalCache(name);
            for(var i in elts){
              if(elts[i] && elts[i].id){
                var id = elts[i].id;
                _updateCacheData(name, id, _createCacheData(elts[i]));
                localCache.elts[id] = cache.elts[name][id];
              }
            }
            _saveLocalCache(name, localCache);
          }
          return elts;
        });
      }
    }
  }

  function _updateCacheData(name, id, elt){
    if(!cache.elts[name][id]){
      cache.elts[name][id] = elt;
    } else if(cache.elts[name][id] && cache.elts[name][id].updated < elt.updated){
      if(elt.data && cache.elts[name][id].data){
        angular.copy(elt.data, cache.elts[name][id].data);
        cache.elts[name][id].updated = elt.updated;
      } else {
        angular.copy(elt, cache.elts[name][id]);
      }
    }

    // specific for embeded beans !
    if(name === 'selections'){
      if(elt && elt.data && elt.data.recipes && elt.updated){
        var recipeName = 'recipes';
        if(!cache.elts[recipeName]){ cache.elts[recipeName] = {}; }
        var localCache = _getLocalCache(recipeName);
        for(var i in elt.data.recipes){
          var recipe = elt.data.recipes[i];
          var recipeId = recipe.id;
          var cacheRecipe = _createCacheData(recipe, elt.updated);
          _updateCacheData(recipeName, recipeId, cacheRecipe);
          localCache.elts[recipeId] = cache.elts[recipeName][recipeId];
        }
        _saveLocalCache(recipeName, localCache);
      }
    }
  }

  function _saveLocalCache(name, localCache){
    var cacheMaxSize = _getCacheMaxSize(name);
    if(localCache && localCache.elts){
      while(CollectionUtils.size(localCache.elts) > cacheMaxSize){
        var oldestId = null, oldestTime = null;
        for(var i in localCache.elts){
          if(oldestId === null){
            oldestId = i;
            oldestTime = localCache.elts[i] ? localCache.elts[i].updated : null;
          } else if(!localCache.elts[i] || !localCache.elts[i].updated || localCache.elts[i].updated < oldestTime){
            oldestId = i;
            oldestTime = localCache.elts[i] ? localCache.elts[i].updated : null;
          }
        }
        delete localCache.elts[i];
      }
    }
    _setLocalCache(name, localCache);
  }

  function _getCacheMaxSize(name){
    return cache.defaultMaxSize[name] ? cache.defaultMaxSize[name] : cacheDefaultMaxSize;
  }

  function _createCacheData(data, date){
    return {data: data, updated: date ? date : Date.now()};
  }

  function _getLocalCache(name){
    return _LocalStorageSrv.get(keyPrefix+name) || {elts:{}};
  }
  function _setLocalCache(name, cache){
    _LocalStorageSrv.set(keyPrefix+name, cache);
  }

  function get(url){
    var defer = $q.defer();
    $http.get(Config.backendUrl+'/api/v1'+url).then(function(res){
      if(res && res.data){
        if(res.data.data || res.data.status){
          defer.resolve(res.data.data);
        } else { // compatibility for /api/v1/users/find in version 1.1.0
          defer.resolve(res.data);
        }
      } else {
        defer.resolve();
      }
    }, function(err){
      console.error(err);
      defer.resolve();
    });
    return defer.promise;
  }

  function post(url, data){
    var defer = $q.defer();
    $http.post(Config.backendUrl+'/api/v1'+url, data).then(function(res){
      if(res && res.data){
        if(res.data.data || res.data.status){
          defer.resolve(res.data.data);
        } else { // compatibility for /api/v1/app-feedback in version 1.1.0
          defer.resolve(res.data);
        }
      } else {
        defer.resolve();
      }
    }, function(err){
      console.error(err);
      defer.resolve();
    });
    return defer.promise;
  }

  function put(url, data){
    var defer = $q.defer();
    $http.put(Config.backendUrl+'/api/v1'+url, data).then(function(res){
      if(res && res.data && res.data.data){
        defer.resolve(res.data.data);
      } else {
        defer.resolve();
      }
    }, function(err){
      console.error(err);
      defer.resolve();
    });
    return defer.promise;
  }

  return service;
});
