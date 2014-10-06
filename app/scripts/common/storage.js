angular.module('app')

.factory('StorageSrv', function($window, $state, $q, _LocalStorageSrv, BackendUserSrv, AccountsSrv, Utils, LogSrv, localStorageDefault, appVersion){
  'use strict';
  var service = {
    init: init,
    getApp: _LocalStorageSrv.getApp,
    getUser: _LocalStorageSrv.getUser,
    getUserSetting: getUserSetting,
    saveUser: saveUser,
    saveUserEmail: saveUserEmail,
    saveUserSetting: saveUserSetting,
    saveUserData: saveUserData,
    getFood: function(id){return _LocalStorageSrv.getFoods().foods[id];},
    addFood: function(food){
      if(food && food.id){
        var dataFoods = _LocalStorageSrv.getFoods();
        dataFoods.foods[food.id] = food;
        _LocalStorageSrv.setFoods(dataFoods);
      }
    },
    getRecipe: function(id){return _LocalStorageSrv.getRecipes().recipes[id];},
    addRecipe: function(recipe){
      if(recipe && recipe.id){
        var dataRecipes = _LocalStorageSrv.getRecipes();
        dataRecipes.recipes[recipe.id] = recipe;
        _LocalStorageSrv.setRecipes(dataRecipes);
      }
    },
    getSelection: function(id){return _LocalStorageSrv.getSelections().selections[id];},
    addSelection: function(selection){
      if(selection && selection.id){
        var dataSelections = _LocalStorageSrv.getSelections();
        dataSelections.selections[selection.id] = selection;
        _LocalStorageSrv.setSelections(dataSelections);
      }
    },
    getRecipeHistory: function(){return _LocalStorageSrv.getRecipeHistory().recipes;},
    addRecipeToHistory: function(recipe){
      if(recipe && recipe.id){
        var userRecipeHistory = _LocalStorageSrv.getRecipeHistory();
        _.remove(userRecipeHistory.recipes, {id: recipe.id});
        userRecipeHistory.recipes.unshift(recipe);
        _LocalStorageSrv.setRecipeHistory(userRecipeHistory);
      }
    },
    getCarts: function(){return _LocalStorageSrv.getCarts().carts;},
    saveCart: function(cart){_LocalStorageSrv.updateCarts('carts', cart);},
    addCart: function(cart){
      var userCarts = _LocalStorageSrv.getCarts();
      userCarts.carts.unshift(cart);
      _LocalStorageSrv.setCarts(userCarts);
    },
    getStandaloneCookedRecipes: function(){return _LocalStorageSrv.getStandaloneCookedRecipes().recipes;},
    addStandaloneCookedRecipe: function(recipe){
      var userStandaloneCookedRecipes = _LocalStorageSrv.getStandaloneCookedRecipes();
      userStandaloneCookedRecipes.recipes.push(recipe);
      _LocalStorageSrv.setStandaloneCookedRecipes(userStandaloneCookedRecipes);
    },
    getGlobalMessages: function(){return _LocalStorageSrv.getGlobalmessages();},
    clearCache: function(){
      _LocalStorageSrv.setFoods(localStorageDefault.dataFoods);
      _LocalStorageSrv.setRecipes(localStorageDefault.dataRecipes);
      _LocalStorageSrv.setSelections(localStorageDefault.dataSelections);
    },
    clear: function(){
      _LocalStorageSrv.reset();
    }
  };

  function getUserSetting(setting){
    var user = _LocalStorageSrv.getUser();
    return user.settings[setting];
  }

  function saveUser(user, onlyLocal){
    _LocalStorageSrv.setUser(user);
    if(onlyLocal){
      return $q.when();
    } else {
      return BackendUserSrv.saveUser(user);
    }
  }
  function saveUserEmail(email){
    var user = _LocalStorageSrv.getUser();
    user.email = email;
    _LocalStorageSrv.setUser(user);
    return BackendUserSrv.saveUserEmail(user.id, email);
  }
  function saveUserSetting(setting, value){
    var user = _LocalStorageSrv.getUser();
    user.settings[setting] = value;
    _LocalStorageSrv.setUser(user);
    return BackendUserSrv.saveUserSetting(user.id, setting, value);
  }
  function saveUserData(data, value){
    var user = _LocalStorageSrv.getUser();
    user.data[data] = value;
    _LocalStorageSrv.setUser(user);
    return BackendUserSrv.saveUserData(user.id, data, value);
  }

  function init(){
    for(var i in localStorageDefault){
      var key = i;
      var defaultValue = localStorageDefault[key] || {};
      var storageValue = _LocalStorageSrv.get(key) || {};
      var extendedValue = Utils.extendDeep({}, defaultValue, storageValue);
      _LocalStorageSrv.set(key, extendedValue);
    }

    var app = _LocalStorageSrv.getApp();
    if(app.version === ''){
      app.version = appVersion;
      _LocalStorageSrv.setApp(app);
    } else if(app.version !== appVersion){
      _migrate(app.version, appVersion);
      app = _LocalStorageSrv.getApp();
      app.version = appVersion;
      _LocalStorageSrv.setApp(app);
    }
  }

  function _migrate(previousVersion, nextVersion){
    LogSrv.trackUpgrade(previousVersion, nextVersion);
    if(localStorage){
      AccountsSrv.getEmail().then(function(email){
        if(email){
          var user = _LocalStorageSrv.getUser();
          user.email = email;
          user.settings.recipeShiftOffset = Utils.randInt(0, 9);
          delete user.skipIntro;
          delete user.isLogged;
          delete user.loggedWith;
          delete user.name;
          delete user.avatar;
          delete user.background;
          delete user.backgroundCover;
          delete user.firstName;
          delete user.lastName;
          delete user.more;
          _LocalStorageSrv.setUser(user);
          BackendUserSrv.saveUser(user);
        }
      });
    }
  }

  return service;
})

.factory('_LocalStorageSrv', function($window){
  'use strict';
  var localStorageCache = {};
  var localStoragePrefix = 'ionic-';
  var service = {
    getApp: function(){return _get('app');},
    setApp: function(app){return _set('app', app);},
    getUser: function(){return _get('user');},
    setUser: function(user){return _set('user', user);},
    getFoods: function(){return _get('dataFoods');},
    setFoods: function(foods){return _set('dataFoods', foods);},
    getRecipes: function(){return _get('dataRecipes');},
    setRecipes: function(recipes){return _set('dataRecipes', recipes);},
    getSelections: function(){return _get('dataSelections');},
    setSelections: function(selections){return _set('dataSelections', selections);},
    getRecipeHistory: function(){return _get('userRecipeHistory');},
    setRecipeHistory: function(recipes){return _set('userRecipeHistory', recipes);},
    getCarts: function(){return _get('userCarts');},
    setCarts: function(carts){return _set('userCarts', carts);},
    updateCarts: function(key, value){return _updateStorageArray('userCarts', key, value);},
    getStandaloneCookedRecipes: function(){return _get('userStandaloneCookedRecipes');},
    setStandaloneCookedRecipes: function(recipes){return _set('userStandaloneCookedRecipes', recipes);},
    getGlobalmessages: function(){return _get('dataGlobalmessages');},
    setGlobalmessages: function(messages){return _set('dataGlobalmessages', messages);},
    get: _get,
    set: _set,
    reset: _reset
  };

  function _get(key){
    if(!localStorageCache[key] && $window.localStorage){
      localStorageCache[key] = JSON.parse($window.localStorage.getItem(localStoragePrefix+key));
    }
    return angular.copy(localStorageCache[key]);
  }

  function _set(key, value){
    if(!angular.equals(localStorageCache[key], value)){
      localStorageCache[key] = angular.copy(value);
      if($window.localStorage){
        $window.localStorage.setItem(localStoragePrefix+key, JSON.stringify(localStorageCache[key]));
      }
    } else {
      console.debug('Don\'t save <'+key+'> because values are equals !');
    }
  }

  function _updateStorageArray(storageKey, arrayKey, value){
    if(value && value.id){
      var storage = _get(storageKey);
      _updateArray(storage[arrayKey], value);
      _set(storageKey, storage);
    }
  }

  function _updateArray(arr, value){
    if(Array.isArray(arr)){
      var index = _.findIndex(arr, {id: value.id});
      if(index > -1){
        arr.splice(index, 1, value);
      }
    }
  }

  function _reset(){
    if($window.localStorage){
      localStorageCache = {};
      for(var i in $window.localStorage){
        $window.localStorage.removeItem(i);
      }
    }
  }

  return service;
});
