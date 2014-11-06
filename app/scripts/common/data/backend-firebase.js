angular.module('app')

.factory('BackendSrv', function($q, $http, StorageSrv, CollectionUtils, CompatibilitySrv, firebaseUrl){
  'use strict';
  var service = {
    getRecipe: getRecipe,
    getFood: getFood,
    getFoods: getFoods,
    getSelection: getSelection
  };

  function getRecipe(id){
    var recipe = StorageSrv.getRecipe(id);
    if(recipe){
      return $q.when(recipe);
    } else {
      return $http.get(firebaseUrl+'/recipes/'+id+'.json').then(function(result){
        var recipe = result.data;
        if(recipe && recipe.ingredients){
          for(var i in recipe.ingredients){
            var ing = recipe.ingredients[i];
            CompatibilitySrv.setFoodCategoryToObj(ing.food);
          }
        }
        StorageSrv.addRecipe(recipe);
        return recipe;
      });
    }
  }

  function getFood(id){
    var food = StorageSrv.getFood(id);
    if(food){
      return $q.when(food);
    } else {
      return $http.get(firebaseUrl+'/foods/'+id+'.json').then(function(result){
        var food = result.data;
        CompatibilitySrv.setFoodCategoryToObj(food);
        StorageSrv.addFood(food);
        return food;
      });
    }
  }

  function getFoods(){
    var foods = StorageSrv.getFoods();
    var promise = $http.get(firebaseUrl+'/foods.json').then(function(result){
      angular.copy(result.data, foods);
      for(var i in foods){
        CompatibilitySrv.setFoodCategoryToObj(foods[i]);
      }
      StorageSrv.setFoods(foods);
      return foods;
    });

    if(CollectionUtils.size(foods) === 0){
      return promise;
    } else {
      return $q.when(foods);
    }
  }

  function getSelection(id){
    var selection = StorageSrv.getSelection(id);
    if(selection){
      return $q.when(selection);
    } else {
      return $http.get(firebaseUrl+'/selections/'+id+'.json').then(function(result){
        return loadFullSelection(result.data);
      }).then(function(selection){
        StorageSrv.addSelection(selection);
        return selection;
      });
    }
  }

  function loadFullSelection(selection){
    if(selection && selection.recipes){
      var recipePromises = [];
      for(var i in selection.recipes){
        recipePromises.push(getRecipe(selection.recipes[i].id));
      }
      return $q.all(recipePromises).then(function(recipes){
        selection.recipes = recipes;
        return selection;
      });
    } else {
      return $q.when(selection);
    }
  }

  return service;
});
