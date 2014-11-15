angular.module('app')

.factory('GlobalMessageSrv', function(BackendUtils, $q, UserSrv, Config){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    getMessage: getMessage,
    getStickyMessages: getStickyMessages,
    hideMessage: hideMessage
  };

  function getMessage(){
    return BackendUtils.getAllWithCache('globalmessages', false, timeToUpdate).then(function(messages){
      if(messages){
        return UserSrv.get().then(function(user){
          var closedMessages = user && Array.isArray(user.closedMessages) ? user.closedMessages : [];
          return _.find(messages, function(msg){
            return !msg.sticky && msg.versions.indexOf(Config.appVersion) > -1 && closedMessages.indexOf(msg.id) === -1;
          });
        });
      } else {
        return $q.when();
      }
    });
  }

  function getStickyMessages(){
    return BackendUtils.getAllWithCache('globalmessages', false, timeToUpdate).then(function(messages){
      if(messages){
        return _.find(messages, function(msg){
          return msg.sticky && msg.versions.indexOf(Config.appVersion) > -1;
        });
      } else {
        return $q.when([]);
      }
    });
  }

  function hideMessage(message){
    return UserSrv.get().then(function(user){
      if(!(user && Array.isArray(user.closedMessages))){ user.closedMessages = []; }
      if(user.closedMessages.indexOf(message.id) === -1){
        user.closedMessages.push(message.id);
        return BackendUtils.put('/users/'+user.id+'/messages/'+message.id+'/close').then(function(){
          return UserSrv.set(user);
        });
      }
    });
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
    }, false).then(function(data){
      if(data){ return data === 'sent'; }
      return false;
    });
  }

  return service;
})

.factory('UserSrv', function($q, AccountsSrv, BackendUtils, LocalForageUtils, Utils, LogSrv){
  'use strict';
  var cache = {};
  var storageKey = 'user';
  var service = {
    get: get,
    set: set,
    updateWithRemote: updateWithRemote,
    getSetting: getSetting,
    setSetting: setSetting,
    setDevice: setDevice
  };

  function _init(email){
    var defer = $q.defer();
    BackendUtils.get('/users/find?email='+email).then(function(user){
      if(user && user.id){
        cache.user = user;
        return LocalForageUtils.set(storageKey, user).then(function(){
          return setDevice(Utils.getDevice());
        });
      }
    }).then(function(){
      defer.resolve();
    }, function(error){
      if(!error){error = {};}
      else if(typeof error !== 'object'){error = {message: error};}
      error.email = email;
      LogSrv.trackError('userNotFound', error);
      defer.resolve();
    });
    return defer.promise;
  }

  function get(){
    if(cache.user){
      return $q.when(angular.copy(cache.user));
    } else if(cache.userPromise){
      return cache.userPromise;
    } else {
      cache.userPromise = LocalForageUtils.get('user').then(function(user){
        if(user && user.id){
          cache.user = user;
          return angular.copy(cache.user);
        } else {
          return AccountsSrv.getEmailOrAsk().then(function(email){
            return _init(email);
          }).then(function(){
            return $q.when(angular.copy(cache.user));
          });
        }
        delete cache.userPromise;
      });
      return cache.userPromise;
    }
  }

  function set(user){
    cache.user = angular.copy(user);
    return LocalForageUtils.set('user', user);
  }

  function updateWithRemote(){
    return get().then(function(user){
      if(user && user.id){
        return BackendUtils.get('/users/'+user.id).then(function(backendUser){
          if(backendUser){
            return set(backendUser).then(function(){
              return backendUser;
            });
          }
        });
      } else {
        console.error('Unable to find user !!!');
      }
    });
  }

  function getSetting(setting){
    return get().then(function(user){
      return user && user.settings ? user.settings[setting] : null;
    });
  }

  function setSetting(setting, value){
    return get().then(function(user){
      if(user && user.id && user.settings){
        user.settings[setting] = value;
        return set(user).then(function(){
          return BackendUtils.put('/users/'+user.id+'/settings/'+setting, {value: value});
        });
      } else {
        if(!user){user = {};}
        user.settings = {};
        user.settings[setting] = value;
        return set(user);
      }
    });
  }

  function setDevice(device){
    return get().then(function(user){
      if(user && user.id){
        return BackendUtils.put('/users/'+user.id+'/device', device);
      } else {
        console.error('Unable to find user !!!');
      }
    });
  }

  return service;
})

.factory('FoodSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get: function(id, _defaultValue){ return BackendUtils.getWithCache('foods', id, _defaultValue, timeToUpdate); }
  };

  return service;
})

.factory('RecipeSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get: function(id){ return BackendUtils.getWithCache('recipes', id, null, timeToUpdate); }
  };

  return service;
})

.factory('SelectionSrv', function(BackendUtils, Config){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    getCurrent: function(){ return get(moment().week()+(Config.debug ? 1 : 0)); },
    get: get
  };

  function get(id){
    return BackendUtils.getWithCache('selections', id, null, timeToUpdate);
  }

  return service;
})

.factory('ProductSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    get           : function(barcode)         { return BackendUtils.getWithCache('products', barcode, null, timeToUpdate);                  },
    getStoreInfo  : function(store, barcode)  { return BackendUtils.getWithCache('stores/'+store+'/products', barcode, null, timeToUpdate); },
    setFoodId     : function(barcode, foodId) { return BackendUtils.put('/products/'+barcode+'?foodId='+foodId);                            }
  };

  return service;
})

.factory('StoreSrv', function(BackendUtils){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    getAll  : function(_quickNDirty)  { return BackendUtils.getAllWithCache('stores', _quickNDirty);        },
    get     : function(id)            { return BackendUtils.getWithCache('stores', id, null, timeToUpdate); }
  };

  return service;
});
