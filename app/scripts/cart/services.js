angular.module('app')


// modals for cart
.factory('CartUi', function($rootScope, $state, $q, CartUtils, ProductSrv, IonicUi, DialogSrv, ToastSrv, LogSrv, Config){
  'use strict';
  var service = {
    initProductModal: initProductModal,
    initCartOptions: initCartOptions
  };


  function initProductModal(cart){
    var data = {}, fn = {};
    var scope = $rootScope.$new(true);
    scope.data = data;
    scope.fn = fn;

    return IonicUi.initModal(scope, 'scripts/cart/partials/product-modal.html').then(function(modal){
      fn.addPromoToCart = function(promo){
        DialogSrv.confirm('Ajouter ce coupon au panier ?').then(function(result){
          if(result){
            CartUtils.addPromo(cart, promo).then(function(){
              ToastSrv.show('✔ Coupon ajoutée au panier \\o/');
              data.showPromo = false;
            });
          }
        });
      };
      return {
        open: function(opts){
          var startTime = Date.now(), modalShowedTime = null, productLoadedTime = null;

          fn.close = function(action){
            modal.hide().then(function(){
              if(opts.callback){opts.callback(action, data.product, data.store ? data.store.price : null, 1);}
              data.product = null;
              data.store = null;
              data.showPromo = false;
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
              if(store && store.promo){
                CartUtils.showPromo(cart, store.promo).then(function(showPromo){
                  data.showPromo = showPromo;
                });
              } else {
                data.showPromo = false;
              }
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


// access carts
.factory('CartSrv', function(CartUtils, CartData, CartBuilder, LocalForageUtils){
  'use strict';
  var storageKeyCookedRecipes = 'userStandaloneCookedRecipes';
  var service = {
    getCart: getCart,
    getCurrentCart: getCurrentCart,
    getCartRecipe: getCartRecipe,
    getRecipesToCook: getRecipesToCook,
    getCookedRecipes: getCookedRecipes,
    addStandaloneCookedRecipe: addStandaloneCookedRecipe,
    updateCartRecipe: updateCartRecipe
  };

  function getCart(cartId){
    return CartData.getCarts().then(function(carts){
      return _.find(carts, {id: cartId});
    });
  }

  function getCurrentCart(){
    return CartData.getCarts().then(function(carts){
      var cart = _.find(carts, {archived: false});
      if(cart){
        return cart;
      } else {
        return CartData.createCart();
      }
    });
  }

  function getCartRecipe(cartId, recipeId){
    return CartData.getCarts().then(function(carts){
      var cart = _.find(carts, {id: cartId});
      var recipeData = cart ? _.find(cart.recipesData, {id: recipeId}) : null;
      if(recipeData){
        return CartUtils.recipeFrom(recipeData);
      }
    });
  }

  /*
   * if recipe.cartData.cooked is :
   *  - false                         : recipe should be cooked (tocook screen)
   *  - 'none'                        : recipe is abandonned
   *  - {time: 123, duration: 123.2}  : recipe is cooked
   */
  function getRecipesToCook(){
    return CartData.getCarts().then(function(carts){
      var recipesData = _recipesFromCarts(carts);
      var toCookRecipesData = _.filter(recipesData, {cooked: false});
      return CartUtils.recipesFrom(toCookRecipesData);
    });
  }

  function getCookedRecipes(){
    return CartData.getCarts().then(function(carts){
      var recipesData = _recipesFromCarts(carts);
      var cookedRecipesData = _.filter(recipesData, function(recipeData){
        return recipeData && recipeData.cooked && recipeData.cooked !== 'none' && recipeData.cooked !== false;
      });
      return _getStandaloneCookedRecipes().then(function(standaloneCookedRecipes){
        return CartUtils.recipesFrom(cookedRecipesData.concat(standaloneCookedRecipes));
      });
    });
  }

  function addStandaloneCookedRecipe(recipe, servings, cookDuration){
    var recipeData = CartBuilder.createStandaloneRecipeData(recipe, servings, cookDuration);
    return _addStandaloneCookedRecipe(recipeData);
  }

  function updateCartRecipe(cartId, recipeData){
    return CartData.getCarts().then(function(carts){
      var cart = _.find(carts, {id: cartId});
      var cartRecipeData = getRecipeFromCart(cart, recipeData.id);
      if(cartRecipeData){
        angular.copy(recipeData, cartRecipeData);
        return CartData.updateCart(cart);
      }
    });
  }

  function getRecipeFromCart(cart, recipeId){ return cart ? _.find(cart.recipesData, {id: recipeId}) : null; }

  function _recipesFromCarts(carts){
    return _.reduce(carts, function(result, cart){
      return result.concat(cart.recipesData);
    }, []);
  }

  function _getStandaloneCookedRecipes(){
    return LocalForageUtils.get(storageKeyCookedRecipes).then(function(userStandaloneCookedRecipes){
      return userStandaloneCookedRecipes ? userStandaloneCookedRecipes.recipes : [];
    });
  }
  function _addStandaloneCookedRecipe(recipeData){
    return LocalForageUtils.get(storageKeyCookedRecipes).then(function(userStandaloneCookedRecipes){
      if(userStandaloneCookedRecipes && Array.isArray(userStandaloneCookedRecipes.recipes)){
        userStandaloneCookedRecipes.recipes.push(recipeData);
        return LocalForageUtils.set(storageKeyCookedRecipes, userStandaloneCookedRecipes);
      }
    });
  }

  return service;
})


// modify cart
.factory('CartUtils', function($q, RecipeSrv, FoodSrv, ProductSrv, CartData, CartBuilder, QuantityCalculator, PriceCalculator, Utils, LogSrv){
  'use strict';
  var service = {
    getEstimatedPrice: function(cart){},
    getShopPrice: function(cart){},
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    adjustRecipe: adjustRecipe,
    removeRecipe: removeRecipe,
    updateCustomItems: updateCustomItems,
    customItemsToText: customItemsToText,
    customItemsToList: customItemsToList,
    buyItem: buyItem,
    unbuyItem: unbuyItem,
    startSelfscan: startSelfscan,
    cancelSelfscan: cancelSelfscan,
    buyProduct: buyProduct,
    unbuyProduct: unbuyProduct,
    showPromo: showPromo,
    addPromo: addPromo,
    removePromo: removePromo,
    getRecipes: getRecipes,
    recipesFrom: recipesFrom,
    recipeFrom: recipeFrom,
    archive: archive
  };

  function hasRecipe(cart, recipe){
    return !!_.find(cart.recipesData, {id: recipe.id});
  }

  function addRecipe(cart, recipe, servings){
    return Utils.async(function(){
      if(!hasRecipe(cart, recipe)){
        for(var i in recipe.ingredients){
          var ingredient = recipe.ingredients[i];
          if(ingredient && ingredient.food){
            var item = _.find(cart.items, {id: ingredient.food.id});
            if(!item){
              item = CartBuilder.createItem(ingredient.food);
              cart.items.push(item);
            }
            var source = CartBuilder.createItemSourceFromRecipe(ingredient, recipe, servings);
            item.bought = 0;
            item.sources.push(source);
            item.quantity = QuantityCalculator.sum(_.map(item.sources, 'quantity'));
            item.estimatedPrice = PriceCalculator.sum(_.map(item.sources, 'price'));
          }
        }
        cart.recipesData.push(CartBuilder.createRecipeData(cart.id, recipe, servings));
        _sortItemsByCategory(cart.items);
        cart.estimatedPrice = PriceCalculator.sum(_.map(cart.items, 'estimatedPrice'));
        return CartData.updateCart(cart);
      }
    });
  }

  function adjustRecipe(cart, recipe, servings, _force){
    return Utils.async(function(){
      var recipeData = _.find(cart.recipesData, {id: recipe.id});
      if(recipeData && (recipeData.servings.value !== servings || _force)){
        for(var i in cart.items){
          var item = cart.items[i];
          var sourceIndex = _.findIndex(item.sources, {type: 'recipe', id: recipe.id});
          if(sourceIndex > -1){
            var source = item.sources[sourceIndex];
            if(source.servings < servings && item.bought !== 0){
              recipeData.nbIngredientsBought--;
              item.bought = 0;
            }
            var oldServings = angular.copy(source.servings);
            source.servings.value = servings;
            source.quantity = QuantityCalculator.adjustForServings(source.quantity, oldServings, source.servings);
            source.price = PriceCalculator.adjustForServings(source.price, oldServings, source.servings);
            item.quantity = QuantityCalculator.sum(_.map(item.sources, 'quantity'));
            item.estimatedPrice = PriceCalculator.sum(_.map(item.sources, 'price'));
          }
        }
        recipeData.servings.value = servings;
        recipeData.boughtPc = 100 * recipeData.nbIngredientsBought / recipeData.nbIngredients;
        cart.estimatedPrice = PriceCalculator.sum(_.map(cart.items, 'estimatedPrice'));
        return CartData.updateCart(cart);
      }
    });
  }

  function removeRecipe(cart, recipe){
    return Utils.async(function(){
      var removedRecipe = _.remove(cart.recipesData, {id: recipe.id});
      if(removedRecipe.length > 0){
        for(var i=cart.items.length-1; i>=0; i--){ // from last to first to remove items on the fly !
          var item = cart.items[i];
          var removedSource = _.remove(item.sources, {type: 'recipe', id: recipe.id});
          if(removedSource.length > 0){
            if(item.sources.length === 0 && item.products.length === 0 && item.promos.length === 0){
              cart.items.splice(i, 1);
            } else {
              item.quantity = QuantityCalculator.sum(_.map(item.sources, 'quantity'));
              item.estimatedPrice = PriceCalculator.sum(_.map(item.sources, 'price'));
            }
          }
        }
        cart.estimatedPrice = PriceCalculator.sum(_.map(cart.items, 'estimatedPrice'));
        return CartData.updateCart(cart);
      }
    });
  }

  function updateCustomItems(cart, text){
    cart.customItems = customItemsToList(text);
    return CartData.updateCart(cart);
  }

  function customItemsToText(customItems){
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

  function customItemsToList(customItems){
    var ret = [];
    if(typeof customItems === 'string'){
      ret = _.map(customItems.split('\n'), function(item){
        var name = item.trim();
        if(name.length > 0){
          if(Utils.endsWith(name, ' ok')){
            return { bought: true, name: name.replace(/ ok/g, '') };
          } else {
            return { bought: false, name: name };
          }
        }
      });
    } else if(Array.isArray(customItems)){
      ret = angular.copy(customItems);
    } else {
      LogSrv.trackError('cartCustomItemsError', {
        message: 'Can\'t parse customItems',
        customItems: angular.copy(customItems)
      });
    }
    return _.filter(ret, function(item){
      return item && item.name && item.name.length > 0;
    });
  }

  function buyItem(cart, item){
    return Utils.async(function(){
      item.bought = Date.now();
      for(var i in item.sources){
        var source = item.sources[i];
        if(source.type === 'recipe'){
          var recipeData = _.find(cart.recipesData, {id: source.id});
          recipeData.nbIngredientsBought++;
          recipeData.boughtPc = 100 * recipeData.nbIngredientsBought / recipeData.nbIngredients;
        }
      }
      return CartData.updateCart(cart);
    });
  }

  function unbuyItem(cart, item){
    return Utils.async(function(){
      item.bought = 0;
      for(var i in item.sources){
        var source = item.sources[i];
        if(source.type === 'recipe'){
          var recipeData = _.find(cart.recipesData, {id: source.id});
          recipeData.nbIngredientsBought--;
          recipeData.boughtPc = 100 * recipeData.nbIngredientsBought / recipeData.nbIngredients;
        }
      }
      return CartData.updateCart(cart);
    });
  }

  function startSelfscan(cart, store){
    return Utils.async(function(){
      cart.selfscan.started = Date.now();
      cart.selfscan.store = store;
      cart.selfscan.price = {value: 0, currency: '€'};
      return CartData.updateCart(cart);
    });
  }

  function cancelSelfscan(cart){
    return Utils.async(function(){
      cart.selfscan = {
        started: 0,
        done: 0,
        store: null,
        price: null,
        showedPromos: []
      };
      for(var i in cart.items){
        var item = cart.items[i];
        item.selfscanPrice = null;
        item.promoBenefit = null;
        item.products = [];
        item.promos = [];
      }
      return CartData.updateCart(cart);
    });
  }

  function buyProduct(cart, product, price, number){
    return Utils.async(function(){
      var item = _.find(cart.items, {id: product.foodId});
      var itemProduct = item ? _.find(item.products, {barcode: product.barcode}) : null;
      var promos = [];
      if(item){
        for(var i=item.promos.length-1; i>=0; i--){
          var promo = item.promos[i];
          if(promo.product === product.barcode){
            var cartPromo = _.find(cart.selfscan.showedPromos, {id: promo.id});
            cartPromo.used = Date.now();
            var itemPromo = item.promos.splice(i, 1)[0];
            itemPromo.used = cartPromo.used;
            promos.push(itemPromo);
          }
        }
      }

      var updatePromise = $q.when();
      if(itemProduct){
        itemProduct.number += number;
        itemProduct.promos = itemProduct.promos.concat(promos);
        _updateProductPrice(itemProduct);
        updatePromise = buyItem(cart, item);
      } else if(item){
        item.products.push(CartBuilder.createProduct(cart.id, product, price, number, promos));
        updatePromise = buyItem(cart, item);
      } else {
        updatePromise = FoodSrv.get(product.foodId, {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres', slug: 'autres'}}).then(function(food){
          if(food){
            item = CartBuilder.createItem(food);
            item.bought = Date.now();
            item.products.push(CartBuilder.createProduct(cart.id, product, price, number, promos));
            cart.items.push(item);
            _sortItemsByCategory(cart.items);
          }
        });
      }
      return updatePromise.then(function(){
        if(item){
          _updateItemPrice(item);
          _updateCartPrice(cart);
        }
        return CartData.updateCart(cart);
      });
    });
  }

  function unbuyProduct(cart, product){
    return Utils.async(function(){
      var item = _.find(cart.items, {id: product.foodId});
      if(item){
        var itemProduct = _.find(item.products, {barcode: product.barcode});
        if(itemProduct && itemProduct.promos && itemProduct.promos.length > 0){
          item.promos = item.promos.concat(itemProduct.promos);
        }
        var removed = _.remove(item.products, {barcode: product.barcode});
        if(removed.length > 0){
          if(item.sources.length === 0 && item.products.length === 0 && item.promos.length === 0){
            _.remove(cart.items, {id: product.foodId});
          } else {
            _updateItemPrice(item);
          }
          _updateCartPrice(cart);
          return CartData.updateCart(cart);
        }
      }
    });
  }

  function showPromo(cart, promo){
    return Utils.async(function(){
      if(promo){
        var alreadyShowed = _.findIndex(cart.selfscan.showedPromos, {id: promo.id}) > -1;
        if(alreadyShowed){
          return false;
        } else {
          var cartPromo = CartBuilder.createPromo(promo);
          cartPromo.showed = Date.now();
          cart.selfscan.showedPromos.push(cartPromo);
          return CartData.updateCart(cart).then(function(){
            return true;
          });
        }
      } else {
        return false;
      }
    });
  }

  function addPromo(cart, promo){
    return Utils.async(function(){
      var item = _.find(cart.items, {id: promo.foodId});
      var itemProduct = item ? _.find(item.products, {barcode: promo.product}) : null;
      var cartPromo = _.find(cart.selfscan.showedPromos, {id: promo.id});
      cartPromo.added = Date.now();

      var updatePromise = $q.when();
      if(itemProduct){
        cartPromo.used = cartPromo.added;
        itemProduct.promos.push(angular.copy(cartPromo));
        _updateProductPrice(itemProduct);
        _updateItemPrice(item);
        _updateCartPrice(cart);

      } else if(item){
        item.promos.push(angular.copy(cartPromo));
      } else {
        updatePromise = FoodSrv.get(promo.foodId, {id: 'unknown', name: 'Autres', category: {id: 15, order: 15, name: 'Autres', slug: 'autres'}}).then(function(food){
          if(food){
            item = CartBuilder.createItem(food);
            item.promos.push(angular.copy(cartPromo));
            cart.items.push(item);
            _sortItemsByCategory(cart.items);
          }
        });
      }
      return updatePromise.then(function(){
        return CartData.updateCart(cart);
      });
    });
  }

  function removePromo(cart, promo){
    return Utils.async(function(){
      _.remove(cart.selfscan.showedPromos, {id: promo.id});
      var item = _.find(cart.items, {id: promo.foodId});
      if(item){
        _.remove(item.promos, {id: promo.id});
        var itemProduct = _.find(item.products, {barcode: promo.product});
        if(itemProduct){
          var removed = _.remove(itemProduct.promos, {id: promo.id});
          if(removed.length > 0){
            _updateProductPrice(itemProduct);
          }
        }
      }
      return CartData.updateCart(cart);
    });
  }

  function getRecipes(cart){
    return recipesFrom(cart.recipesData);
  }

  function recipesFrom(recipesData){
    return Utils.async(function(){
      var recipePromises = _.map(recipesData, function(recipeData){
        return RecipeSrv.get(recipeData.id);
      });
      return $q.all(recipePromises).then(function(results){
        for(var i in results){
          results[i].cartData = _.find(recipesData, {id: results[i].id});
        }
        return results;
      });
    });
  }

  function recipeFrom(recipeData){
    return RecipeSrv.get(recipeData.id).then(function(recipe){
      if(recipe){
        recipe.cartData = recipeData;
        return recipe;
      }
    });
  }

  function archive(cart){
    cart.archived = true;
    return CartData.updateCart(cart);
  }

  function _sortItemsByCategory(items){
    if(Array.isArray(items)){
      items.sort(function(a, b){
        var aCategory = a && a.category && a.category.order ? a.category.order : 50;
        var bCategory = b && b.category && b.category.order ? b.category.order : 50;
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

  function _updateProductPrice(itemProduct){
    itemProduct.totalPrice = PriceCalculator.productPrice(itemProduct);
    itemProduct.totalPromo = angular.copy(itemProduct.totalPrice);
    itemProduct.totalPromo.value = (itemProduct.number * itemProduct.price.value) - itemProduct.totalPromo.value;
  }
  function _updateItemPrice(item){
    item.selfscanPrice = PriceCalculator.sum(_.map(item.products, 'totalPrice'));
    item.promoBenefit = PriceCalculator.sum(_.map(item.products, 'totalPromo'));
  }
  function _updateCartPrice(cart){
    cart.selfscan.price = PriceCalculator.sum(_.filter(_.map(cart.items, 'selfscanPrice'), function(e){return e && e.value && e.currency;})) || {value: 0, currency: '€'};
    cart.selfscan.promoBenefit = PriceCalculator.sum(_.filter(_.map(cart.items, 'promoBenefit'), function(e){return e && e.value && e.currency;})) || {value: 0, currency: '€'};
  }

  return service;
})


// create cart elts
.factory('CartBuilder', function(QuantityCalculator, PriceCalculator, Utils){
  'use strict';
  var service = {
    createCart: createCart,
    createItem: createItem,
    createItemSourceFromRecipe: createItemSourceFromRecipe,
    createRecipeData: createRecipeData,
    createStandaloneRecipeData: createStandaloneRecipeData,
    createProduct: createProduct,
    createPromo: createPromo
  };

  function createCart(name){
    return {
      id: Utils.createUuid(),
      name: name ? name : 'Liste du '+moment().format('LL'),
      customItems: [],
      items: [],
      recipesData: [],
      created: Date.now(),
      archived: false,
      estimatedPrice: null,
      selfscan: {
        started: 0, // timestamp or 0
        done: 0, // timestamp or 0
        store: null,
        price: null,
        promoBenefit: null,
        showedPromos: []
      }
    };
  }

  function createItem(food){
    var item = angular.copy(food);
    item.bought = 0; // timestamp or 0
    item.quantity = null;
    item.estimatedPrice = null;
    item.sources = [];
    item.selfscanPrice = null;
    item.promoBenefit = null;
    item.promos = [];
    item.products = [];
    return item;
  }

  function createItemSourceFromRecipe(ingredient, recipe, servings){
    var source = {};
    source.type = 'recipe';
    source.id = recipe.id;
    source.name = recipe.name;
    source.servings = angular.copy(recipe.servings);
    source.servings.value = servings;
    source.quantity = QuantityCalculator.adjustForServings(ingredient.quantity, recipe.servings, source.servings);
    source.price = PriceCalculator.adjustForServings(ingredient.price, recipe.servings, source.servings);
    return source;
  }

  function createRecipeData(cartId, recipe, servings){
    var recipeData = {};
    recipeData.cart = cartId;
    recipeData.id = recipe.id;
    recipeData.added = Date.now();
    recipeData.servings = angular.copy(recipe.servings);
    recipeData.servings.value = servings;
    recipeData.cooked = false;
    recipeData.nbIngredients = recipe.ingredients ? recipe.ingredients.length : 0;
    recipeData.nbIngredientsBought = 0;
    recipeData.boughtPc = 0;
    return recipeData;
  }

  function createStandaloneRecipeData(recipe, servings, cookDuration){
    var recipeData = {};
    recipeData.cart = null;
    recipeData.id = recipe.id;
    recipeData.added = Date.now();
    recipeData.servings = angular.copy(recipe.servings);
    recipeData.servings.value = servings;
    recipeData.cooked = {
      time: Date.now(),
      duration: cookDuration
    };
    recipeData.nbIngredients = recipe.ingredients ? recipe.ingredients.length : 0;
    recipeData.nbIngredientsBought = 0;
    recipeData.boughtPc = 0;
    return recipeData;
  }

  function createProduct(cartId, product, price, number, promos){
    var productData = {};
    productData.cart = cartId;
    productData.foodId = product.foodId;
    productData.barcode = product.barcode;
    productData.name = product.name;
    productData.quantity = angular.copy(product.quantity);
    productData.bought = Date.now();
    productData.price = angular.copy(price);
    productData.number = number;
    productData.promos = promos;
    productData.totalPrice = PriceCalculator.productPrice(productData);
    productData.totalPromo = angular.copy(productData.totalPrice);
    productData.totalPromo.value = (number * productData.price.value) - productData.totalPromo.value;
    return productData;
  }

  function createPromo(promo){
    var cartPromo = angular.copy(promo);
    cartPromo.showed = 0;
    cartPromo.added = 0;
    cartPromo.used = 0;
    return cartPromo;
  }

  return service;
})


// get/set cart in storage & backend if needed
.factory('CartData', function($q, CartBuilder, LocalForageUtils){
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
    return LocalForageUtils.get(storageKey).then(function(userCarts){
      if(!userCarts){userCarts = {};}
      if(!Array.isArray(userCarts.carts)){userCarts.carts = [];}
      var cart = CartBuilder.createCart(name);
      userCarts.carts.unshift(cart);
      return LocalForageUtils.set(storageKey, userCarts).then(function(){
        return cart;
      });
    });
  }

  return service;
});
