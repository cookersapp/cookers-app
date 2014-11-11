angular.module('app')

.factory('GlobalMessageSrv', function(BackendUtils, $q, StorageSrv, Config){
  'use strict';
  var timeToUpdate = 1000*60*60*24; // one day
  var service = {
    getMessage: getMessage,
    getStickyMessages: getStickyMessages,
    hideMessage: hideMessage
  };

  function getMessage(){
    return BackendUtils.getAllWithCache('globalmessages', false, timeToUpdate).then(function(messages){
      return StorageSrv.getUser().then(function(user){
        var closedMessages = user && Array.isArray(user.closedMessages) ? user.closedMessages : [];
        return _.find(messages, function(msg){
          return !msg.sticky && msg.versions.indexOf(Config.appVersion) > -1 && closedMessages.indexOf(msg.id) === -1;
        });
      });
    });
  }

  function getStickyMessages(){
    return BackendUtils.getAllWithCache('globalmessages', false, timeToUpdate).then(function(messages){
      return _.find(messages, function(msg){
        return msg.sticky && msg.versions.indexOf(Config.appVersion) > -1;
      });
    });
  }

  function hideMessage(message){
    return StorageSrv.getUser().then(function(user){
      if(!(user && Array.isArray(user.closedMessages))){ user.closedMessages = []; }
      if(user.closedMessages.indexOf(message.id) === -1){
        user.closedMessages.push(message.id);
        return BackendUtils.put('/users/'+user.id+'/messages/'+message.id+'/close').then(function(){
          return StorageSrv.setUser(user);
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
    getCurrent: function(){ return get(moment().week()+(Config.debug ? 1 : 0)); },
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
});
