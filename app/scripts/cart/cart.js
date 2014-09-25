angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.cart', {
    url: '/cart',
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: 'scripts/cart/cart.html',
        controller: 'CartCtrl'
      }
    }
  })
  .state('app.cart.recipes', {
    url: '/recipes',
    templateUrl: 'scripts/cart/cart-recipes.html',
    controller: 'CartRecipesCtrl'
  })
  .state('app.cart.ingredients', {
    url: '/ingredients',
    templateUrl: 'scripts/cart/cart-ingredients.html',
    controller: 'CartIngredientsCtrl',
    data: {
      noSleep: true
    }
  });
})

.controller('CartCtrl', function($scope, $state, $ionicPopover, $window, CartSrv, LogSrv){
  'use strict';
  $scope.cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  if(!$scope.cart.$formated){$scope.cart.$formated = {};}
  $scope.cart.$formated.isEmpty = isEmpty($scope.cart);

  $ionicPopover.fromTemplateUrl('scripts/cart/cart-popover.html', {
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.archiveCart = function(){
    if($window.confirm('Archiver cette liste ?')){
      LogSrv.trackArchiveCart();
      CartSrv.archive($scope.cart);
      $scope.popover.remove();
      $state.go('app.home');
    }
  };

  function isEmpty(cart){
    return !(cart && ((cart.recipes && cart.recipes.length > 0) || (cart.customItems && cart.customItems.length > 0)));
  }
})

.controller('CartRecipesCtrl', function($scope, CartSrv, StorageSrv, ToastSrv, LogSrv){
  'use strict';
  $scope.selectedRecipe = null;
  $scope.totalPrice = CartSrv.getPrice($scope.cart);

  $scope.toggleRecipe = function(recipe){
    if($scope.selectedRecipe === recipe){
      LogSrv.trackCartRecipeDetails(recipe.id, 'hide');
      $scope.selectedRecipe = null;
    } else {
      LogSrv.trackCartRecipeDetails(recipe.id, 'show');
      $scope.selectedRecipe = recipe;
    }
  };

  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'cart');
    CartSrv.removeRecipe($scope.cart, recipe);
    ToastSrv.show('✔ recette supprimée de la liste de courses');
  };

  $scope.updateServings = function(recipe, servingsValue){
    StorageSrv.saveCart($scope.cart);
    $scope.totalPrice = CartSrv.getPrice($scope.cart);
  };
})

.controller('CartIngredientsCtrl', function($scope, CartSrv, StorageSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  $scope.totalPrice = CartSrv.getPrice($scope.cart);
  var user = StorageSrv.getUser();
  if(!(user && user.data && user.data.skipCartFeatures)){
    PopupSrv.tourCartFeatures().then(function(){
      StorageSrv.saveUserData('skipCartFeatures', true);
    });
  }

  // for compatibility
  if(!Array.isArray($scope.cart.customItems)){
    $scope.cart.customItems = customItemsToList($scope.cart.customItems);
    StorageSrv.saveCart($scope.cart);
  }
  $scope.customItems = $scope.cart.customItems;
  $scope.items = CartSrv.getItems($scope.cart);

  $scope.editingCustomItems = false;
  $scope.customItemsText = '';
  $scope.editCustomItems = function(){
    if(!$scope.editingCustomItems){
      $scope.editingCustomItems = true;
      $scope.customItemsText = customItemsToText($scope.cart.customItems);
    }
  };
  $scope.cancelCustomItems = function(){
    $scope.customItemsText = '';
    $scope.editingCustomItems = false;
  };
  $scope.saveCustomItems = function(){
    $scope.cart.customItems = customItemsToList($scope.customItemsText);
    $scope.customItems = $scope.cart.customItems;
    StorageSrv.saveCart($scope.cart);
    $scope.customItemsText = '';
    $scope.editingCustomItems = false;
    LogSrv.trackEditCartCustomItems($scope.cart.customItems);
  };
  $scope.buyCustomItem = function(item){
    item.bought = true;
    StorageSrv.saveCart($scope.cart);
    ToastSrv.show('✔ '+item.name+' acheté !');
  };
  $scope.unbuyCustomItem = function(item){
    item.bought = false;
    StorageSrv.saveCart($scope.cart);
  };

  function customItemsToList(customItems){
    if(typeof customItems === 'string'){
      return _.filter(_.map(customItems.split('\n'), function(item){
        var name = item.trim();
        if(name.length > 0){
          if(Utils.endsWith(name, ' ok')){
            return {bought: true, name: name.replace(/ ok/g, '')};
          } else {
            return {bought: false, name: name};
          }
        }
      }), function(item){
        return item && item.name && item.name.length > 0;
      });
    } else if(Array.isArray(customItems)){
      return angular.copy(customItems.trim());
    } else {
      LogSrv.trackError('cartCustomItemsError', {
        message: 'Can\'t parse customItems',
        customItems: angular.copy(customItems)
      });
    }
  }
  function customItemsToText(customItems){
    if(typeof customItems === 'string'){
      return angular.copy(customItems.trim());
    } else if(Array.isArray(customItems)){
      return _.map(customItems, function(item){
        return item.name+(item.bought ? ' ok' : '');
      }).join('\n');
    } else {
      LogSrv.trackError('cartCustomItemsError', {
        message: 'Can\'t parse customItems',
        customItems: angular.copy(customItems)
      });
    }
  }

  $scope.openedItems = [];
  $scope.isOpened = function(item){
    return _.findIndex($scope.openedItems, {food: {id: item.food.id}}) > -1;
  };
  $scope.toggleItem = function(item){
    var index = _.findIndex($scope.openedItems, {food: {id: item.food.id}});
    LogSrv.trackCartItemDetails(item.food.id, index > -1 ? 'hide' : 'show');
    if(index > -1){$scope.openedItems.splice(index, 1);}
    else {$scope.openedItems.push(item);}
  };

  $scope.cartHasItems = function(){
    return $scope.items.length > 0 || $scope.customItems.length > 0;
  };
  $scope.cartHasItemsToBuy = function(){
    var itemsToBuy = _.filter($scope.items, function(item){
      return !$scope.isBought(item);
    });
    return itemsToBuy.length > 0;
  };
  $scope.cartHasCustomItemsToBuy = function(){
    var itemsToBuy = _.filter($scope.customItems, function(item){
      return !item.bought;
    });
    return itemsToBuy.length > 0;
  };
  $scope.isBought = function(item){
    var bought = true;
    angular.forEach(item.sources, function(source){
      if(!source.ingredient.bought){bought = false;}
    });
    return bought;
  };
  $scope.buyItem = function(item){
    LogSrv.trackBuyItem(item.food.id);
    CartSrv.buyItem($scope.cart, item);
    ToastSrv.show('✔ '+item.food.name+' acheté !');
  };
  $scope.unbuyItem = function(item){
    LogSrv.trackUnbuyItem(item.food.id);
    CartSrv.unbuyItem($scope.cart, item);
  };
})

.factory('CartSrv', function(StorageSrv, PriceCalculator, _CartBuilder, _CartUtils){
  'use strict';
  var service = {
    getCarts: StorageSrv.getCarts,
    hasOpenedCarts: hasOpenedCarts,
    getOpenedCarts: getOpenedCarts,
    getCart: getCart,
    getRecipeFromCart: getRecipeFromCart,
    getCartRecipe: getCartRecipe,
    createCart: createCart,
    updateCart: updateCart,
    updateCartRecipe: updateCartRecipe,
    /*isRecipeExistInOpenedCart: isRecipeExistInOpenedCart,
    isRecipeExistInAllOpenedCart: isRecipeExistInAllOpenedCart,*/

    recipesFromOpenedCarts: recipesFromOpenedCarts,
    itemsFromOpenedCarts: itemsFromOpenedCarts,
    getRecipesToCook: getRecipesToCook,
    getCookedRecipes: getCookedRecipes,
    addStandaloneCookedRecipe: StorageSrv.addStandaloneCookedRecipe,

    getPrice: getPrice,
    getItems: getItems,
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    removeRecipe: removeRecipe,
    buyItem: function(cart, item){buyItem(cart, item, true);},
    unbuyItem: function(cart, item){buyItem(cart, item, false);},
    archive: archive
  };

  function hasOpenedCarts(){
    return _.findIndex(StorageSrv.getCarts(), {archived: false}) > -1;
  }

  function getOpenedCarts(){
    return _.filter(StorageSrv.getCarts(), {archived: false});
  }

  function getCart(id){
    return _.find(StorageSrv.getCarts(), {id: id});
  }

  function getRecipeFromCart(cart, recipeId){
    return cart ? _.find(cart.recipes, {id: recipeId}) : null;
  }

  function getCartRecipe(cartId, recipeId){
    var cart = getCart(cartId);
    return getRecipeFromCart(cart, recipeId);
  }

  function createCart(name){
    var cart = _CartBuilder.createCart(name);
    StorageSrv.addCart(cart);
    return cart;
  }

  function updateCart(cart){
    StorageSrv.saveCart(cart);
  }

  function updateCartRecipe(recipe){
    if(recipe && recipe.cartData && recipe.cartData.cart){
      var cart = getCart(recipe.cartData.cart);
      var cartRecipe = getRecipeFromCart(cart, recipe.id);
      if(cartRecipe){
        angular.copy(recipe, cartRecipe);
        updateCart(cart);
      }
    }
  }

  /*function isRecipeExistInOpenedCart(recipe){
    return _cartsWithRecipe(getOpenedCarts(), recipe).length > 0;
  }

  function isRecipeExistInAllOpenedCart(recipe){
    var openedCarts = getOpenedCarts();
    var cartsWithRecipe = _cartsWithRecipe(openedCarts, recipe);
    return openedCarts.length === cartsWithRecipe.length;
  }*/

  function recipesFromOpenedCarts(){
    return _recipesFromCarts(getOpenedCarts());
  }

  function itemsFromOpenedCarts(){
    var recipes = recipesFromOpenedCarts();
    return _CartUtils.recipesToItems(recipes);
  }

  /*
   * if recipe.cartData.cooked is :
   *  - false                         : recipe should be cooked (tocook screen)
   *  - 'none'                        : recipe is abandonned
   *  - {time: 123, duration: 123.2}  : recipe is cooked
   */
  function getRecipesToCook(order){
    var recipes = _recipesFromCarts(StorageSrv.getCarts());
    var ret = _.filter(recipes, {cartData: {cooked: false}});
    if(order && typeof order === 'function' && ret && Array.isArray(ret)){
      ret.sort(order);
    }
    return ret;
  }

  function getCookedRecipes(order){
    var recipes = _recipesFromCarts(StorageSrv.getCarts());
    var cartCookedRecipes = _.filter(recipes, function(recipe){
      return recipe && recipe.cartData && recipe.cartData.cooked && recipe.cartData.cooked !== 'none' && recipe.cartData.cooked !== false;
    });
    var standaloneCookedRecipes = StorageSrv.getStandaloneCookedRecipes();
    var ret = cartCookedRecipes.concat(standaloneCookedRecipes);
    if(order && typeof order === 'function' && ret && Array.isArray(ret)){
      ret.sort(order);
    }
    return ret;
  }

  function getPrice(cart){
    if(cart && cart.recipes && Array.isArray(cart.recipes)){
      var totalPrice = null;
      for(var i=0; i<cart.recipes.length; i++){
        var recipe = cart.recipes[i];
        var recipePrice = PriceCalculator.getForServings(recipe.price, recipe.cartData.servings);
        if(i === 0){
          totalPrice = recipePrice;
        } else {
          totalPrice = PriceCalculator.add(totalPrice, recipePrice);
        }
      }
      return totalPrice;
    }
  }

  function getItems(cart){
    return _CartUtils.recipesToItems(cart.recipes);
  }

  function hasRecipe(cart, recipe){
    return _.findIndex(cart.recipes, {id: recipe.id}) > -1;
  }

  function addRecipe(cart, recipe, servings){
    var r = _CartBuilder.createRecipe(cart, recipe, servings);
    cart.recipes.push(r);
    StorageSrv.saveCart(cart);
  }

  function removeRecipe(cart, recipe){
    _.remove(cart.recipes, {id: recipe.id});
    StorageSrv.saveCart(cart);
  }

  function buyItem(cart, item, bought){
    _.map(item.sources, function(source){
      source.ingredient.bought = bought;
    });
    for(var i in item.sources){
      var recipeSrc = item.sources[i].recipe;
      recipeSrc.cartData.boughtPc = _CartUtils.boughtPercentage(recipeSrc);
    }
    StorageSrv.saveCart(cart);
  }

  function archive(cart){
    cart.archived = true;
    StorageSrv.saveCart(cart);
  }

  function _recipesFromCarts(carts){
    return _.reduce(carts, function(result, cart){
      return result.concat(cart.recipes);
    }, []);
  }

  function _cartsWithRecipe(carts, recipe){
    return _.filter(carts, function(cart){
      return hasRecipe(cart, recipe);
    });
  }

  return service;
})


// this service should be used only on other services in this file !!!
.factory('_CartUtils', function(_CartBuilder){
  'use strict';
  var service = {
    recipesToItems: recipesToItems,
    boughtPercentage: boughtPercentage
  };

  function recipesToItems(recipes){
    var items = [];
    _.map(recipes, function(recipe){
      _.map(recipe.ingredients, function(ingredient){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){ _CartBuilder.addSourceToItem(item, ingredient, recipe); }
        else { items.push(_CartBuilder.createItem(ingredient, recipe)); }
      });
    });
    _sortItemsByCategory(items);
    return items;
  }

  function boughtPercentage(recipe){
    if(recipe && recipe.cartData && recipe.ingredients && recipe.ingredients.length > 0){
      var ingredientBought = 0;
      for(var i in recipe.ingredients){
        if(recipe.ingredients[i].bought){
          ingredientBought++;
        }
      }
      return 100 * ingredientBought / recipe.ingredients.length;
    } else {
      return 100;
    }
  }

  function _sortItemsByCategory(items){
    items.sort(function(a, b){
      var aCategory = a && a.food && a.food.category && a.food.category.order ? a.food.category.order : 50;
      var bCategory = b && b.food && b.food.category && b.food.category.order ? b.food.category.order : 50;
      var aName = a && a.name ? a.name.toLowerCase() : '';
      var bName = b && b.name ? b.name.toLowerCase() : '';
      if(aCategory > bCategory){return 1;}
      else if(aCategory < bCategory){return -1;}
      else if(aName > bName){return 1;}
      else if(aName < bName){return -1;}
      else {return 0;}
    });
  }

  return service;
})


// this service should be used only on other services in this file !!!
.factory('_CartBuilder', function(PriceCalculator, QuantityCalculator, Utils){
  'use strict';
  var service = {
    createCart: createCart,
    createRecipe: createRecipe,
    createItem: createItem,
    addSourceToItem: addSourceToItem
  };

  function createCart(name){
    return {
      id: Utils.createUuid(),
      created: Date.now(),
      archived: false,
      name: name ? name : 'Liste du '+moment().format('LL'),
      recipes: [],
      customItems: []
    };
  }

  function createRecipe(cart, recipe, servings){
    var r = angular.copy(recipe);
    r.cartData = {
      cart: cart.id,
      created: Date.now(),
      boughtPc: 0,
      cooked: false,
      servings: {
        value: servings,
        unit: recipe.servings.unit
      }
    };
    return r;
  }

  function createItem(ingredient, recipe){
    var item = angular.copy(ingredient);
    var source = _createItemSource(ingredient, recipe);
    item.price = source.price;
    item.quantity = source.quantity;
    item.sources = [source];
    return item;
  }

  function addSourceToItem(item, ingredient, recipe){
    var source = _createItemSource(ingredient, recipe);
    item.sources.push(source);
    var _ctx = {ingredient: item};
    item.price = PriceCalculator.sum(_.map(item.sources, 'price'), _ctx);
    item.quantity = QuantityCalculator.sum(_.map(item.sources, 'quantity'), _ctx);
  }

  function _createItemSource(ingredient, recipe){
    return {
      price: PriceCalculator.adjustForServings(ingredient.price, recipe.servings, recipe.cartData.servings),
      quantity: QuantityCalculator.adjustForServings(ingredient.quantity, recipe.servings, recipe.cartData.servings),
      ingredient: ingredient,
      recipe: recipe
    };
  }

  return service;
});
