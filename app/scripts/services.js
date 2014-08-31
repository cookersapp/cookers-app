angular.module('app')

.factory('GlobalMessageSrv', function($q, StorageSrv, BackendSrv, debug, appVersion){
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
        return msg && (msg.isProd || debug) && msg.targets && msg.targets.indexOf(appVersion) > -1 && !messageExists(msg);
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

.factory('EmailSrv', function($http, $q, mandrillUrl, mandrillKey, supportTeamEmail){
  'use strict';
  var service = {
    sendFeedback: sendFeedback
  };

  function sendFeedback(email, feedback){
    return $http.post(mandrillUrl+'/messages/send.json', {
      'key': mandrillKey,
      'message': {
        'subject': '[Cookers] Feedback from app',
        'text': feedback,
        //'html': '<p>'+feedback+'</p>',
        'from_email': email,
        'to': [
          {'email': supportTeamEmail, 'name': 'Cookers team'}
        ],
        'important': false,
        'track_opens': true,
        'track_clicks': null,
        'preserve_recipients': null,
        'tags': [
          'app', 'feedback'
        ]
      },
      'async': false
    }).then(function(result){
      var sent = true;
      for(var i in result.data){
        if(result.data[i].reject_reason){
          sent = false;
        }
      }
      return sent;
    });
  }

  return service;
});