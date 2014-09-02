angular.module('app')

.factory('IngredientUtils', function(LogSrv){
  'use strict';
  var service = {
    adjustForServings: adjustForServings,
    sum: sum
  };

  function sum(ingredients, _ctx, _errors){
    if(Array.isArray(ingredients) && ingredients.length > 0){
      var result = angular.copy(ingredients[0]);
      if(!_ctx){_ctx = {};}
      _ctx.ingredient = result;
      for(var i=1; i<ingredients.length; i++){
        result.quantity = addQuantities(result.quantity, ingredients[i].quantity, _ctx);
        result.price = addPrices(result.price, ingredients[i].price, _ctx);
      }
      return result;
    }
  }

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

  function addPrices(p1, p2, _ctx, _errors){
    var q = angular.copy(p1);
    if(q.unit === p2.unit){
      q.value += p2.value;
    } else {
      var err = {
        message: 'Can\'t add price <'+p1.unit+'> with price <'+p2.unit+'>'+(_ctx && _ctx.ingredient ? ' for ingredient <'+_ctx.ingredient.food.name+'>' : '')+' !'
      };
      if(_ctx && _ctx.ingredient){err.ingredient = angular.copy(_ctx.ingredient);}
      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('addIngredientsPrice', err); }
    }
    return q;
  }

  function adjustForServings(quantity, initialServings, finalServings, _errors){
    var q = angular.copy(quantity);
    if(initialServings.unit === finalServings.unit){
      q.value = q.value * finalServings.value / initialServings.value;
    } else {
      var err = {
        message: 'Quantity <'+quantity.unit+'> can\'t be converting from servings <'+initialServings.unit+'> to servings <'+finalServings.unit+'> !',
        quantity: angular.copy(quantity),
        initialServings: angular.copy(initialServings),
        finalServings: angular.copy(finalServings)
      };
      if(_errors) { _errors.push(err);  }
      else        { LogSrv.trackError('adjustForServings', err); }
    }
    return q;
  }

  return service;
});
