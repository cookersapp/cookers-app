angular.module('app')

.factory('AppSrv', function($localStorage){
  'use strict';
  var service = {
    get: sApp,
  };

  function sApp(){return $localStorage.app;}
  
  return service;
})

.factory('GlobalMessageSrv', function($q, $http, $localStorage, firebaseUrl, debug, appVersion){
  'use strict';
  var service = {
    getStandardMessageToDisplay: getStandardMessageToDisplay,
    getStickyMessages: getStickyMessages,
    execMessages: execMessages
  };
  
  function sGlobalmessages(){return $localStorage.data ? $localStorage.data.globalmessages : null;}

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
    return _.filter(sGlobalmessages().messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function findMessage(type){
    return _.find(sGlobalmessages().messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function fetchMessages(){
    sGlobalmessages().lastCall = Date.now();
    return $http.get(firebaseUrl+'/globalmessages.json').then(function(result){
      var messages = _.filter(result.data, function(msg){
        return msg && (msg.isProd || debug) && msg.targets && msg.targets.indexOf(appVersion) > -1 && !messageExists(msg);
      });
      sGlobalmessages().messages = sGlobalmessages().messages.concat(messages);
      // sort chronogically
      sGlobalmessages().messages.sort(function(a,b){
        return a.created - b.created;
      });
    });
  }

  function execMessage(fn, message){
    var user = $localStorage.user;
    return eval(fn);
  }

  function messageExists(message){
    return message && message.created && _.findIndex(sGlobalmessages().messages, {created: message.created}) > -1;
  }

  return service;
})

.factory('FirebaseSrv', function(firebaseUrl){
  'use strict';
  var service = {
    push: function(endpoint, data){
      new Firebase(firebaseUrl+endpoint).push(data);
    }
  };

  return service;
})

.factory('StorageSrv', function($localStorage, $window, $state, localStorageDefault){
  'use strict';
  var service = {
    clearCache: function(){
      $localStorage.data.foods = localStorageDefault.data.foods;
      $localStorage.data.recipes = localStorageDefault.data.recipes;
      $localStorage.data.recipesOfWeek = localStorageDefault.data.recipesOfWeek;
    },
    clear: function(){
      $localStorage.$reset(localStorageDefault);
    },
    migrate: migrate
  };

  function migrate(previousVersion, nextVersion){
    if(nextVersion === '0.2.0'){
      $localStorage.$reset(localStorageDefault);
      $window.alert('For this upgrade, all data is reseted ! Sorry for the incovenience :(');
      $state.go('intro');
    } else if(nextVersion === '0.3.0'){
      if(!$localStorage.user.data){$localStorage.user.data = {};}
    }
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