angular.module('ionicApp')

.factory('WeekrecipeService', function($http, $q, $localStorage, firebaseUrl, RecipeService){
  'use strict';
  var service = {
    getCurrent: function(){ return getRecipesOfWeek(moment().week()); },
    get: getRecipesOfWeek,
    store: storeRecipesOfWeek
  };

  function getRecipesOfWeek(week){
    var weekrecipe = _.find($localStorage.weekrecipes, {id: week});
    if(weekrecipe){
      return $q.when(weekrecipe);
    } else {
      return downloadRecipesOfWeek(week);
    }
  }

  function downloadRecipesOfWeek(week){
    return $http.get(firebaseUrl+'/weekrecipes/'+week+'.json').then(function(result){
      storeRecipesOfWeek(result.data);
      for(var i in result.data.recipes){
        RecipeService.store(result.data.recipes[i]);
      }
      return result.data;
    });
  }

  function storeRecipesOfWeek(weekrecipe){
    //$localStorage.weekrecipes.push(weekrecipe);
  }

  return service;
})

.factory('RecipeService', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var service = {
    get: getRecipe,
    store: storeRecipe
  };

  function getRecipe(recipeId){
    var recipe = _.find($localStorage.recipes, {id: recipeId});
    if(recipe){
      return $q.when(recipe);
    } else {
      return downloadRecipe(recipeId);
    }
  }

  function downloadRecipe(recipeId){
    return $http.get(firebaseUrl+'/recipes/'+recipeId+'.json').then(function(result){
      storeRecipe(result.data);
      return result.data;
    });
  }

  function storeRecipe(recipe){
    //$localStorage.recipes.push(recipe);
  }

  return service;
})

.factory('CartService', function($localStorage){
  'use strict';
  var service = {
    hasLists: function(){return hasLists();},
    getAllLists: function(){return $localStorage.carts.lists;},
    getList: function(){return getList();},
    createList: function(){return buildCart();},
    addList: function(list){return addList(list);},
    changeList: function(index){return changeList(index);},
    removeList: function(){return removeList($localStorage.carts.current);},
    listHasRecipe: function(recipe){return listHasRecipe(getList(), recipe);},
    addRecipeToList: function(recipe){addRecipeToList(getList(), recipe);},
    removeRecipeFromList: function(recipe){removeRecipeFromList(getList(), recipe);},
    buyListItem: function(item){buyListItem(item);},
    buyListItemSource: function(source, item){buyListItemSource(source, item);},
    getListItems: function(){return getListItems();}
  };

  function hasLists(){
    return $localStorage.carts.current !== null;
  }
  function getList(){
    return hasLists() ? $localStorage.carts.lists[$localStorage.carts.current] : null;
  }
  function addList(list){
    $localStorage.carts.lists.unshift(list);
    $localStorage.carts.current = 0;
    return getList();
  }
  function changeList(index){
    if(hasLists() && typeof index === 'number' && -1 < index && index < $localStorage.carts.lists.length){
      $localStorage.carts.current = index;
    }
    return getList();
  }
  function removeList(index){
    if(hasLists() && typeof index === 'number' && -1 < index && index < $localStorage.carts.lists.length){
      $localStorage.carts.lists.splice(index, 1);
      if($localStorage.carts.lists.length === 0){
        $localStorage.carts.current = null;
      } else if($localStorage.carts.current === index){
        $localStorage.carts.current = 0;
      }
    }
    return getList();
  }

  function listHasRecipe(list, recipe){
    return list && list.recipes && recipe && recipe.id && _.findIndex(list.recipes, {id: recipe.id}) > -1;
  }
  function addRecipeToList(list, recipe){
    if(list){
      list.recipes.push(buildListRecipe(recipe));
    }
  }
  function removeRecipeFromList(list, recipe){
    if(list){
      var index = _.findIndex(list.recipes, {id: recipe.id});
      if(index > -1){
        list.recipes.splice(index, 1);
      }
    }
  }
  function buyListItem(item){
    for(var i in item.sources){
      item.sources[i].bought = true;
    }
    item.quantity = null;
  }
  function buyListItemSource(source, item){
    source.bought = true;
    item.quantity = computeListItemQuantity(item);
  }
  function getListItems(){
    var items = [];
    foreachIngredientInList(getList(), function(ingredient, recipeItem){
      if(!ingredient.bought){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){
          addQuantityToListItem(ingredient, recipeItem, item);
        } else {
          items.push(buildListItem(ingredient, recipeItem));
        }
      }
    });
    items.sort(function(a, b){
      if(a.food.category > b.food.category){return 1;}
      else if(a.food.category < b.food.category){return -1;}
      else if(a.name > b.name){return 1;}
      else if(a.name < b.name){return -1;}
      else {return 0;}
    });
    return items;
  }
  function addQuantityToListItem(ingredient, recipeItem, item){
    item.sources.push(buildListItemSource(ingredient, recipeItem));
    item.quantity = computeListItemQuantity(item);
  }
  function computeListItemQuantity(item){
    var quantity = null;
    for(var i in item.sources){
      var source = item.sources[i];
      if(!source.bought){
        if(quantity === null){
          quantity = source.quantity;
        } else {
          quantity = addQuantities(quantity, source.quantity);
        }
      }
    }
    return quantity;
  }
  function addQuantities(q1, q2){
    if(q1.unit === q2.unit){
      var q = angular.copy(q1);
      q.value += q2.value;
      return q;
    } else {
      // TODO
      window.alert('Should convert <'+q2.unit+'> to <'+q1.unit+'> !!!');
    }
  }
  function getQuantityForServings(quantity, initialServings, finalServings){
    var q = angular.copy(quantity);
    q.value = q.value * finalServings.value / initialServings.value;
    return q;
  }

  function foreachIngredientInList(list, callback){
    if(list && list.recipes){
      for(var i in list.recipes){
        var recipeItem = list.recipes[i];
        for(var j in recipeItem.data.ingredients){
          callback(recipeItem.data.ingredients[j], recipeItem, list);
        }
      }
    }
  }

  function buildListItemSource(ingredient, recipeItem){
    return {
      bought: false,
      quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
      ingredient: ingredient,
      recipe: recipeItem
    };
  }
  function buildListItem(ingredient, recipeItem){
    return {
      quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
      food: ingredient.food,
      sources: [buildListItemSource(ingredient, recipeItem)]
    };
  }
  function buildListRecipe(recipe){
    return {
      added: Date.now(),
      id: recipe.id,
      servings: angular.copy(recipe.servings),
      data: recipe
    };
  }
  function buildCart(){
    return {
      created: Date.now(),
      name: 'Liste du '+moment().format('LL'),
      recipes: []
    };
  }

  return service;
});