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
    $localStorage.weekrecipes.push(weekrecipe);
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
    $localStorage.recipes.push(recipe);
  }

  return service;
})

.factory('CartService', function($localStorage, LogService){
  'use strict';
  var service = {
    hasCarts: function(){return hasCarts();},
    getAllCarts: function(){return $localStorage.carts.contents;},
    getCurrentCart: function(){return getCurrentCart();},
    createCart: function(){return createCart();},
    changeCart: function(index){return changeCart(index);},
    removeCart: function(){return removeCart($localStorage.carts.current);},
    cartHasRecipe: function(recipe){return cartHasRecipe(getCurrentCart(), recipe);},
    addRecipeToCart: function(recipe){addRecipeToCart(getActiveCart(), recipe);},
    removeRecipeFromCart: function(recipe){removeRecipeFromCart(getCurrentCart(), recipe);},
    buyCartItem: function(item){buyCartItem(item, getCurrentCart(), true);},
    buyCartItemSource: function(source, item){buyCartItemSource(source, item, getCurrentCart(), true);},
    unbuyCartItem: function(item){buyCartItem(item, getCurrentCart(), false);},
    getCurrentCartItems: function(){return getCurrentCartItems(false);},
    getCurrentCartBoughtItems: function(){return getCurrentCartItems(true);},
    archiveCart: function(){return archiveCart(getCurrentCart());}
  };

  function hasCarts(){
    return $localStorage.carts && $localStorage.carts.contents && $localStorage.carts.contents.length > 0;
  }
  function getCurrentCart(){
    return hasCarts() ? $localStorage.carts.contents[$localStorage.carts.current] : null;
  }
  function getActiveCart(){
    var cart = getCurrentCart();
    if(cart === null || cart.archived){
      return createCart();
    } else {
      return cart;
    }
  }
  function createCart(){
    var cart = buildCart();
    $localStorage.carts.contents.unshift(cart);
    $localStorage.carts.current = 0;
    return getCurrentCart();
  }
  function archiveCart(cart){
    if(cart){
      cart.archived = Date.now();
    }
  }
  function changeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < $localStorage.carts.contents.length){
      $localStorage.carts.current = index;
    }
    return getCurrentCart();
  }
  function removeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < $localStorage.carts.contents.length){
      $localStorage.carts.contents.splice(index, 1);
      if($localStorage.carts.contents.length === 0){
        $localStorage.carts.current = null;
      } else if($localStorage.carts.current === index){
        $localStorage.carts.current = 0;
      }
    }
    return getCurrentCart();
  }

  function cartHasRecipe(cart, recipe){
    return cart && !cart.archived && cart.recipes && recipe && recipe.id && _.findIndex(cart.recipes, {id: recipe.id}) > -1;
  }
  function addRecipeToCart(cart, recipe){
    if(cart){
      cart.recipes.push(buildCartRecipe(recipe));
    }
  }
  function removeRecipeFromCart(cart, recipe){
    if(cart){
      _removeFromArrayWithId(cart.recipes, recipe.id);
    }
  }
  function _removeFromArrayWithId(array, id){
    var index = _.findIndex(array, {id: id});
    if(index > -1){
      array.splice(index, 1);
    }
  }
  function buyCartItem(item, cart, bought){
    for(var i in item.sources){
      buyCartItemSource(item.sources[i], item, cart, bought);
    }
  }
  function buyCartItemSource(source, item, cart, bought){
    var recipe = _.find(cart.recipes, {id: source.recipe.id});
    if(recipe){
      var ingredient = _.find(recipe.data.ingredients, {food: {id: source.ingredient.food.id}});
      if(ingredient){
        if(bought) {
          ingredient.bought = true;
          LogService.buyIngredient(ingredient, recipe);
          navigator.geolocation.getCurrentPosition(function(position){
            ingredient.bought = position;
          }, function(error){
            error.timestamp = Date.now();
            ingredient.bought = error;
          });
        } else {
          ingredient.bought = false;
        }
      }
    }
  }
  function getCurrentCartItems(bought){
    var items = [];
    foreachIngredientInCart(getCurrentCart(), function(ingredient, recipeItem){
      if(bought === !!ingredient.bought){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){
          addQuantityToCartItem(ingredient, recipeItem, item, bought);
        } else {
          items.push(buildCartItem(ingredient, recipeItem, bought));
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
  function addQuantityToCartItem(ingredient, recipeItem, item, bought){
    item.sources.push(buildCartItemSource(ingredient, recipeItem, bought));
    item.quantity = computeCartItemQuantity(item);
  }
  function computeCartItemQuantity(item){
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

  function foreachIngredientInCart(cart, callback){
    if(cart && cart.recipes){
      for(var i in cart.recipes){
        var recipeItem = cart.recipes[i];
        for(var j in recipeItem.data.ingredients){
          callback(recipeItem.data.ingredients[j], recipeItem, cart);
        }
      }
    }
  }

  function buildCartItemSource(ingredient, recipeItem, bought){
    return {
      bought: bought,
      quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
      ingredient: ingredient,
      recipe: recipeItem
    };
  }
  function buildCartItem(ingredient, recipeItem, bought){
    return {
      quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
      food: ingredient.food,
      bought: bought,
      sources: [buildCartItemSource(ingredient, recipeItem, bought)]
    };
  }
  function buildCartRecipe(recipe){
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
      archived: false,
      name: 'Liste du '+moment().format('LL'),
      recipes: []
    };
  }

  return service;
})

.factory('UserService', function($localStorage, $ionicPlatform, firebaseUrl){
  'use strict';
  var service = {
    get: function(){return $localStorage.user;},
    isFirstLaunch: function(){return !$localStorage.user.launchs;},
    firstLaunch: firstLaunch,
    launch: launch
  };

  function firstLaunch(){
    $ionicPlatform.ready(function(){
      var user = $localStorage.user;
      user.profile = {};
      user.device = actualDevice();
      user.launchs = [];
      launch();
    });
  }

  function launch(){
    var user = $localStorage.user;
    var addLaunch = function(user, launch){
      user.launchs.unshift(launch);
      var firebaseRef = new Firebase(firebaseUrl+'/connected');
      var userRef = firebaseRef.push(user);
      userRef.onDisconnect().remove();
    };
    var onSuccess = function(position){
      addLaunch(user, position);
    };
    var onError = function(error){
      error.timestamp = Date.now();
      addLaunch(user, error);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }

  function actualDevice(){
    var device = angular.copy(ionic.Platform.device());
    device.environment = getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    return device;
  }

  function getEnvironment(){
    if(ionic.Platform.isWebView()){return 'WebView';}
    else if(ionic.Platform.isIPad()){return 'IPad';}
    else if(ionic.Platform.isIOS()){return 'IOS';}
    else if(ionic.Platform.isAndroid()){return 'Android';}
    else if(ionic.Platform.isWindowsPhone()){return 'WindowsPhone';}
    else {return 'Unknown';}
  }

  return service;
})

.factory('LogService', function(UserService, firebaseUrl){
  'use strict';
  var buyLogsRef = new Firebase(firebaseUrl+'/logs/buy');
  var service = {
    buyIngredient: buyIngredient
  };

  function buyIngredient(ingredient, recipe){
    var user = UserService.get();
    var data = {};
    if(recipe && recipe.id){data.recipe = recipe.id;}
    if(ingredient && ingredient.food && ingredient.food.id){data.ingredient = ingredient.food.id;}
    if(user && user.device && user.device.uuid){data.device = user.device.uuid;}
    
    navigator.geolocation.getCurrentPosition(function(position){
      data.position = position;
      buyLogsRef.push(data);
    }, function(error){
      error.timestamp = Date.now();
      data.position = error;
      buyLogsRef.push(data);
    });
  }

  return service;
});