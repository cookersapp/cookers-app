angular.module('app.cart', ['app.utils', 'app.logger', 'ui.router', 'ngStorage'])

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.cart', {
    url: '/cart',
    abstract: true,
    views: {
      'menuContent': {
        templateUrl: 'scripts/cart/main.html',
        controller: 'CartCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.cart.recipes', {
    url: '/recipes',
    templateUrl: 'scripts/cart/recipes.html',
    controller: 'CartRecipesCtrl',
    data: {
      restrict: 'connected'
    }
  })
  .state('app.cart.ingredients', {
    url: '/ingredients',
    templateUrl: 'scripts/cart/ingredients.html',
    controller: 'CartIngredientsCtrl',
    data: {
      noSleep: true,
      restrict: 'connected'
    }
  });
})

.controller('CartCtrl', function($scope, $window, CartSrv, LogSrv){
  'use strict';
  // TODO : add $ionicPopover for more options (rename, archive, switch...)
  $scope.cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  $scope.archiveCart = function(){
    if($window.confirm('Archiver cette liste ?')){
      LogSrv.trackArchiveCart();
      CartSrv.archive($scope.cart);
      // TODO : what to do now ???
    }
  };
})

.controller('CartRecipesCtrl', function($scope, $window, CartSrv, LogSrv){
  'use strict';
  $scope.cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  $scope.selectedRecipe = null;

  $scope.ingredientBoughtPc = function(recipe){
    // TODO : this method is call 4 times by recipe... It's highly inefficient... Must fix !!!
    if(recipe && recipe.ingredients && recipe.ingredients.length > 0){
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
  };

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
    $window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CartIngredientsCtrl', function($scope, CartSrv, FirebaseSrv, dataList, LogSrv){
  'use strict';
  var cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();

  $scope.openedItems = [];
  $scope.customItems = cart.customItems;
  $scope.items = CartSrv.getItems(cart);

  $scope.customItemsEdited = function(customItems){
    cart.customItems = customItems;
    LogSrv.trackEditCartCustomItems(customItems);
  };

  $scope.categoryId = function(food){
    return getSlug(food.category);
  };
  $scope.isOpened = function(item){
    return _.findIndex($scope.openedItems, {food: {id: item.food.id}}) > -1;
  };
  $scope.toggleItem = function(item){
    var index = _.findIndex($scope.openedItems, {food: {id: item.food.id}});
    LogSrv.trackCartItemDetails(item.food.id, index > -1 ? 'hide' : 'show');
    if(index > -1){$scope.openedItems.splice(index, 1);}
    else {$scope.openedItems.push(item);}
  };

  $scope.allItemsBought = function(){
    var boughtItems = _.filter($scope.items, function(item){
      return $scope.isBought(item);
    });
    return $scope.items.length > 0 && $scope.items.length === boughtItems.length;
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
    CartSrv.buyItem(cart, item);
  };
  $scope.unbuyItem = function(item){
    LogSrv.trackUnbuyItem(item.food.id);
    CartSrv.unbuyItem(cart, item);
  };
})

.factory('CartSrv', function($localStorage, CartBuilder, CartUtils){
  'use strict';
  var service = {
    getCarts: sCarts,
    hasOpenedCarts: hasOpenedCarts,
    getOpenedCarts: getOpenedCarts,
    getCart: getCart,
    createCart: createCart,
    /*isRecipeExistInOpenedCart: isRecipeExistInOpenedCart,
    isRecipeExistInAllOpenedCart: isRecipeExistInAllOpenedCart,*/

    recipesFromOpenedCarts: recipesFromOpenedCarts,
    itemsFromOpenedCarts: itemsFromOpenedCarts,

    getItems: getItems,
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    removeRecipe: removeRecipe,
    buyItem: function(cart, item){buyItem(cart, item, true);},
    unbuyItem: function(cart, item){buyItem(cart, item, false);},
    archive: archive
  };

  function sCarts(){return $localStorage.user.carts;}

  function hasOpenedCarts(){
    return _.findIndex(sCarts(), {archived: false}) > -1;
  }

  function getOpenedCarts(){
    return _.filter(sCarts(), {archived: false});
  }

  function getCart(id){
    return _.find(sCarts(), {id: id});
  }

  function createCart(name){
    var cart = CartBuilder.createCart(name);
    sCarts().unshift(cart);
    return cart;
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
    return _.reduce(getOpenedCarts(), function(result, cart){
      return result.concat(cart.recipes);
    }, []);
  }

  function itemsFromOpenedCarts(){
    var recipes = recipesFromOpenedCarts();
    return CartUtils.recipesToItems(recipes);
  }

  function getItems(cart){
    return CartUtils.recipesToItems(cart.recipes);
  }

  function hasRecipe(cart, recipe){
    return _.findIndex(cart.recipes, {id: recipe.id}) > -1;
  }

  function addRecipe(cart, recipe, servings){
    var r = CartBuilder.createRecipe(recipe, servings);
    cart.recipes.push(r);
  }

  function removeRecipe(cart, recipe){
    _.remove(cart.recipes, {id: recipe.id});
  }

  function buyItem(cart, item, bought){
    _.map(item.sources, function(source){
      source.ingredient.bought = bought;
    });
  }

  function archive(cart){
    cart.archived = true;
  }

  function _cartsWithRecipe(carts, recipe){
    return _.filter(carts, function(cart){
      return hasRecipe(cart, recipe);
    });
  }

  return service;
})


.factory('CartUtils', function($window, CartBuilder, debug){
  'use strict';
  var service = {
    recipesToItems: recipesToItems
  };

  function recipesToItems(recipes){
    var items = [];
    _.map(recipes, function(recipe){
      _.map(recipe.ingredients, function(ingredient){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){ CartBuilder.addSourceToItem(item, ingredient, recipe); }
        else { items.push(CartBuilder.createItem(ingredient, recipe)); }
      });
    });
    _sortItemsByCategory(items);
    return items;
  }

  function _sortItemsByCategory(items){
    items.sort(function(a, b){
      if(a.food.category > b.food.category){return 1;}
      else if(a.food.category < b.food.category){return -1;}
      else if(a.name > b.name){return 1;}
      else if(a.name < b.name){return -1;}
      else {return 0;}
    });
  }

  return service;
})


.factory('CartBuilder', function(Utils){
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
      customItems: ''
    };
  }

  function createRecipe(recipe, servings){
    var r = angular.copy(recipe);
    r.cartData = {
      created: Date.now(),
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
    item.price = ingredient.bought ? null : source.price;
    item.quantity = ingredient.bought ? null : source.quantity;
    item.sources = [source];
    return item;
  }

  function addSourceToItem(item, ingredient, recipe){
    var source = _createItemSource(ingredient, recipe);
    if(!ingredient.bought){item.price = Utils.addPrices(item.price, source.price, item);}
    if(!ingredient.bought){item.quantity = Utils.addQuantities(item.quantity, source.quantity, item);}
    item.sources.push(source);
  }

  function _createItemSource(ingredient, recipe){
    return {
      price: Utils.adjustForServings(ingredient.price, recipe.servings, recipe.cartData.servings),
      quantity: Utils.adjustForServings(ingredient.quantity, recipe.servings, recipe.cartData.servings),
      ingredient: ingredient,
      recipe: recipe
    };
  }

  return service;
});
