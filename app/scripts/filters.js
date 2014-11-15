angular.module('app')

.filter('rating', function($filter){
  'use strict';
  return function(rating, max, withText){
    var stars = rating ? new Array(Math.floor(rating)+1).join('★') : '';
    var maxStars = max ? new Array(Math.floor(max)-Math.floor(rating)+1).join('☆') : '';
    var text = withText ? ' ('+$filter('mynumber')(rating, 1)+' / '+$filter('mynumber')(max, 1)+')' : '';
    return stars+maxStars+text;
  };
})

.filter('date', function(){
  'use strict';
  return function(timestamp, format){
    return timestamp ? moment(timestamp).format(format ? format : 'll') : '<date>';
  };
})

.filter('duration', function($filter){
  'use strict';
  return function(seconds, humanize){
    if(seconds || seconds === 0){
      if(humanize){
        return moment.duration(seconds, 'seconds').humanize();
      } else {
        var prefix = -60 < seconds && seconds < 60 ? '00:' : '';
        return prefix + moment.duration(seconds, 'seconds').format('hh:mm:ss');
      }
    } else {
      console.warn('Unable to format duration', seconds);
      return '<duration>';
    }
  };
})

.filter('mynumber', function($filter){
  'use strict';
  return function(number, round){
    var mul = Math.pow(10, round ? round : 0);
    return $filter('number')(Math.round(number*mul)/mul);
  };
})

.filter('unit', function(){
  'use strict';
  return function(unit){
    if(unit === 'piece' || unit === 'pièce' || unit === 'unit'){
      return '';
    } else {
      return unit;
    }
  };
})

.filter('cookTime', function($filter){
  'use strict';
  return function(time){
    return time && time.eat > 0 ? $filter('mynumber')(time.eat, 2)+' '+$filter('unit')(time.unit) : '';
  };
})

.filter('servings', function($filter){
  'use strict';
  return function(servings, servingsAdjust){
    if(!servingsAdjust){servingsAdjust = 1;}
    var unit = $filter('unit')(servings.unit);
    return servings && servings.value > 0 ? $filter('mynumber')(servings.value*servingsAdjust, 2)+(unit ? ' '+unit : '') : '';
  };
})

.filter('price', function($filter){
  'use strict';
  return function(price, priceAdjust, showUnit){
    if(price){
      if(priceAdjust === undefined){priceAdjust = 1;}
      if(showUnit === undefined){showUnit = true;}
      return $filter('mynumber')(price.value*priceAdjust, 2) + ' ' + price.currency + (showUnit && price.unit ? '/' + price.unit : '');
    } else {
      return '<price>';
    }
  };
})

.filter('quantity', function($filter){
  'use strict';
  return function(quantity, servingsAdjust){
    if(!servingsAdjust){servingsAdjust = 1;}
    var unit = $filter('unit')(quantity ? quantity.unit : '');
    return quantity && quantity.value > 0 ? $filter('mynumber')(quantity.value*servingsAdjust, 2)+(unit ? ' '+unit : '') : '';
  };
})

.filter('tool', function(){
  'use strict';
  return function(tool){
    return tool && tool.name ? tool.name : '';
  };
})

.filter('ingredient', function($filter){
  'use strict';
  function endsWith(str, suffix){
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function preWords(ingredient, quantity){
    if(ingredient && ingredient.pre && quantity){
      return ' ' + ingredient.pre + (endsWith(ingredient.pre, '\'') ? '' : ' ');
    } else {
      return quantity ? ' ' : '';
    }
  }

  function postWords(ingredient){
    if(ingredient && ingredient.post){
      return ' ' + ingredient.post;
    } else {
      return '';
    }
  }

  return function(ingredient, servingsAdjust){
    if(ingredient){
      var quantity = $filter('quantity')(ingredient.quantity, servingsAdjust);
      return quantity + preWords(ingredient, quantity) + ingredient.food.name + postWords(ingredient);
    } else {
      return '';
    }
  };
})

// to filter & order ingredients by pertinence
/*.filter('ingredientFilter', function(){
  'use strict';
  function startsWith(str, sub){
    return str.indexOf(sub) === 0;
  }
  function priority(ingredient, querySlug){
    var words = getSlug(ingredient.name).split('-');
    for(var i=0; i<words.length; i++){
      if(startsWith(words[i], querySlug)){
        return i;
      }
    }
    return 100;
  }

  return function(ingredients, query){
    var filtered = [];
    if(query && query.length > 0){
      var querySlug = getSlug(query);
      angular.forEach(ingredients, function(ingredient){
        if(ingredient && ingredient.name){
          if(getSlug(ingredient.name).indexOf(querySlug) > -1){
            filtered.push(ingredient);
          }
        }
      });
      filtered.sort(function(a, b){
        return getSlug(a.value) > getSlug(b.value) ? 1 : -1;
      });
      filtered.sort(function(a, b){
        return priority(a, querySlug) - priority(b, querySlug);
      });
    }
    return filtered;
  };
})*/;
