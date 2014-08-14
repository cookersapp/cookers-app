angular.module('app.utils', [])

.factory('Utils', function($window, $interval, debug){
  'use strict';
  var service = {
    createUuid: createUuid,
    adjustForServings: adjustForServings,
    addQuantities: addQuantities,
    addPrices: addPrices,
    getDevice: getDevice,
    clock: addClock,
    cancelClock: removeClock
  };

  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  function adjustForServings(quantity, initialServings, finalServings){
    var q = angular.copy(quantity);
    if(initialServings.unit === finalServings.unit){
      q.value = q.value * finalServings.value / initialServings.value;
    } else {
      if(debug){
        console.warn('quantity', quantity);
        console.warn('initialServings', initialServings);
        console.warn('finalServings', finalServings);
        $window.alert('Unable to adjustForServings <'+initialServings.unit+'> => <'+finalServings.unit+'>');
      } else {
        //TODO track
      }
    }
    return q;
  }

  function addQuantities(q1, q2, source){
    return _add(q1, q2, source);
  }

  function addPrices(p1, p2, source){
    var q1 = p1 ? {unit: p1.currency, value: p1.value} : null;
    var q2 = p2 ? {unit: p2.currency, value: p2.value} : null;
    var q = _add(q1, q2, source);
    return q ? {currency: q.unit, value: q.value} : null;
  }

  function _add(q1, q2, source){
    if(!q1){ return q2; }
    else if(!q2) { return q1; }
    else if(q1.unit === q2.unit){
      var q = angular.copy(q1);
      q.value += q2.value;
      return q;
    } else {
      if(debug){
        if(source){console.warn('source', source);}
        console.warn('quantitiy 1', q1);
        console.warn('quantitiy 2', q2);
        $window.alert('Unable to convert <'+q2.unit+'> to <'+q1.unit+'>'+(source && source.food ? ' on <'+source.food.name+'>' : '')+' !!!');
      } else {
        //TODO track
      }
      return null;
    }
  }

  var clockElts = [];
  var clockTimer = null;
  function addClock(fn){
    if(clockElts.length === 0){ startClock(); }
    return clockElts.push(fn) - 1;
  }
  function removeClock(index){
    if(0 <= index && index < clockElts.length){clockElts.splice(index, 1);}
    if(clockElts.length === 0){ stopClock(); }
  }
  function startClock(){
    if(clockTimer === null){
      clockTimer = $interval(function(){
        for(var i in clockElts){
          clockElts[i]();
        }
      }, 1000);
    }
  }
  function stopClock(){
    if(clockTimer !== null){
      $interval.cancel(clockTimer);
      timer = null;
    }
  }

  function getDevice(){
    var device = angular.copy(ionic.Platform.device());
    delete device.getInfo;
    device.environment = _getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    if(!device.uuid){
      device.uuid = createUuid();
    }
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

  return service;
});
