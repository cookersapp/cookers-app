angular.module('app')

.factory('QuantityCalculator', function($window, LogSrv){
  'use strict';
  var service = {
    add: addQuantities,
    sum: sumQuantities,
    adjustForServings: adjustForServings
  };

  function addQuantities(q1, q2, _ctx, _errors){
    var q = angular.copy(q1);
    if(q.unit === q2.unit){
      q.value += q2.value;
    } else {
      var err = {
        message: 'Can\'t add quantity <'+q1.unit+'> with quantity <'+q2.unit+'>'+(_ctx && _ctx.ingredient ? ' for ingredient <'+_ctx.ingredient.food.name+'>' : '')+' !'
      };
      if(_ctx && _ctx.ingredient){err.ingredient = angular.copy(_ctx.ingredient);}
      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('addIngredientsQuantity', err); }
    }
    return q;
  }

  function sumQuantities(quantities, _ctx, _errors){
    if(Array.isArray(quantities) && quantities.length > 0){
      var result = angular.copy(quantities[0]);
      for(var i=1; i<quantities.length; i++){
        result = addQuantities(result, quantities[i], _ctx, _errors);
      }
      return result;
    }
  }

  function adjustForServings(quantity, initialServings, finalServings, _errors){
    if(initialServings.unit === finalServings.unit){
      var q = angular.copy(quantity);
      q.value = q.value * (finalServings.value / initialServings.value);
      return q;
    } else {
      var err = {
        message: 'Unexpected error on QuantityCalculator.adjustForServings',
        quantity: angular.copy(quantity),
        initialServings: angular.copy(initialServings),
        finalServings: angular.copy(finalServings)
      };

      // known errors
      if(initialServings.unit !== finalServings.unit){err.message = 'Can \'t convert servings <'+initialServings.unit+'> to <'+finalServings.unit+'>';}

      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('QuantityCalculator.adjustForServings', err); }
    }
  }

  return service;
});
