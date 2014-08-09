angular.module('app.utils', [])

.factory('Utils', function(){
  'use strict';
  var service = {
    createUuid: createUuid,
    adjustForServings: adjustForServings,
    addQuantities: addQuantities,
    addPrices: addPrices
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
        $window.alert('Unable to adjustForServings <'+initialServings.unit+'> => <'+finalServings.unit+'>');
        console.warn('quantity', quantity);
        console.warn('initialServings', initialServings);
        console.warn('finalServings', finalServings);
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
    var q1 = { unit: p1.currency, value: p1.value };
    var q2 = { unit: p2.currency, value: p2.value };
    return _add(q1, q2, source);
  }
  
  function _add(q1, q2, source){
    var q = angular.copy(q1);
    if(q1.unit === q2.unit){
      q.value += q2.value;
    } else {
      if(debug){
        $window.alert('Unable to convert <'+q2.unit+'> to <'+q1.unit+'>'+(source && source.food ? ' on <'+source.food.name+'>' : '')+' !!!');
        if(source){console.warn('source', source);}
        console.warn('quantitiy 1', q1);
        console.warn('quantitiy 2', q2);
      } else {
        //TODO track
      }
    }
    return q;
  }

  return service;
});
