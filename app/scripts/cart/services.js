angular.module('app')


// modals for cart
.factory('CartUi', function($rootScope, $state, $q, CartUtils, ProductSrv, RecipeSrv, UserSrv, StorageSrv, IonicUi, PopupSrv, DialogSrv, ToastSrv, LogSrv, Config){
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
      fn.addRecommandationToCart = function(recommandation){
        if(recommandation.category === 'recipe'){
          RecipeSrv.get(recommandation.reference); // to get data early
          PopupSrv.changeServings($rootScope.ctx.settings.defaultServings, recommandation.name).then(function(servings){
            if(servings){
              servings = parseInt(servings);
              $rootScope.ctx.settings.defaultServings = servings;
              UserSrv.setSetting('defaultServings', servings);
              RecipeSrv.get(recommandation.reference).then(function(recipe){
                if(recipe){
                  LogSrv.trackAddRecipeToCart(recipe.id, servings, null); // TODO : track better (added from recommandations !!!)
                  CartUtils.addRecipe(cart, recipe, servings);
                  ToastSrv.show('✔ recette ajoutée à la liste de courses');
                  StorageSrv.addRecipeToHistory(recipe);
                  data.showRecommandation = false;
                }
              });
            }
          });
        } else {
          DialogSrv.alert('Unknown recommandation category <'+recommandation.category+'> !');
        }
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
              data.showRecommandation = false;
            });
          };
          data.title = opts.title;
          data.buyBar = opts.buyBar;

          return modal.show().then(function(){
            modalShowedTime = Date.now();
            if(Config.debug){ToastSrv.show('Modal showed in '+((modalShowedTime-startTime)/1000)+' sec');}
            var promises = [];
            promises.push(ProductSrv.get(opts.barcode));
            if(opts.store){ promises.push(ProductSrv.getStoreInfo(opts.store, opts.barcode)); }
            return $q.all(promises);
          }).then(function(results){
            var product = results[0];
            if(opts.cartProduct){ product.cartProduct = opts.cartProduct; }
            var store = results.length > 1 ? results[1] : null;
            productLoadedTime = Date.now();
            if(Config.debug){ToastSrv.show('Product loaded in '+((productLoadedTime-modalShowedTime)/1000)+' sec');}
            LogSrv.trackCartProductLoaded(product ? product.barcode : opts.barcode, productLoadedTime-modalShowedTime, product ? true : false);
            if(product){
              data.product = product;
              data.store = store;
              if(store){
                if(store.promo){
                  CartUtils.showPromo(cart, store.promo).then(function(showPromo){
                    data.showPromo = showPromo;
                  });
                }
                if(store.recommandation){
                  CartUtils.showRecommandation(cart, store.recommandation).then(function(showRecommandation){
                    data.showRecommandation = showRecommandation;
                  });
                }
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
      return cart ? _.find(cart.recipes, {id: recipeId}) : null;
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
      var recipes = _recipesFromCarts(carts);
      return _.filter(recipes, {cartData: {cooked: false}});
    });
  }

  function getCookedRecipes(){
    return CartData.getCarts().then(function(carts){
      var recipes = _recipesFromCarts(carts);
      var cookedRecipes = _.filter(recipes, function(recipe){
        return recipe && recipe.cartData && recipe.cartData.cooked && recipe.cartData.cooked !== 'none' && recipe.cartData.cooked !== false;
      });
      return _getStandaloneCookedRecipes().then(function(standaloneCookedRecipes){
        return cookedRecipes.concat(standaloneCookedRecipes);
      });
    });
  }

  function addStandaloneCookedRecipe(recipe, servings, cookDuration){
    var cartRecipe = CartBuilder.createStandaloneRecipe(recipe, servings, cookDuration);
    return _addStandaloneCookedRecipe(cartRecipe);
  }

  function updateCartRecipe(cartId, recipe){
    return CartData.getCarts().then(function(carts){
      var cart = _.find(carts, {id: cartId});
      var cartRecipe = getRecipeFromCart(cart, recipe.id);
      if(cartRecipe){
        angular.copy(recipe, cartRecipe);
        return CartData.updateCart(cart);
      }
    });
  }

  function getRecipeFromCart(cart, recipeId){ return cart ? _.find(cart.recipes, {id: recipeId}) : null; }

  function _recipesFromCarts(carts){
    return _.reduce(carts, function(result, cart){
      return result.concat(cart.recipes);
    }, []);
  }

  function _getStandaloneCookedRecipes(){
    return LocalForageUtils.get(storageKeyCookedRecipes).then(function(userStandaloneCookedRecipes){
      return userStandaloneCookedRecipes ? userStandaloneCookedRecipes.recipes : [];
    });
  }
  function _addStandaloneCookedRecipe(recipe){
    return LocalForageUtils.get(storageKeyCookedRecipes).then(function(userStandaloneCookedRecipes){
      if(userStandaloneCookedRecipes && Array.isArray(userStandaloneCookedRecipes.recipes)){
        userStandaloneCookedRecipes.recipes.push(recipe);
        return LocalForageUtils.set(storageKeyCookedRecipes, userStandaloneCookedRecipes);
      }
    });
  }

  return service;
})


// modify cart
.factory('CartUtils', function($q, FoodSrv, CartData, CartBuilder, QuantityCalculator, PriceCalculator, Utils, LogSrv){
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
    terminateSelfscan: terminateSelfscan,
    buyProduct: buyProduct,
    unbuyProduct: unbuyProduct,
    showPromo: showPromo,
    showRecommandation: showRecommandation,
    addPromo: addPromo,
    removePromo: removePromo,
    archive: archive
  };

  function hasRecipe(cart, recipe){
    return !!_.find(cart.recipes, {id: recipe.id});
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
            _updateItemQuantityAndEstimatedPrice(item);
          }
        }
        cart.recipes.push(CartBuilder.createCartRecipe(cart.id, recipe, servings));
        _sortItemsByCategory(cart.items);
        _updateCartEstimatedPrice(cart);
        _updateCartBoughtPc(cart);
        return CartData.updateCart(cart);
      }
    });
  }

  function adjustRecipe(cart, recipe, servings, _force){
    return Utils.async(function(){
      var recipe = _.find(cart.recipes, {id: recipe.id});
      if(recipe && (recipe.cartData.servings.value !== servings || _force)){
        for(var i in cart.items){
          var item = cart.items[i];
          var sourceIndex = _.findIndex(item.sources, {type: 'recipe', id: recipe.id});
          if(sourceIndex > -1){
            var source = item.sources[sourceIndex];
            if(source.servings < servings && item.bought !== 0){
              recipe.cartData.nbIngredientsBought--;
              item.bought = 0;
            }
            var oldServings = angular.copy(source.servings);
            source.servings.value = servings;
            source.quantity = QuantityCalculator.adjustForServings(source.quantity, oldServings, source.servings);
            source.price = PriceCalculator.adjustForServings(source.price, oldServings, source.servings);
            _updateItemQuantityAndEstimatedPrice(item);
          }
        }
        recipe.cartData.servings.value = servings;
        recipe.cartData.boughtPc = 100 * recipe.cartData.nbIngredientsBought / recipe.cartData.nbIngredients;
        _updateCartEstimatedPrice(cart);
        _updateCartBoughtPc(cart);
        return CartData.updateCart(cart);
      }
    });
  }

  function removeRecipe(cart, recipe){
    return Utils.async(function(){
      var removedRecipe = _.remove(cart.recipes, {id: recipe.id});
      if(removedRecipe.length > 0){
        for(var i=cart.items.length-1; i>=0; i--){ // from last to first to remove items on the fly !
          var item = cart.items[i];
          var removedSource = _.remove(item.sources, {type: 'recipe', id: recipe.id});
          if(removedSource.length > 0){
            if(item.sources.length === 0 && item.products.length === 0 && item.promos.length === 0){
              cart.items.splice(i, 1);
            } else {
              _updateItemQuantityAndEstimatedPrice(item);
            }
          }
        }
        _updateCartEstimatedPrice(cart);
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
      _updateCartBoughtPc(cart);
      for(var i in item.sources){
        var source = item.sources[i];
        if(source.type === 'recipe'){
          var recipe = _.find(cart.recipes, {id: source.id});
          recipe.cartData.nbIngredientsBought++;
          recipe.cartData.boughtPc = 100 * recipe.cartData.nbIngredientsBought / recipe.cartData.nbIngredients;
        }
      }
      return CartData.updateCart(cart);
    });
  }

  function unbuyItem(cart, item){
    return Utils.async(function(){
      item.bought = 0;
      _updateCartBoughtPc(cart);
      for(var i in item.sources){
        var source = item.sources[i];
        if(source.type === 'recipe'){
          var recipe = _.find(cart.recipes, {id: source.id});
          recipe.cartData.nbIngredientsBought--;
          recipe.cartData.boughtPc = 100 * recipe.cartData.nbIngredientsBought / recipe.cartData.nbIngredients;
        }
      }
      return CartData.updateCart(cart);
    });
  }

  function startSelfscan(cart, store){
    return Utils.async(function(){
      cart.selfscan.started = Date.now();
      cart.selfscan.done = 0;
      cart.selfscan.store = store;
      cart.selfscan.price = {value: 0, currency: '€'};
      cart.selfscan.showedPromos = [];
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

  function terminateSelfscan(cart){
    return Utils.async(function(){
      cart.selfscan.done = Date.now();
      cart.archived = true;
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
          _updateCartBoughtPc(cart);
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

  function showRecommandation(cart, recommandation){
    return Utils.async(function(){
      if(recommandation && recommandation.category === 'recipe'){
        var alreadyAdded = _.findIndex(cart.recipes, {id: recommandation.reference}) > -1;
        return !alreadyAdded;
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
  function _updateCartBoughtPc(cart){
    var boughtItems = _.filter(cart.items, function(i){ return !!i.bought; });
    cart.boughtPc = 100 * boughtItems.length / cart.items.length;
  }
  function _updateItemQuantityAndEstimatedPrice(item){
    item.quantity = QuantityCalculator.sum(_.map(item.sources, 'quantity'));
    item.estimatedPrice = PriceCalculator.sum(_.map(item.sources, 'price')) || {value: 0, currency: '€'};
  }
  function _updateCartEstimatedPrice(cart){
    cart.estimatedPrice = PriceCalculator.sum(_.map(cart.items, 'estimatedPrice'));
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
    createCartRecipe: createCartRecipe,
    createStandaloneRecipe: createStandaloneRecipe,
    createProduct: createProduct,
    createPromo: createPromo
  };

  function createCart(name){
    return {
      id: Utils.createUuid(),
      name: name ? name : 'Liste du '+moment().format('LL'),
      boughtPc: 0,
      customItems: [],
      items: [],
      recipes: [],
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
    item.estimatedPrice = {value: 0, currency: '€'};
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

  function createCartRecipe(cartId, recipe, servings){
    var cartRecipe = angular.copy(recipe);
    cartRecipe.cartData = {};
    cartRecipe.cartData.cart = cartId;
    cartRecipe.cartData.id = recipe.id;
    cartRecipe.cartData.added = Date.now();
    cartRecipe.cartData.servings = angular.copy(recipe.servings);
    cartRecipe.cartData.servings.value = servings;
    cartRecipe.cartData.cooked = false;
    cartRecipe.cartData.nbIngredients = recipe.ingredients ? recipe.ingredients.length : 0;
    cartRecipe.cartData.nbIngredientsBought = 0;
    cartRecipe.cartData.boughtPc = 0;
    return cartRecipe;
  }

  function createStandaloneRecipe(recipe, servings, cookDuration){
    var cartRecipe = angular.copy(recipe);
    cartRecipe.cartData = {};
    cartRecipe.cartData.cart = null;
    cartRecipe.cartData.id = recipe.id;
    cartRecipe.cartData.added = Date.now();
    cartRecipe.cartData.servings = angular.copy(recipe.servings);
    cartRecipe.cartData.servings.value = servings;
    cartRecipe.cartData.cooked = {
      time: Date.now(),
      duration: cookDuration
    };
    cartRecipe.cartData.nbIngredients = recipe.ingredients ? recipe.ingredients.length : 0;
    cartRecipe.cartData.nbIngredientsBought = 0;
    cartRecipe.cartData.boughtPc = 0;
    return cartRecipe;
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
