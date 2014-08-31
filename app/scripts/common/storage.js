angular.module('app')

.factory('StorageSrv', function($window, $state, localStorageDefault, appVersion){
  'use strict';
  var localStorageCache = {};
  var service = {
    init: init,
    getApp: function(){return _get('app');},
    getUser: function(){return _get('user');},
    saveUser: function(user){return _set('user', user);},
    saveUserSetting: function(setting, value){
      var user = _get('user');
      user.settings[setting] = value;
      _set('user', user);
    },
    getUserProfiles: function(){return _get('userSocialProfiles');},
    getUserProfile: function(provider){return _get('userSocialProfiles')[provider];},
    saveUserProfiles: function(userProfiles){return _set('userSocialProfiles', userProfiles);},
    getFood: function(id){return _get('dataFoods').foods[id];},
    addFood: function(food){
      if(food && food.id){
        var dataFoods = _get('dataFoods');
        dataFoods.foods[food.id] = food;
        _set('dataFoods', dataFoods);
      }
    },
    getRecipe: function(id){return _get('dataRecipes').recipes[id];},
    addRecipe: function(recipe){
      if(recipe && recipe.id){
        var dataRecipes = _get('dataRecipes');
        dataRecipes.recipes[recipe.id] = recipe;
        _set('dataRecipes', dataRecipes);
      }
    },
    getSelection: function(id){return _get('dataSelections').selections[id];},
    addSelection: function(selection){
      if(selection && selection.id){
        var dataSelections = _get('dataSelections');
        dataSelections.selections[selection.id] = selection;
        _set('dataSelections', dataSelections);
      }
    },
    getRecipeHistory: function(){return _get('userRecipeHistory').recipes;},
    addRecipeToHistory: function(recipe){
      if(recipe && recipe.id){
        var userRecipeHistory = _get('userRecipeHistory');
        _.remove(userRecipeHistory.recipes, {id: recipe.id});
        userRecipeHistory.recipes.unshift(recipe);
        _set('userRecipeHistory', userRecipeHistory);
      }
    },
    getCarts: function(){return _get('userCarts').carts;},
    saveCart: function(cart){_updateStorageArray('userCarts', 'carts', cart);},
    addCart: function(cart){
      var userCarts = _get('userCarts');
      userCarts.carts.unshift(cart);
      _set('userCarts', userCarts);
    },
    getStandaloneCookedRecipes: function(){return _get('userStandaloneCookedRecipes').recipes;},
    addStandaloneCookedRecipe: function(recipe){
      var userStandaloneCookedRecipes = _get('userStandaloneCookedRecipes');
      userStandaloneCookedRecipes.recipes.push(recipe);
      _set('userStandaloneCookedRecipes', userStandaloneCookedRecipes);
    },
    getGlobalMessages: function(){return _get('dataGlobalmessages');},
    clearCache: function(){
      _set('dataFoods', localStorageDefault.dataFoods);
      _set('dataRecipes', localStorageDefault.dataRecipes);
      _set('dataSelections', localStorageDefault.dataSelections);
    },
    clear: function(){
      _reset();
    }
  };

  function init(){
    for(var i in localStorageDefault){
      var key = i;
      var defaultValue = localStorageDefault[key] || {};
      var storageValue = _get(key) || {};
      var extendedValue = _extendDeep({}, defaultValue, storageValue);
      _set(key, extendedValue);
    }

    var app = JSON.parse(localStorage.getItem('ngStorage-app'));
    if(!app){app = _get('app');}
    if(app.version === ''){
      app.version = appVersion;
      _set('app', app);
    } else if(app.version !== appVersion){
      _migrate(app.version, appVersion);
      app = _get('app');
      app.version = appVersion;
      _set('app', app);
    }
  }

  function _migrate(previousVersion, nextVersion){
    console.log('migrate from '+previousVersion+' to '+nextVersion);
    if(localStorage){
      var app = JSON.parse(localStorage.getItem('ngStorage-app'));
      var user = JSON.parse(localStorage.getItem('ngStorage-user'));
      var data = JSON.parse(localStorage.getItem('ngStorage-data'));
      var logs = JSON.parse(localStorage.getItem('ngStorage-logs'));

      _reset();
      for(var i in localStorageDefault){
        _set(i, localStorageDefault[i]);
      }

      if(previousVersion === '0.1.0'){
        $window.alert('For this upgrade, all data is reseted ! Sorry for the incovenience :(');
        $state.go('intro');
      }
      if(previousVersion === '0.2.0' || previousVersion === '0.3.0'){
        if(app)                                   { var sApp                          = angular.copy(app);                                        }
        if(user)                                  { var sUser                         = angular.copy(user);                                       }
        if(sUser && !sUser.data)                  { sUser.data = { skipCookFeatures: false, skipCartFeatures: false };                            }
        if(sUser)                                 { delete sUser.score;                                                                           }
        if(sUser)                                 { delete sUser.profiles;                                                                        }
        if(sUser)                                 { delete sUser.carts;                                                                           }
        if(sUser)                                 { delete sUser.standaloneCookedRecipes;                                                         }
        if(user && user.profiles)                 { var sUserSocialProfiles           = angular.copy(user.profiles);                              }
        if(user && user.carts)                    { var sUserCarts                    = { carts: angular.copy(user.carts) };                      }
        if(user && user.standaloneCookedRecipes)  { var sUserStandaloneCookedRecipes  = { recipes: angular.copy(user.standaloneCookedRecipes) };  }
        if(logs && logs.recipesHistory)           { var sUserRecipeHistory            = { recipes: angular.copy(logs.recipesHistory) };           }
        if(data && data.globalmessage)            { var sDataGlobalmessages           = angular.copy(data.globalmessages);                        }

        _reset();
        for(var i in localStorageDefault){
          _set(i, localStorageDefault[i]);
        }

        if(sApp)                          { _set('app', sApp);                                                  }
        if(sUser)                         { _set('user', sUser);                                                }
        if(sUserSocialProfiles)           { _set('userSocialProfiles', sUserSocialProfiles);                    }
        if(sUserCarts)                    { _set('userCarts', sUserCarts);                                      }
        if(sUserStandaloneCookedRecipes)  { _set('userStandaloneCookedRecipes', sUserStandaloneCookedRecipes);  }
        if(sUserRecipeHistory)            { _set('userRecipeHistory', sUserRecipeHistory);                      }
        if(sDataGlobalmessages)           { _set('dataGlobalmessages', sDataGlobalmessages);                    }
      }
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

  function _get(key){
    if(!localStorageCache[key] && $window.localStorage){
      localStorageCache[key] = JSON.parse($window.localStorage.getItem('ionic-'+key));
    }
    return angular.copy(localStorageCache[key]);
  }

  function _set(key, value){
    if(!angular.equals(localStorageCache[key], value)){
      localStorageCache[key] = value;
      if($window.localStorage){
        $window.localStorage.setItem('ionic-'+key, JSON.stringify(value));
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

  function _extendDeep(dest){
    angular.forEach(arguments, function(arg){
      if(arg !== dest){
        angular.forEach(arg, function(value, key){
          if(dest[key] && typeof dest[key] === 'object'){
            _extendDeep(dest[key], value);
          } else {
            dest[key] = angular.copy(value);
          }
        });
      }
    });
    return dest;
  }

  return service;
});
