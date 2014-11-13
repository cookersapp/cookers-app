angular.module('app')

.factory('StorageSrv', function($q, LocalForageUtils, UserSrv){
  'use strict';
  var service = {
    get: _get,
    set: _set,
    remove: _remove,
    getApp: getApp,
    setApp: setApp,
    getRecipeHistory: getRecipeHistory,
    addRecipeToHistory: addRecipeToHistory,
    getStandaloneCookedRecipes: getStandaloneCookedRecipes,
    addStandaloneCookedRecipe: addStandaloneCookedRecipe,
    clear: LocalForageUtils.clear
  };

  function getApp(){ return _get('app'); }
  function setApp(app){ return _set('app', app); }
  function getRecipeHistory(){
    return _get('userRecipeHistory').then(function(history){
      return history ? history.recipes : null;
    });
  }
  function addRecipeToHistory(recipe){
    if(recipe && recipe.id){
      return _get('userRecipeHistory').then(function(userRecipeHistory){
        if(!userRecipeHistory){userRecipeHistory = {};}
        if(!Array.isArray(userRecipeHistory.recipes)){userRecipeHistory.recipes = [];}
        _.remove(userRecipeHistory.recipes, {id: recipe.id});
        userRecipeHistory.recipes.unshift(recipe);
        return _set('userRecipeHistory', userRecipeHistory);
      });
    } else {
      return $q.when();
    }
  }
  function getStandaloneCookedRecipes(){
    return _get('userStandaloneCookedRecipes').then(function(userStandaloneCookedRecipes){
      return userStandaloneCookedRecipes ? userStandaloneCookedRecipes.recipes : null;
    });
  }
  function addStandaloneCookedRecipe(recipe){
    return _get('userStandaloneCookedRecipes').then(function(userStandaloneCookedRecipes){
      if(userStandaloneCookedRecipes && Array.isArray(userStandaloneCookedRecipes.recipes)){
        userStandaloneCookedRecipes.recipes.push(recipe);
        return _set('userStandaloneCookedRecipes', userStandaloneCookedRecipes);
      }
    });
  }



  function _get(key, defaultValue){
    return LocalForageUtils.get(key, defaultValue);
  }
  function _set(key, value){
    return LocalForageUtils.set(key, value);
  }
  function _remove(key){
    return LocalForageUtils.remove(key);
  }

  return service;
});
