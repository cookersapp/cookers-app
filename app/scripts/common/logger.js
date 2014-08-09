angular.module('app.logger', [])

// TODO : problem : lose trace of source log (file & line)
/*.factory('Logger', function(){
  'use strict';
  var service = {
    log: log,
    warn: warn
  };

  function log(text, obj){
    if(obj){console.log(text, obj);}
    else {console.log(text);}
  }

  function warn(text, obj){
    if(obj){console.warn(text, obj);}
    else {console.warn(text);}
  }

  return service;
})*/;
