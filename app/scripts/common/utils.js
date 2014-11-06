angular.module('app')

.factory('Utils', function($interval){
  'use strict';
  var service = {
    createUuid: createUuid,
    extendDeep: extendDeep,
    isEmail: isEmail,
    endsWith: endsWith,
    randInt: randInt,
    clock: addClock,
    cancelClock: removeClock,
    getDevice: getDevice,
    exitApp: exitApp
  };

  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  function extendDeep(dest){
    angular.forEach(arguments, function(arg){
      if(arg !== dest){
        angular.forEach(arg, function(value, key){
          if(dest[key] && typeof dest[key] === 'object'){
            extendDeep(dest[key], value);
          } else {
            dest[key] = angular.copy(value);
          }
        });
      }
    });
    return dest;
  }

  function isEmail(str){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
  }

  function endsWith(str, suffix){
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function randInt(min, max){
    return Math.floor(Math.random()*(max - min + 1)) - min;
  }

  var clockElts = [];
  var clockTimer = null;
  var clockCpt = 0;
  function addClock(fn){
    var elt = {
      id: clockCpt++,
      fn: fn
    };
    clockElts.push(elt);
    if(clockElts.length === 1){ startClock(); }
    return elt.id;
  }
  function removeClock(id){
    for(var i in clockElts){
      if(clockElts[i].id === id){
        clockElts.splice(i, 1);
      }
    }
    if(clockElts.length === 0){ stopClock(); }
  }
  function startClock(){
    if(clockTimer === null){
      clockTimer = $interval(function(){
        for(var i in clockElts){
          clockElts[i].fn();
        }
      }, 1000);
    }
  }
  function stopClock(){
    if(clockTimer !== null){
      $interval.cancel(clockTimer);
      clockTimer = null;
    }
  }

  function getDevice(){
    var device = angular.copy(ionic.Platform.device());
    delete device.getInfo;
    device.environment = _getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    return device;
  }

  function _getEnvironment(){
    if(ionic.Platform.isWebView()){return 'WebView';}
    else if(ionic.Platform.isIPad()){return 'IPad';}
    else if(ionic.Platform.isIOS()){return 'IOS';}
    else if(ionic.Platform.isAndroid()){return 'Android';}
    else if(ionic.Platform.isWindowsPhone()){return 'WindowsPhone';}
    else {return 'Unknown';}
  }

  function exitApp(){
    if(navigator.app){
      navigator.app.exitApp();
    } else if(navigator.device){
      navigator.device.exitApp();
    }
  }

  return service;
});
