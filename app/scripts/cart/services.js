angular.module('app')

// holds list of items to share it between cart controllers
.factory('ItemsSrv', function(CartSrv, CollectionUtils){
  'use strict';
  var service = {
    items: [],
    loadCart: loadCart
  };

  function loadCart(cart){
    CollectionUtils.copy(CartSrv.getItemsWithProducts(cart), service.items);
  }

  return service;
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
    getItemsWithProducts: getItemsWithProducts,
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    removeRecipe: removeRecipe,
    buyItem: function(cart, item){buyItem(cart, item, true);},
    unbuyItem: function(cart, item){buyItem(cart, item, false);},
    buyProduct: buyProduct,
    unbuyProduct: unbuyProduct,
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

  function getItemsWithProducts(cart){
    var items = _CartUtils.recipesToItems(cart.recipes);
    return _CartUtils.itemsWithProducts(items, cart.products);
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

  function buyProduct(cart, items, product, quantity){
    if(!cart.products){cart.products = [];}
    var cartProduct = _.find(cart.products, {barcode: product.barcode});
    var cartNewProduct = _CartBuilder.createProduct(cart, product, quantity);
    if(cartProduct){
      cartProduct.cartData.quantity += quantity;
    } else {
      cart.products.push(cartNewProduct);
    }
    StorageSrv.saveCart(cart);

    // update showed items
    var foodId = product.foodId;
    var item = foodId ? _.find(items, {food: {id: foodId}}) : _.find(items, {food: {id: 'unknown'}});
    var itemProduct = item && item.products ? _.find(item.products, {barcode: product.barcode}) : null;
    if(item && !itemProduct){
      if(!item.products){item.products = [];}
      item.products.push(cartNewProduct);
    } else if(!item) {
      items.push({
        food: {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres'}},
        products: [cartNewProduct]
      });
    }
  }

  function unbuyProduct(cart, product){
    // TODO
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
.factory('_CartUtils', function(_CartBuilder, PriceCalculator, QuantityCalculator){
  'use strict';
  var service = {
    recipesToItems: recipesToItems,
    itemsWithProducts: itemsWithProducts,
    boughtPercentage: boughtPercentage
  };

  function recipesToItems(recipes){
    var items = [];
    _.map(recipes, function(recipe){
      _.map(recipe.ingredients, function(ingredient){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){ _addSourceToItem(item, ingredient, recipe); }
        else { items.push(_createItem(ingredient, recipe)); }
      });
    });
    _sortItemsByCategory(items);
    return items;
  }

  function itemsWithProducts(items, products){
    if(Array.isArray(products)){
      _.map(products, function(product){
        var foodId = product.foodId;
        var item = foodId ? _.find(items, {food: {id: foodId}}) : _.find(items, {food: {id: 'unknown'}});
        if(item){
          if(!item.products){item.products = [];}
          item.products.push(product);
        } else {
          items.push({
            food: {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres'}},
            products: [product]
          });
        }
      });
    }
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

  function _createItem(ingredient, recipe){
    var item = angular.copy(ingredient);
    var source = _createItemSource(ingredient, recipe);
    item.price = source.price;
    item.quantity = source.quantity;
    item.sources = [source];
    return item;
  }

  function _addSourceToItem(item, ingredient, recipe){
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
})


// this service should be used only on other services in this file !!!
.factory('_CartBuilder', function(Utils){
  'use strict';
  var service = {
    createCart: createCart,
    createRecipe: createRecipe,
    createProduct: createProduct
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

  function createProduct(cart, product, quantity){
    var p = angular.copy(product);
    p.cartData = {
      cart: cart.id,
      created: Date.now(),
      quantity: quantity
    };
    return p;
  }

  return service;
});
