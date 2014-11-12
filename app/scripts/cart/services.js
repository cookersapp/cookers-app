angular.module('app')

.factory('CartSrv', function(StorageSrv, CartDataSrv, _CartBuilder, _CartUtils){
  'use strict';
  var storageKey = 'userCarts';
  var service = {
    getCurrentCart: getCurrentCart,
    getRecipeFromCart: getRecipeFromCart,
    getCartRecipe: getCartRecipe,
    createCart: CartDataSrv.createCart,
    updateCart: CartDataSrv.updateCart,
    updateCartRecipe: updateCartRecipe,
    getRecipesToCook: getRecipesToCook,
    getCookedRecipes: getCookedRecipes,
    addStandaloneCookedRecipe: StorageSrv.addStandaloneCookedRecipe
  };

  function _hasOpenedCarts(carts){ return _.findIndex(carts, {archived: false}) > -1; }
  function _getOpenedCarts(carts){ return _.filter(carts, {archived: false}); }
  function _getCart(carts, id){ return _.find(carts, {id: id}); }
  function getCartRecipe(cartId, recipeId){
    return CartDataSrv.getCarts().then(function(carts){
      return getRecipeFromCart(_getCart(carts, cartId), recipeId);
    });
  }
  function getCurrentCart(){
    return CartDataSrv.getCarts().then(function(carts){
      var cart = _hasOpenedCarts(carts) ? _getOpenedCarts(carts)[0] : CartDataSrv.createCart();
      if(!cart._formated){ cart._formated = {}; }
      cart._formated.isEmpty = isEmpty(cart);
      return cart;
    });
  }
  function getRecipeFromCart(cart, recipeId){ return cart ? _.find(cart.recipes, {id: recipeId}) : null; }

  function isEmpty(cart){
    return !(cart && (
      (cart.recipes && cart.recipes.length > 0) ||
      (cart.customItems && cart.customItems.length > 0) ||
      (cart.products && cart.products.length > 0)));
  }

  function updateCartRecipe(recipe){
    if(recipe && recipe.cartData && recipe.cartData.cart){
      return CartDataSrv.getCarts().then(function(carts){
        var cart = _getCart(carts, recipe.cartData.cart);
        var cartRecipe = getRecipeFromCart(cart, recipe.id);
        if(cartRecipe){
          angular.copy(recipe, cartRecipe);
          return CartDataSrv.updateCart(cart);
        }
      });
    }
  }

  /*
   * if recipe.cartData.cooked is :
   *  - false                         : recipe should be cooked (tocook screen)
   *  - 'none'                        : recipe is abandonned
   *  - {time: 123, duration: 123.2}  : recipe is cooked
   */
  function getRecipesToCook(order){
    return CartDataSrv.getCarts().then(function(carts){
      var recipes = _recipesFromCarts(carts);
      var ret = _.filter(recipes, {cartData: {cooked: false}});
      if(typeof order === 'function' && Array.isArray(ret)){
        ret.sort(order);
      }
      return ret;
    });
  }

  function getCookedRecipes(order){
    return CartDataSrv.getCarts().then(function(carts){
      var recipes = _recipesFromCarts(carts);
      var cartCookedRecipes = _.filter(recipes, function(recipe){
        return recipe && recipe.cartData && recipe.cartData.cooked && recipe.cartData.cooked !== 'none' && recipe.cartData.cooked !== false;
      });
      return StorageSrv.getStandaloneCookedRecipes().then(function(standaloneCookedRecipes){
        var ret = cartCookedRecipes.concat(standaloneCookedRecipes);
        if(typeof order === 'function' && Array.isArray(ret)){
          ret.sort(order);
        }
        return ret;
      });
    });
  }

  function _recipesFromCarts(carts){
    return _.reduce(carts, function(result, cart){
      return result.concat(cart.recipes);
    }, []);
  }

  return service;
})


.factory('CartUtils', function(PriceCalculator, CartDataSrv, _CartUtils, _CartBuilder){
  'use strict';
  var service = {
    getEstimatedPrice: getEstimatedPrice,
    getShopPrice: getShopPrice,
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

  function getEstimatedPrice(cart){
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

  function getShopPrice(cart){
    var zero = {value: 0, currency: '€'};
    if(cart && Array.isArray(cart.products)){
      var totalPrice = null;
      for(var i=0; i<cart.products.length; i++){
        var product = cart.products[i];
        var productPrice = angular.copy(product.cartData.price);
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
    CartDataSrv.updateCart(cart);
  }

  function removeRecipe(cart, recipe){
    _.remove(cart.recipes, {id: recipe.id});
    CartDataSrv.updateCart(cart);
  }

  function buyItem(cart, item, bought){
    _.map(item.sources, function(source){
      source.ingredient.bought = bought;
    });
    for(var i in item.sources){
      var recipeSrc = item.sources[i].recipe;
      recipeSrc.cartData.boughtPc = _CartUtils.boughtPercentage(recipeSrc);
    }
    CartDataSrv.updateCart(cart);
  }

  function addProduct(cart, product, quantity, price){
    if(!cart.products){cart.products = [];}
    var cartProduct = _.find(cart.products, {barcode: product.barcode});
    var cartNewProduct = _CartBuilder.createProduct(cart, product, quantity, price);
    if(cartProduct){
      cartProduct.cartData.quantity += quantity;
    } else {
      cart.products.push(cartNewProduct);
    }
    CartDataSrv.updateCart(cart);
  }

  function removeProduct(cart, product){
    if(cart.products){
      var cartProductIndex = _.findIndex(cart.products, {barcode: product.barcode});
      if(typeof cartProductIndex === 'number'){
        cart.products.splice(cartProductIndex, 1);
      }
      CartDataSrv.updateCart(cart);
    }
  }

  function updateProduct(cart, product){
    var cartProduct = _.find(cart.products, {barcode: product.barcode});
    if(cartProduct){
      angular.copy(product, cartProduct);
      CartDataSrv.updateCart(cart);
    }
  }

  function archive(cart){
    cart.archived = true;
    CartDataSrv.updateCart(cart);
  }

  return service;
})


.factory('ItemUtils', function(PriceCalculator, QuantityCalculator, FoodSrv, CollectionUtils, _CartBuilder){
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

  function addProduct(cart, items, product, quantity, price){
    var cartProduct = _CartBuilder.createProduct(cart, product, quantity, price);
    addCartProduct(items, cartProduct, true);
  }

  function addCartProduct(items, cartProduct, _sort, __food){
    var item = _.find(items, {food: {id: cartProduct.foodId}});
    var itemProduct = item && item.products ? _.find(item.products, {barcode: cartProduct.barcode}) : null;
    if(itemProduct){
      itemProduct.cartData.quantity += cartProduct.cartData.quantity;
    } else if(item){
      if(!item.products){item.products = [];}
      item.products.push(angular.copy(cartProduct));
    } else if(__food){
      items.push({
        food: __food,
        products: [angular.copy(cartProduct)]
      });
      if(_sort === undefined || _sort === true){
        sortItemsByCategory(items);
      }
    } else {
      FoodSrv.get(cartProduct.foodId, {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres', slug: 'autres'}}).then(function(food){
        if(food){
          addCartProduct(items, cartProduct, _sort, food);
        }
      });
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
    item.sources = [];
    _addSourceToItem(item, ingredient, recipe);
    return item;
  }

  function _addSourceToItem(item, ingredient, recipe){
    var source = _createItemSource(ingredient, recipe);
    item.sources.push(source);
    var _ctx = {ingredient: item};
    item.price = PriceCalculator.sum(_.map(item.sources, 'price'), _ctx);
    item.quantity = QuantityCalculator.sum(_.map(_.filter(item.sources, function(elt){return !elt.ingredient.bought;}), 'quantity'), _ctx);
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


.factory('CustomItemUtils', function(CartDataSrv, LogSrv, Utils){
  'use strict';
  var service = {
    compatibility: compatibility,
    toList: toList,
    toText: toText
  };

  function compatibility(cart){
    // this is for compatibility with previous versions where customItems were saved as text !
    if(cart && !Array.isArray(cart.customItems)){
      cart.customItems = toList(cart.customItems);
      CartDataSrv.updateCart(cart);
    }
  }

  function toList(customItems){
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
      return angular.copy(customItems);
    } else {
      LogSrv.trackError('cartCustomItemsError', {
        message: 'Can\'t parse customItems',
        customItems: angular.copy(customItems)
      });
    }
  }

  function toText(customItems){
    var ret = '';
    if(typeof customItems === 'string'){
      ret = angular.copy(customItems.trim());
    } else if(Array.isArray(customItems)){
      ret = _.map(customItems, function(item){
        return item.name+(item.bought ? ' ok' : '');
      }).join('\n');
    } else {
      LogSrv.trackError('cartCustomItemsError', {
        message: 'Can\'t parse customItems',
        customItems: angular.copy(customItems)
      });
    }
    if(ret !== ''){
      ret = ret+'\n';
    }
    return ret;
  }

  return service;
})


.factory('CartDataSrv', function($q, LocalForageUtils, _CartBuilder){
  'use strict';
  var storageKey = 'userCarts';
  var service = {
    getCarts: getCarts,
    updateCart: updateCart,
    createCart: createCart
  };

  function getCarts(){
    return LocalForageUtils.get(storageKey).then(function(userCarts){
      return userCarts && Array.isArray(userCarts.carts) ? userCarts.carts : [];
    });
  }
  function updateCart(cart){
    if(cart && cart.id){
      return LocalForageUtils.get(storageKey).then(function(userCarts){
        if(userCarts && Array.isArray(userCarts.carts)){
          var index = _.findIndex(userCarts.carts, {id: cart.id});
          if(index > -1){
            userCarts.carts.splice(index, 1, cart);
            return LocalForageUtils.set(storageKey, userCarts);
          }
        }
      });
    } else {
      return $q.when();
    }
  }
  function createCart(name){
    var cart = _CartBuilder.createCart(name);
    LocalForageUtils.get(storageKey).then(function(userCarts){
      if(!userCarts){userCarts = {};}
      if(!Array.isArray(userCarts.carts)){userCarts.carts = [];}
      userCarts.carts.unshift(cart);
      return LocalForageUtils.set(storageKey, userCarts);
    });
    return cart;
  }

  return service;
})


.factory('CartUiUtils', function($rootScope, $state, $window, $q, CartSrv, CartUtils, ItemUtils, ProductSrv, StoreSrv, ToastSrv, DialogSrv, IonicUi, LogSrv, Config){
  'use strict';
  var service = {
    initProductModal: initProductModal,
    initCartOptions: initCartOptions
  };


  function initProductModal(){
    var data = {}, fn = {};
    var scope = $rootScope.$new(true);
    scope.data = data;
    scope.fn = fn;

    return IonicUi.initModal(scope, 'scripts/cart/partials/product-modal.html').then(function(modal){
      return {
        open: function(opts){
          var startTime = Date.now(), modalShowedTime = null, productLoadedTime = null;

          fn.close = function(action){
            modal.hide().then(function(){
              if(opts.callback){opts.callback(action, data.product, 1, data.store ? data.store.price : null);}
              data.product = null;
              data.store = null;
            });
          };
          data.title = opts.title;
          data.buyBar = opts.buyBar;

          return modal.show().then(function(){
            modalShowedTime = Date.now();
            if(Config.debug){ToastSrv.show('Modal showed in '+((modalShowedTime-startTime)/1000)+' sec');}
            var promises = [];
            promises.push(opts.product ? $q.when(opts.product) : ProductSrv.get(opts.barcode));
            if(opts.store){ promises.push(ProductSrv.getStoreInfo(opts.store, opts.product ? opts.product.barcode : opts.barcode)); }
            return $q.all(promises);
          }).then(function(results){
            var product = results[0];
            var store = results[1];
            productLoadedTime = Date.now();
            if(Config.debug){ToastSrv.show('Product loaded in '+((productLoadedTime-modalShowedTime)/1000)+' sec');}
            LogSrv.trackCartProductLoaded(product ? product.barcode : opts.barcode, productLoadedTime-modalShowedTime, product ? true : false);
            if(product){
              data.product = product;
              data.store = store;
            } else {
              // TODO : ask user some infos...
              DialogSrv.alert('Product not found :(');
              modal.hide();
            }
          });
        }
      };
    });
  }


  function initCartOptions(cart){
    var data = {}, fn = {};
    var scope = $rootScope.$new(true);
    scope.data = data;
    scope.fn = fn;

    return IonicUi.initPopover(scope, 'scripts/cart/partials/cart-popover.html').then(function(popover){
      fn.archiveCart = function(){
        DialogSrv.confirm('Archiver cette liste ?').then(function(result){
          if(result){
            CartUtils.archive(cart);
            popover.remove();
            $state.go('app.home');
          }
        });
      };

      return {
        open: function(event){
          return popover.show(event);
        }
      };
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

  function createProduct(cart, product, quantity, price){
    var p = angular.copy(product);
    p.cartData = {
      cart: cart.id,
      created: Date.now(),
      quantity: quantity,
      price: price
    };
    return p;
  }

  return service;
});
