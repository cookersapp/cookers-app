angular.module('app')

.factory('StorageSrv', function($window, $state, $q, LocalStorageUtils, BackendUserSrv, AccountsSrv, Utils, LogSrv, localStorageDefault){
  'use strict';
  var service = {
    get: _get,
    set: _set,
    remove: _remove,
    getApp: getApp,
    setApp: setApp,
    getUser: getUser,
    getUserSetting: getUserSetting,
    saveUser: saveUser,
    saveUserSetting: saveUserSetting,
    getRecipeHistory: getRecipeHistory,
    addRecipeToHistory: addRecipeToHistory,
    getCarts: getCarts,
    saveCart: saveCart,
    addCart: addCart,
    getStandaloneCookedRecipes: getStandaloneCookedRecipes,
    addStandaloneCookedRecipe: addStandaloneCookedRecipe,
    getGlobalMessages: getGlobalMessages,
    setGlobalmessages: setGlobalmessages,
    clear: function(){
      LocalStorageUtils.reset();
    }
  };

  function getApp(){ return _get('app'); }
  function setApp(app){ return _set('app', app); }
  function getUser(){ return _get('user'); }
  function getUserSetting(setting){
    var user = getUser();
    return user && user.settings ? user.settings[setting] : null;
  }
  function saveUser(user){ return _set('user', user); }
  function saveUserSetting(setting, value){
    var user = getUser();
    if(user && user.settings){
      user.settings[setting] = value;
      saveUser(user);
      return BackendUserSrv.updateUserSetting(user.id, setting, value);
    } else {
      if(!user){user = {};}
      user.settings = {};
      user.settings[setting] = value;
      saveUser(user);
      return $q.when();
    }
  }
  function getRecipeHistory(){
    var history = _get('userRecipeHistory');
    return history ? history.recipes : null;
  }
  function addRecipeToHistory(recipe){
    if(recipe && recipe.id){
      var userRecipeHistory = _get('userRecipeHistory');
      _.remove(userRecipeHistory.recipes, {id: recipe.id});
      userRecipeHistory.recipes.unshift(recipe);
      _set('userRecipeHistory', userRecipeHistory);
    }
  }
  function getCarts(){
    var userCarts = _get('userCarts');
    return userCarts ? userCarts.carts : null;
  }
  function saveCart(cart){
    if(cart && cart.id){
      var userCarts = _get('userCarts');
      if(userCarts && Array.isArray(userCarts.carts)){
        var index = _.findIndex(userCarts.carts, {id: cart.id});
        if(index > -1){
          userCarts.carts.splice(index, 1, cart);
          _set('userCarts', userCarts);
        }
      }
    }
  }
  function addCart(cart){
    var userCarts = _get('userCarts');
    userCarts.carts.unshift(cart);
    _set('userCarts', userCarts);
  }
  function getStandaloneCookedRecipes(){
    var userStandaloneCookedRecipes = _get('userStandaloneCookedRecipes');
    return userStandaloneCookedRecipes ? userStandaloneCookedRecipes.recipes : null;
  }
  function addStandaloneCookedRecipe(recipe){
    var userStandaloneCookedRecipes = _get('userStandaloneCookedRecipes');
    if(userStandaloneCookedRecipes && Array.isArray(userStandaloneCookedRecipes.recipes)){
      userStandaloneCookedRecipes.recipes.push(recipe);
      _set('userStandaloneCookedRecipes', userStandaloneCookedRecipes);
    }
  }
  function getGlobalMessages(){ return _get('dataGlobalmessages'); }
  function setGlobalmessages(messages){ return _set('dataGlobalmessages', messages); }



  function _get(key, defaultValue){
    return LocalStorageUtils.get(key, defaultValue || localStorageDefault[key]);
  }
  function _set(key, value){
    return LocalStorageUtils.set(key, value);
  }
  function _remove(key){
    return LocalStorageUtils.remove(key);
  }

  return service;
});
