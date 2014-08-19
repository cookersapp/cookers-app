angular.module('app')

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
    if(unit === 'piece' || unit === 'pièce'){
      return '';
    } else {
      return unit;
    }
  };
})

.filter('quantity', function($filter){
  'use strict';
  return function(quantity, servingsAdjust){
    if(!servingsAdjust){servingsAdjust = 1;}
    return quantity && quantity.value > 0 ? $filter('number')(Math.round(quantity.value*servingsAdjust*100)/100)+' '+$filter('unit')(quantity.unit) : '';
  };
})

.filter('servings', function($filter){
  'use strict';
  return function(servings, servingsAdjust){
    if(!servingsAdjust){servingsAdjust = 1;}
    return servings && servings.value > 0 ? $filter('number')(Math.round(servings.value*servingsAdjust*100)/100)+' '+$filter('unit')(servings.unit) : '';
  };
})

.filter('time', function($filter){
  'use strict';
  return function(time){
    return time && time.eat > 0 ? $filter('number')(Math.round(time.eat*100)/100)+' '+$filter('unit')(time.unit) : '';
  };
})

.filter('date', function(){
  'use strict';
  return function(timestamp, format){
    return timestamp ? moment(timestamp).format(format ? format : 'LL') : '<date>';
  };
})

.filter('duration', function($filter){
  'use strict';
  return function(seconds, humanize){
    if(seconds || seconds === 0){
      if(humanize){
        return moment.duration(seconds, 'seconds').humanize();
      } else {
        var prefix = seconds < 60 ? '00:' : '';
        return prefix + moment.duration(seconds, 'seconds').format('hh:mm:ss');
      }
    } else {
      console.warn('Unable to format duration', seconds);
      return '<duration>';
    }
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

  function preWords(ingredient){
    if(ingredient && ingredient.pre){
      return ' ' + ingredient.pre + (endsWith(ingredient.pre, '\'') ? '' : ' ');
    } else {
      return ' ';
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
      return $filter('quantity')(ingredient.quantity, servingsAdjust) + preWords(ingredient) + ingredient.food.name + postWords(ingredient);
    } else {
      return '';
    }
  };
})

.filter('price', function($filter){
  'use strict';
  return function(price){
    return price ? $filter('number')(price.value, 2)+' '+price.currency+(price.unit ? '/' + price.unit : '') : '';
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
