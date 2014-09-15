angular.module('app')

.factory('PriceCalculator', function($window, LogSrv){
  'use strict';
  var service = {
    add: addPrices,
    sum: sumPrices,
    getForServings: getForServings,
    adjustForServings: adjustForServings
  };

  function addPrices(p1, p2, _ctx, _errors){
    var p = angular.copy(p1);
    if(p.currency === p2.currency && !p1.unit && !p2.unit){
      p.value += p2.value;
    } else {
      var err = {
        message: 'Unexpected error on addPrices',
        p1: angular.copy(p1),
        p2: angular.copy(p2)
      };
      
      // known errors
      if(p.currency !== p2.currency){ err.message = 'Can\'t add price <'+p1.currency+'> with price <'+p2.currency+'>'; }
      else if(p1.unit){ err.message = 'Price p1 has unit <'+p1.unit+'>'; }
      else if(p2.unit){ err.message = 'Price p2 has unit <'+p2.unit+'>'; }
      
      // add context info
      if(_ctx && _ctx.ingredient){
        err.ingredient = angular.copy(_ctx.ingredient);
        err.message = err.message + ' for ingredient <'+_ctx.ingredient.food.name+'>';
      }
      
      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('addIngredientsPrice', err); }
    }
    return p;
  }
  
  function sumPrices(prices, _ctx, _errors){
    if(Array.isArray(prices) && prices.length > 0){
      var result = angular.copy(prices[0]);
      for(var i=1; i<prices.length; i++){
        result = addPrices(result, prices[i], _ctx, _errors);
      }
      return result;
    }
  }
  
  // transform an unitary price (1€/personne) in a price (3€) using servings (3 personnes)
  function getForServings(unitPrice, servings, _errors){
    if(unitPrice.unit && unitPrice.unit === servings.unit){
      return {
        value: unitPrice.value * servings.value,
        currency: unitPrice.currency
      };
    } else {
      var err = {
        message: 'Unexpected error on PriceCalculator.getForServings',
        price: angular.copy(unitPrice),
        servings: angular.copy(servings)
      };
      
      // known errors
      if(!unitPrice.unit){err.message = 'UnitPrice does not has unit <'+unitPrice.unit+'>';}
      else if(unitPrice.unit !== servings.unit){err.message = 'Can \'t convert price with unit <'+unitPrice.unit+'> to unit <'+servings.unit+'>';}
      
      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('PriceCalculator.getForServings', err); }
    }
  }

  function adjustForServings(price, initialServings, finalServings, _errors){
    if(initialServings.unit === finalServings.unit){
      var p = angular.copy(price);
      p.value = p.value * (finalServings.value / initialServings.value);
      return p;
    } else {
      var err = {
        message: 'Unexpected error on PriceCalculator.adjustForServings',
        price: angular.copy(price),
        initialServings: angular.copy(initialServings),
        finalServings: angular.copy(finalServings)
      };

      // known errors
      if(initialServings.unit !== finalServings.unit){err.message = 'Can \'t convert servings <'+initialServings.unit+'> to <'+finalServings.unit+'>';}

      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('PriceCalculator.adjustForServings', err); }
    }
  }

  return service;
});
