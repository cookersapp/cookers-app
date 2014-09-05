var Logger = (function(){
  'use strict';
  function loadEvents(){ if(localStorage){ config.events = JSON.parse(localStorage.getItem(config.eventsStorageKey)) || []; } }
  function saveEvents(){ if(localStorage){ localStorage.setItem(config.eventsStorageKey, JSON.stringify(config.events)); } }
  function addEvent(event){
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
    debug: Config ? Config.debug : true,
    noTrack: false,
    async: true,
    identified: false,
    eventsStorageKey: 'tracking-events-cache',
    events: [],
    eventSender: null,
    currentEventId: null
  };
  loadEvents();

  function identify(id){
    if(config.debug){ console.log('$[identify]', id); }
    if(!config.noTrack){
      mixpanel.identify(id);
      config.identified = true;
      if(config.events.length > 0){ startSendEvents(); }
    }
  }

  function setProfile(profile){
    if(config.debug){ console.log('$[register]', profile); }
    if(!config.noTrack){
      var event = {
        id: createUuid(),
        action: 'register',
        data: profile
      };
      if(config.async){
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

    if(config.debug){ console.log('$[track] '+type, data); }
    if(!config.noTrack){
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
      }, 1000);
    }
  }

  function stopSendEvents(){
    if(config.eventSender !== null){
      window.clearInterval(config.eventSender);
      config.eventSender = null;
    }
  }

  function sendEvent(event, callback){
    if(event.action === 'register'){
      mixpanel.people.set(event.data, function(success, data){
        if(callback){callback(event, success ? 'ok' : 'ko');}
      });
    } else if(event.action === 'track'){
      mixpanel.track(event.type, event.data, function(success, data){
        if(callback){callback(event, success ? 'ok' : 'ko');}
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
      if(user && user.email && typeof user.email === 'string' && user.email.contains('@')){
        return user.email;
      }
    }
  }

  return {
    async: config.async,
    noTrack: config.noTrack,
    setAsync: function(a){ config.async = a; },
    setNoTrack: function(d){ config.noTrack = d; },
    identify: identify,
    setProfile: setProfile,
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
