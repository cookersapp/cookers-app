angular.module('app')

.factory('CartSrv', function(StorageSrv, PriceCalculator, ItemUtils, CollectionUtils, _CartBuilder, _CartUtils){
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
    isRecipeExistInAllOpenedCart: isRecipeExistInAllOpenedCart,
    recipesFromOpenedCarts: recipesFromOpenedCarts,
    itemsFromOpenedCarts: itemsFromOpenedCarts,*/

    getRecipesToCook: getRecipesToCook,
    getCookedRecipes: getCookedRecipes,
    addStandaloneCookedRecipe: StorageSrv.addStandaloneCookedRecipe,

    getPrice: getPrice,
    getProductPrice: getProductPrice,
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    removeRecipe: removeRecipe,
    buyItem: function(cart, item){buyItem(cart, item, true);},
    unbuyItem: function(cart, item){buyItem(cart, item, false);},
    addProduct: addProduct,
    removeProduct: removeProduct,
    updateProduct: updateProduct,
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
  }

  function recipesFromOpenedCarts(){
    return _recipesFromCarts(getOpenedCarts());
  }

  function itemsFromOpenedCarts(){
    var recipes = recipesFromOpenedCarts();
    return ItemUtils.recipesToItems(recipes);
  }*/

  /*
   * if recipe.cartData.cooked is :
   *  - false                         : recipe should be cooked (tocook screen)
   *  - 'none'                        : recipe is abandonned
   *  - {time: 123, duration: 123.2}  : recipe is cooked
   */
  function getRecipesToCook(order){
    var recipes = _recipesFromCarts(StorageSrv.getCarts());
    var ret = _.filter(recipes, {cartData: {cooked: false}});
    if(typeof order === 'function' && Array.isArray(ret)){
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
    if(typeof order === 'function' && Array.isArray(ret)){
      ret.sort(order);
    }
    return ret;
  }

  function getPrice(cart){
    var zero = {value: 0, currency: '€'};
    if(cart && Array.isArray(cart.recipes)){
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
      return totalPrice ? totalPrice : zero;
    } else {
      return zero;
    }
  }

  function getProductPrice(cart){
    var zero = {value: 0, currency: '€'};
    if(cart && Array.isArray(cart.products)){
      var totalPrice = null;
      for(var i=0; i<cart.products.length; i++){
        var product = cart.products[i];
        var productPrice = angular.copy(product.store.price);
        productPrice.value = productPrice.value * product.cartData.quantity;
        if(i === 0){
          totalPrice = productPrice;
        } else {
          totalPrice = PriceCalculator.add(totalPrice, productPrice);
        }
      }
      return totalPrice ? totalPrice : zero;
    } else {
      return zero;
    }
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

  function addProduct(cart, product, quantity){
    if(!cart.products){cart.products = [];}
    var cartProduct = _.find(cart.products, {barcode: product.barcode});
    var cartNewProduct = _CartBuilder.createProduct(cart, product, quantity);
    if(cartProduct){
      cartProduct.cartData.quantity += quantity;
    } else {
      cart.products.push(cartNewProduct);
    }
    StorageSrv.saveCart(cart);
  }

  function removeProduct(cart, product){
    if(cart.products){
      var cartProductIndex = _.findIndex(cart.products, {barcode: product.barcode});
      if(typeof cartProductIndex === 'number'){
        cart.products.splice(cartProductIndex, 1);
      }
      StorageSrv.saveCart(cart);
    }
  }

  function updateProduct(cart, product){
    var cartProduct = _.find(cart.products, {barcode: product.barcode});
    if(cartProduct){
      angular.copy(product, cartProduct);
      StorageSrv.saveCart(cart);
    }
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


.factory('ItemUtils', function(PriceCalculator, QuantityCalculator, StorageSrv, CollectionUtils, _CartBuilder){
  'use strict';
  var service = {
    fromCart: fromCart,
    addProduct: addProduct,
    addCartProduct: addCartProduct,
    removeCartProduct: removeCartProduct,
    sort: sortItemsByCategory
  };

  function fromCart(cart){
    var items = [];
    if(cart){
      if(Array.isArray(cart.recipes)){
        _.map(cart.recipes, function(recipe){
          _.map(recipe.ingredients, function(ingredient){
            var item = _.find(items, {food: {id: ingredient.food.id}});
            if(item){ _addSourceToItem(item, ingredient, recipe); }
            else { items.push(_createItem(ingredient, recipe)); }
          });
        });
      }
      if(Array.isArray(cart.products)){
        _.map(cart.products, function(product){
          addCartProduct(items, product, false);
        });
      }
    }
    sortItemsByCategory(items);
    return items;
  }

  function addProduct(cart, items, product, quantity){
    var cartProduct = _CartBuilder.createProduct(cart, product, quantity);
    addCartProduct(items, cartProduct, true);
  }

  function addCartProduct(items, cartProduct, _sort){
    var item = _.find(items, {food: {id: cartProduct.foodId}});
    var itemProduct = item && item.products ? _.find(item.products, {barcode: cartProduct.barcode}) : null;
    if(itemProduct){
      itemProduct.cartData.quantity += cartProduct.cartData.quantity;
    } else if(item){
      if(!item.products){item.products = [];}
      item.products.push(angular.copy(cartProduct));
    } else {
      var food = StorageSrv.getFood(cartProduct.foodId) || {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres', slug: 'autres'}};
      items.push({
        food: food,
        products: [angular.copy(cartProduct)]
      });
      if(_sort === undefined || _sort === true){
        sortItemsByCategory(items);
      }
    }
  }

  function removeCartProduct(items, cartProduct){
    var itemIndex = _.findIndex(items, {food: {id: cartProduct.foodId}});
    var item = items[itemIndex];
    var itemProductIndex = item && item.products ? _.findIndex(item.products, {barcode: cartProduct.barcode}) : null;
    if(typeof itemProductIndex === 'number'){
      item.products.splice(itemProductIndex, 1);
      if(CollectionUtils.isEmpty(item.products) && CollectionUtils.isEmpty(item.sources)){
        items.splice(itemIndex, 1);
      }
    }
  }

  function sortItemsByCategory(items){
    if(Array.isArray(items)){
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


.factory('CartUiUtils', function($state, $window, CartSrv, ItemUtils, ProductSrv, ToastSrv, IonicUi){
  'use strict';
  var service = {
    initStartSelfScanModal: initStartSelfScanModal,
    initScanModal: initScanModal,
    initProductModal: initProductModal,
    initCartOptions: initCartOptions
  };

  function initStartSelfScanModal($scope){
    var scope = $scope.$new();
    var fn = {};
    var modal = {fn: fn};
    scope.modal = modal;

    fn.cancelSelfScan = function(){
      modal.self.hide();
    };
    fn.activeSelfScan = function(){
      scope.data.cart.selfscan = true;
      CartSrv.updateCart(scope.data.cart);
      $state.go('app.cart.selfscan');
      modal.self.hide();
    };

    return IonicUi.initModal(scope, 'scripts/cart/partials/shop-modal.html').then(function(modal){
      scope.modal.self = modal;
      return modal;
    });
  }

  function initScanModal($scope){
    var scope = $scope.$new();
    var fn = {};
    var modal = {fn: fn};
    scope.modal = modal;

    fn.addToCart = function(product){
      CartSrv.addProduct(scope.data.cart, product, 1);
      ItemUtils.addProduct(scope.data.cart, scope.data.items, product, 1);
      scope.data.totalProductsPrice = CartSrv.getProductPrice(scope.data.cart);
      ToastSrv.show('✔ '+product.name+' acheté !');
      modal.self.hide().then(function(){
        scope.data.product = null;
      });
    };
    fn.notAddToCart = function(){
      console.log('notAddToCart');
      modal.self.hide().then(function(){
        scope.data.product = null;
      });
    };

    return IonicUi.initModal(scope, 'scripts/cart/partials/scan-modal.html').then(function(modal){
      scope.modal.self = modal;
      return modal;
    });
  }

  function initProductModal($scope){
    var scope = $scope.$new();
    var fn = {};
    var modal = {fn: fn};
    scope.modal = modal;

    scope.$watch('data.updateProductFood', function(food){
      if(food && scope.data.product && scope.data.product.foodId !== food.id){
        updateProductFood(scope.data.product, food);
      }
    });
    function updateProductFood(cartProduct, food){
      ProductSrv.setFoodId(cartProduct.barcode, food.id).then(function(){
        ItemUtils.removeCartProduct(scope.data.items, cartProduct);
        cartProduct.foodId = food.id;
        ItemUtils.addCartProduct(scope.data.items, cartProduct);
        CartSrv.updateProduct(scope.data.cart, cartProduct);
        ToastSrv.show(scope.data.product.name+' est assigné comme '+food.name);
      });
    }

    fn.close = function(){
      modal.self.hide().then(function(){
        scope.data.product = null;
      });
    };

    return IonicUi.initModal(scope, 'scripts/cart/partials/product-modal.html').then(function(modal){
      scope.modal.self = modal;
      return modal;
    });
  }

  function initCartOptions($scope){
    var scope = $scope.$new();
    var fn = {};
    var popover = {fn: fn};
    scope.popover = popover;

    fn.archiveCart = function(){
      if($window.confirm('Archiver cette liste ?')){
        CartSrv.archive(data.cart);
        popover.self.remove();
        $state.go('app.home');
      }
    };

    return IonicUi.initPopover(scope, 'scripts/cart/partials/cart-popover.html').then(function(popover){
      scope.popover.self = popover;
      return popover;
    });
  }

  return service;
})


.factory('_CartUtils', function(){
  'use strict';
  var service = {
    boughtPercentage: boughtPercentage
  };

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

  return service;
})


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
