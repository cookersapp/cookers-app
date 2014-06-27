angular.module('ionicApp')

.filter('unit', function(){
  'use strict';
  return function(unit){
    if(unit === 'piece' || unit === 'pièce'){
      return '';
    } else {
      return unit;
    }
  };
})

.filter('quantity', function($filter){
  'use strict';
  return function(quantity){
    return quantity && quantity.value > 0 ? quantity.value+' '+$filter('unit')(quantity.unit) : '';
  };
})

.filter('ingredient', function($filter){
  'use strict';
  return function(ingredient){
    return ingredient ? $filter('quantity')(ingredient.quantity)+' '+(ingredient.pre?ingredient.pre:'')+' '+ingredient.food.name+' '+(ingredient.post?ingredient.post:'') : '';
  };
})

.filter('price', function($filter){
  'use strict';
  return function(price){
    return price ? $filter('number')(price.value, 2)+' '+price.currency+(price.unit ? '/' + price.unit : '') : '';
  };
});