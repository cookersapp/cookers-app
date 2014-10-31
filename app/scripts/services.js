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

.factory('GlobalMessageSrv', function($q, StorageSrv, BackendSrv, Config){
  'use strict';
  var service = {
    getStandardMessageToDisplay: getStandardMessageToDisplay,
    getStickyMessages: getStickyMessages,
    execMessages: execMessages
  };

  function getStandardMessageToDisplay(){
    var type = 'standard';
    var message = findMessage(type);
    if(message){
      fetchMessages();
      return $q.when(message);
    } else {
      return fetchMessages().then(function(){
        return findMessage(type);
      });
    }
  }

  function getStickyMessages(){
    var type = 'sticky';
    return fetchMessages().then(function(){
      return findMessages(type);
    });
  }

  function execMessages(){
    var type = 'exec';
    return fetchMessages().then(function(){
      var messages = findMessages(type);
      for(var i in messages){
        if(messages[i].exec){
          execMessage(messages[i].exec, messages[i]);
        }
        messages[i].hide = true;
      }
      return messages;
    });
  }

  function findMessages(type){
    return _.filter(StorageSrv.getGlobalMessages().messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function findMessage(type){
    return _.find(StorageSrv.getGlobalMessages().messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function fetchMessages(){
    StorageSrv.getGlobalMessages().lastCall = Date.now();
    return BackendSrv.getMessages().then(function(allMessages){
      var messages = _.filter(allMessages, function(msg){
        return msg && (msg.isProd || Config.debug) && msg.targets && msg.targets.indexOf(Config.appVersion) > -1 && !messageExists(msg);
      });
      StorageSrv.getGlobalMessages().messages = StorageSrv.getGlobalMessages().messages.concat(messages);
      // sort chronogically
      StorageSrv.getGlobalMessages().messages.sort(function(a,b){
        return a.created - b.created;
      });
    });
  }

  function execMessage(fn, message){
    var user = StorageSrv.getUser();
    return eval(fn);
  }

  function messageExists(message){
    return message && message.created && _.findIndex(StorageSrv.getGlobalMessages().messages, {created: message.created}) > -1;
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