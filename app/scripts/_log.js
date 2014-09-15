// segment.io snippet
window.analytics = window.analytics || [];
window.analytics.methods = ['identify', 'group', 'track', 'page', 'pageview', 'alias', 'ready', 'on', 'once', 'off', 'trackLink', 'trackForm', 'trackClick', 'trackSubmit'];
window.analytics.factory = function(method){
  return function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(method);
    window.analytics.push(args);
    return window.analytics;
  };
};
for (var i = 0; i < window.analytics.methods.length; i++) {
  var key = window.analytics.methods[i];
  window.analytics[key] = window.analytics.factory(key);
}
window.analytics.load = function(key){
  if (document.getElementById('analytics-js')) return;
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.id = 'analytics-js';
  script.async = true;
  script.src = ('https:' === document.location.protocol ? 'https://' : 'http://') + 'cdn.segment.io/analytics.js/v1/' + key + '/analytics.min.js';
  var first = document.getElementsByTagName('script')[0];
  first.parentNode.insertBefore(script, first);
};
window.analytics.SNIPPET_VERSION = '2.0.9';

var trackingKeyDebug = 'as680lc0yh';
var trackingKey = '6q7w3pd32u';
window.analytics.load(Config.debug ? trackingKeyDebug : trackingKey);
window.analytics.page();



// Define Logger
var Logger = (function(){
  'use strict';
  function loadEvents(){ if(localStorage){ config.events = JSON.parse(localStorage.getItem(config.eventsStorageKey)) || []; } }
  function saveEvents(){ if(localStorage){ localStorage.setItem(config.eventsStorageKey, JSON.stringify(config.events)); } }
  function addEvent(event){
    if(!event.id){event.id = createUuid();}
    if(!config.events){config.events = [];}
    config.events.push(event);
    saveEvents();
    if(config.identified){ startSendEvents(); }
  }
  function removeEvent(event){
    if(!config.events){config.events = [];}
    for(var i=0; i<config.events.length; i++){
      if(config.events[i].id === event.id){
        config.events.splice(i, 1);
        break;
      }
    }
    saveEvents();
  }
  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  var config = {
    verbose: Config ? Config.verbose : true,
    debug: Config ? Config.debug : true,
    track: Config ? Config.track : true,
    async: true,
    identified: false,
    eventsStorageKey: 'tracking-events-cache',
    events: [],
    eventSender: null,
    currentEventId: null
  };
  loadEvents();

  function identify(id, data, async){
    if(config.verbose){ console.log('$[identify] ' + id, data); }
    if(config.track){
      var event = {
        id: createUuid(),
        userId: id,
        action: 'identify',
        data: data
      };
      if(async && config.async){
        addEvent(event);
      } else {
        sendEvent(event);
      }
    }
  }

  function track(type, data){
    if(!data){data = {};}
    if(!data.url && window && window.location){data.url = window.location.href;}
    if(!data.time){data.time = Date.now()/1000;} // special mixpanel property
    if(!data.localtime){data.localtime = Date.now();}
    if(!data.appVersion && Config){data.appVersion = Config.appVersion;}
    if(!data.email){data.email = getUserMailIfSetted();}
    if(!data.eventId){data.eventId = createUuid();}
    if(!data.previousEventId){data.previousEventId = config.currentEventId;}
    config.currentEventId = data.eventId;

    if(config.verbose){ console.log('$[track] '+type, data); }
    if(config.track){
      var event = {
        id: createUuid(),
        action: 'track',
        type: type,
        data: data
      };
      if(config.async && type !== 'exception') {
        addEvent(event);
      } else {
        sendEvent(event);
      }
    }
  }

  function startSendEvents(){
    if(config.eventSender === null){
      for(var i=0; i<config.events.length; i++){
        config.events[i].sending = false;
      }
      config.eventSender = window.setInterval(function(){
        var eventsToSend = [];
        for(var j=0; j<config.events.length; j++){
          if(!config.events[j].sending && eventsToSend.length < 10){
            config.events[j].sending = true;
            eventsToSend.push(config.events[j]);
          }
        }
        if(eventsToSend.length > 0){
          var callback = function(event, status){
            if(status !== 'ko'){ removeEvent(event); }
            else { event.sending = false; }
          };
          for(var k=0; k<eventsToSend.length; k++){
            sendEvent(eventsToSend[k], callback);
          }
        } else {
          stopSendEvents();
        }
      }, 3000);
    }
  }

  function stopSendEvents(){
    if(config.eventSender !== null){
      window.clearInterval(config.eventSender);
      config.eventSender = null;
    }
  }

  function sendEvent(event, callback){
    if(event.action === 'identify'){
      analytics.identify(event.userId, event.data, function(){
        config.identified = true;
        if(config.events.length > 0){ startSendEvents(); }
        if(callback){callback(event, 'ok');}
      });
    } else if(event.action === 'track'){
      analytics.track(event.type, event.data, function(){
        if(callback){callback(event, 'ok');}
      });
      if(event.type === 'error' && config.debug && event.data.error){window.alert('Error: '+event.data.error.message+'\nPlease contact: loic@cookers.io');}
      if(event.type === 'exception'){window.alert('Exception: '+event.data.message+'\nPlease contact: loic@cookers.io');}
    } else {
      if(callback){callback(event, 'unknown');}
    }
  }

  function getUserMailIfSetted(){
    if(localStorage){
      var user = JSON.parse(localStorage.getItem('ionic-user'));
      if(user && user.email && typeof user.email === 'string' && user.email.indexOf('@') > -1){
        return user.email;
      }
    }
  }

  // TODO : create alias on login...

  return {
    identify: identify,
    track: track
  };
})();



// catch exceptions
window.onerror = function(message, url, line, col, error){
  'use strict';
  var stopPropagation = false;
  var data = {
    type: 'javascript'
  };
  if(message)       { data.message      = message;      }
  if(url)           { data.fileName     = url;          }
  if(line)          { data.lineNumber   = line;         }
  if(col)           { data.columnNumber = col;          }
  if(error){
    if(error.name)  { data.name         = error.name;   }
    if(error.stack) { data.stack        = error.stack;  }
  }
  if(navigator){
    if(navigator.userAgent)   { data['navigator.userAgent']     = navigator.userAgent;    }
    if(navigator.platform)    { data['navigator.platform']      = navigator.platform;     }
    if(navigator.vendor)      { data['navigator.vendor']        = navigator.vendor;       }
    if(navigator.appCodeName) { data['navigator.appCodeName']   = navigator.appCodeName;  }
    if(navigator.appName)     { data['navigator.appName']       = navigator.appName;      }
    if(navigator.appVersion)  { data['navigator.appVersion']    = navigator.appVersion;   }
    if(navigator.product)     { data['navigator.product']       = navigator.product;      }
  }

  Logger.track('exception', data);
  return stopPropagation;
};
