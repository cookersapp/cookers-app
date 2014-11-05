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
})

.factory('GlobalMessageSrv', function($http, $q, StorageSrv, Config){
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
      dataPromise = $http.get(Config.backendUrl+'/api/v1/globalmessages').then(function(res){
        if(res && res.data && res.data.data){
          var newGlobalMessages = {
            lastCall: Date.now(),
            messages: res.data.data,
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

.factory('EmailSrv', function($http, Config){
  'use strict';
  var service = {
    sendFeedback: sendFeedback
  };

  function sendFeedback(email, feedback){
    return $http.post(Config.backendUrl+'/api/v1/app-feedback', {
      from: email,
      content: feedback,
      source: 'mobile-app'
    }).then(function(res){
      if(res && res.data){
        if(res.data.data){ return res.data.data === 'sent'; }
        else { return res.data === 'sent'; }
      }
      return false;
    });
  }

  return service;
});