angular.module('app')

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
  var aDay = 1000*60*60*24;
  var service = {
    get: function(id){ return BackendUtils.getWithCache('foods', id, aDay); },
    getAll: function(){ return BackendUtils.getAllWithCache('foods'); }
  };

  return service;
})

.factory('RecipeSrv', function(BackendUtils){
  'use strict';
  var aDay = 1000*60*60*24;
  var service = {
    get: function(id){ return BackendUtils.getWithCache('recipes', id, aDay); }
  };

  return service;
})

.factory('SelectionSrv', function(BackendUtils, Config){
  'use strict';
  var aDay = 1000*60*60*24;
  var service = {
    getCurrent: function(){ return get(moment().week()+(Config.debug ? 1 : 0)); },
    get: get
  };

  function get(id){
    return BackendUtils.getWithCache('selections', id, aDay);
  }

  return service;
})

.factory('ProductSrv', function(BackendUtils){
  'use strict';
  var aDay = 1000*60*60*24;
  var service = {
    get           : function(barcode)         { return BackendUtils.getWithCache('products', barcode, aDay);     },
    getWithStore  : function(store, barcode)  { return BackendUtils.get('/stores/'+store+'/products/'+barcode);  },
    setFoodId     : function(barcode, foodId) { return BackendUtils.put('/products/'+barcode+'?foodId='+foodId); }
  };

  return service;
})

.factory('StoreSrv', function(BackendUtils){
  'use strict';
  var aDay = 1000*60*60*24;
  var service = {
    getAll: function(){ return BackendUtils.getAllWithCache('stores'); }
  };

  return service;
})

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

.factory('BackendUtils', function($http, $q, _LocalStorageSrv, CollectionUtils, Config){
  var keyPrefix = 'cache-', cacheMaxSize = 50;
  var service = {
    get: get,
    put: put,
    post: post,
    getWithCache: getWithCache,
    getAllWithCache: getAllWithCache
  };
  var cache = {
    elts: {},
    eltPromises: {}
  };

  function getWithCache(name, id, _timeToUpgrade, _timeToExpire){
    var key = keyPrefix+name;
    if(!cache.elts[key]){ cache.elts[key] = {}; }
    if(!cache.eltPromises[key]){ cache.eltPromises[key] = {}; }

    if(cache.elts[key][id] && cache.elts[key][id].data && !_isExpired(cache.elts[key][id], _timeToExpire)){ // found in inMemoryCache
      if(_isExpired(cache.elts[key][id], _timeToUpgrade)){ _backgroundUpdate(key, name, id); }
      return $q.when(cache.elts[key][id].data);
    } else if(cache.eltPromises[key][id]){ // data already requested, will return it as soon as possible
      return cache.eltPromises[key][id];
    } else {
      var localCache = _LocalStorageSrv.get(key) || {elts:{}};
      if(localCache.elts[id] && !_isExpired(localCache.elts[id], _timeToExpire)){ // found in localCache
        _updateCacheData(key, id, localCache.elts[id]);
        if(_isExpired(cache.elts[key][id], _timeToUpgrade)){ _backgroundUpdate(key, name, id); }
        return $q.when(cache.elts[key][id].data);
      } else { // not found in caches, get it from server and store it in caches
        cache.eltPromises[key][id] = get('/'+name+'/'+id).then(function(elt){
          if(elt){
            _updateCacheData(key, id, _createCacheData(elt));
            localCache.elts[id] = cache.elts[key][id];
            _saveLocalCache(key, localCache);
          }
          delete cache.eltPromises[key][id];
          return cache.elts[key][id].data;
        });
        return cache.eltPromises[key][id];
      }
    }
  }

  function _backgroundUpdate(key, name, id){
    return get('/'+name+'/'+id).then(function(elt){
      if(elt){
        var localCache = _LocalStorageSrv.get(key) || {elts:{}};
        _updateCacheData(key, id, _createCacheData(elt));
        localCache.elts[id] = cache.elts[key][id];
        _saveLocalCache(key, localCache);
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
  function getAllWithCache(name, _quickNDirty){
    var key = keyPrefix+name;
    if(!cache.elts[key]){ cache.elts[key] = {}; }

    if(_quickNDirty){ // return elements presents in cache and update them with loaded results
      var localCache = _LocalStorageSrv.get(key) || {elts:{}};
      var results = _.map(localCache.elts, function(elt){
        if(elt && elt.data && elt.data.id){ _updateCacheData(key, elt.data.id, elt); }
        return elt.data;
      });
      get('/'+name).then(function(elts){
        if(elts){
          var localCache = _LocalStorageSrv.get(key) || {elts:{}};
          for(var i in elts){
            if(elts[i] && elts[i].id){
              var id = elts[i].id;
              _updateCacheData(key, id, _createCacheData(elts[i]));
              localCache.elts[id] = cache.elts[key][id];

              var result = _.find(results, {id: elts[i].id});
              if(result){
                angular.copy(elts[i], result);
              } else {
                results.push(elts[i]);
              }
            }
          }
          _saveLocalCache(key, localCache);
        }
      });
      return $q.when(results);
    } else { // load all elements, update the cache and return theù
      return get('/'+name).then(function(elts){
        if(elts){
          var localCache = _LocalStorageSrv.get(key) || {elts:{}};
          for(var i in elts){
            if(elts[i] && elts[i].id){
              var id = elts[i].id;
              _updateCacheData(key, id, _createCacheData(elts[i]));
              localCache.elts[id] = cache.elts[key][id];
            }
          }
          _saveLocalCache(key, localCache);
        }
        return elts;
      });
    }
  }

  function _saveLocalCache(key, localCache){
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
    _LocalStorageSrv.set(key, localCache);
  }

  function _updateCacheData(key, id, elt){
    if(!cache.elts[key][id]){
      cache.elts[key][id] = elt;
    } else if(cache.elts[key][id] && cache.elts[key][id].updated < elt.updated){
      angular.copy(elt, cache.elts[key][id]);
    }
  }

  function _createCacheData(data){
    return {data: data, updated: Date.now()};
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
    return $http.put(Config.backendUrl+'/api/v1'+url, data).then(function(res){
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
