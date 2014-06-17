angular.module('ionicApp')

.filter('unit', function(){
  'use strict';
  return function(unit) {
    if(unit === 'piece' || unit === 'pièce'){
      return '';
    } else {
      return unit;
    }
  };
})

.filter('quantity', function($filter){
  'use strict';
  return function(quantity) {
      return quantity.value+' '+$filter('unit')(quantity.unit);
  };
});