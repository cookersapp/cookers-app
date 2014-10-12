// Define Logger
var Logger = (function(){
  'use strict';
  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  var Scheduler = (function(){
    var events = [];
    var eventSender = null;

    function init(){
      if(localStorage){
        events = _getEvents() || [];
        if(events.length > 0){ _startScheduler(); }
      }
    }

    function schedule(event){
      _addEvent(event);
      _startScheduler();
    }

    function send(event, callback){
      $.ajax({
        type: 'POST',
        url: config.backendUrl+'/api/v1/track/event',
        data: JSON.stringify(event),
        contentType: 'application/json'
      })
      .done(function(data, textStatus, jqXHR)       { if(callback){callback('ok');} })
      .fail(function(jqXHR, textStatus, errorThrown){ if(callback){callback('ko');} });
    }

    function sendAll(events, callback){
      $.ajax({
        type: 'POST',
        url: config.backendUrl+'/api/v1/track/events',
        data: JSON.stringify(events),
        contentType: 'application/json'
      })
      .done(function(data, textStatus, jqXHR)       { if(callback){callback('ok');} })
      .fail(function(jqXHR, textStatus, errorThrown){ if(callback){callback('ko');} });
    }

    function _startScheduler(){
      if(eventSender === null && events.length > 0){
        // when scheduler starts, all events are not sending !
        for(var i=0; i<events.length; i++){
          events[i].sending = false;
        }
        eventSender = window.setInterval(function(){
          if(events.length === 0){
            _stopScheduler();
          } else if(events.length === 1){
            var event = events[0];
            _resetEvents();
            send(event, function(status){
              if(status === 'ko'){
                _addEvent(event);
                _stopScheduler();
              }
            });
          } else {
            var toSend = events;
            _resetEvents();
            sendAll(toSend, function(status){
              if(status === 'ko'){
                _addEvents(toSend);
                _stopScheduler();
              }
            });
          }
        }, config.scheduler.interval);
      }
    }

    function _stopScheduler(){
      if(eventSender !== null){
        window.clearInterval(eventSender);
        eventSender = null;
      }
    }

    function _addEvent(event){
      events.push(event);
      _setEvents(events);
    }
    function _addEvents(eventsToAdd){
      events = events.concat(eventsToAdd);
      _setEvents(events);
    }
    function _resetEvents(){
      events = [];
      _setEvents(events);
    }

    function _setEvents(events){ if(localStorage){ localStorage.setItem(config.scheduler.storageKey, JSON.stringify(events)); } }
    function _getEvents(){ if(localStorage){ return JSON.parse(localStorage.getItem(config.scheduler.storageKey)); } }

    return {
      init: init,
      schedule: schedule,
      send: send
    };
  })();

  var config = {
    backendUrl: Config ? Config.backendUrl : '',
    verbose: Config ? Config.verbose : true,
    debug: Config ? Config.debug : true,
    track: Config ? Config.track : true,
    async: true,
    scheduler: {
      storageKey: 'tracking-events-cache',
      interval: 3000
    }
  };
  var currentEventId = null;
  Scheduler.init();

  function track(name, event){
    if(!event.name)                                     { event.name = name;                            }
    if(!event.time)                                     { event.time = Date.now();                      }
    if(!event.user)                                     { event.user = _getUserId();                    }
    if(!event.source)                                   { event.source = {};                            }
    if(!event.source.url && window && window.location)  { event.source.url = window.location.href;      }
    if(!event.source.appVersion && Config)              { event.source.appVersion = Config.appVersion;  }
    if(!event.dateinfo){
      event.dateinfo = {
        year: moment().year(),
        month: moment().month(),
        week: moment().week(),
        dayOfYear: moment().dayOfYear(),
        dayOfWeek: moment().weekday()
      };
    }
    if(!event.id){
      event.id = createUuid();
      event.prevId = currentEventId;
      currentEventId = event.eventId;
    }

    if(!event.user){
      window.setTimeout(function(){
        track(name, event);
      }, 2000);
    } else {
      if(config.verbose){ console.log('$[track] '+name, event); }
      if(config.track){
        if(config.async && event.name !== 'exception'){
          Scheduler.schedule(event);
        } else {
          Scheduler.send(event, function(status){
            if(status === 'ko'){Scheduler.schedule(event);}
          });
        }
      }
      if(name === 'error' && config.debug && event.data.error){
        window.alert('Error: '+event.data.type+'\n'+event.data.error.message+'\nPlease contact: loic@cookers.io');
      }
      if(name === 'exception'){
        window.alert('Exception: '+event.data.message+'\nPlease contact: loic@cookers.io');
      }
    }
  }

  function _getUserId(){
    if(localStorage){
      var user = JSON.parse(localStorage.getItem('ionic-user'));
      if(user && user.id){
        return user.id;
      }
    }
  }

  return {
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

  Logger.track('exception', {data: data});
  return stopPropagation;
};
