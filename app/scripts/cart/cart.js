angular.module('app.cart', ['app.utils', 'app.logger', 'ngStorage'])

.factory('CartSrv2', function($localStorage, CartBuilder, CartUtils){
  'use strict';
  var service = {
    getCarts: getCarts,
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

  function getCarts(){return $localStorage.user.carts;}
  
  function hasOpenedCarts(){
    return _.findIndex(getCarts(), {archived: false}) > -1;
  }
  
  function getOpenedCarts(){
    return _.filter(getCarts(), {archived: false});
  }
  
  function getCart(id){
    return _.find(getCarts(), {id: id});
  }
  
  function createCart(name){
    var cart = CartBuilder.createCart(name);
    getCarts().unshift(cart);
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
      added: Date.now(),
      archived: false,
      name: name ? name : 'Liste du '+moment().format('LL'),
      recipes: [],
      customItems: ''
    };
  }

  function createRecipe(recipe, servings){
    var r = angular.copy(recipe);
    r.cartData = {
      added: Date.now(),
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
    if(!ingredient.bought){item.price = Utils.addPrices(item.price, source.price);}
    if(!ingredient.bought){item.quantity = Utils.addQuantities(item.quantity, source.quantity);}
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
