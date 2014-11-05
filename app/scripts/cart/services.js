angular.module('app')

.factory('CartSrv', function(StorageSrv, _CartBuilder, _CartUtils){
  'use strict';
  var service = {
    getCarts: StorageSrv.getCarts,
    getCart: getCart,
    getCurrentCart: getCurrentCart,
    getRecipeFromCart: getRecipeFromCart,
    getCartRecipe: function(cartId, recipeId){ return getRecipeFromCart(getCart(cartId), recipeId); },
    createCart: createCart,
    updateCart: function(cart){ StorageSrv.saveCart(cart); },
    updateCartRecipe: updateCartRecipe,
    getRecipesToCook: getRecipesToCook,
    getCookedRecipes: getCookedRecipes,
    addStandaloneCookedRecipe: StorageSrv.addStandaloneCookedRecipe
  };

  function _hasOpenedCarts(){ return _.findIndex(StorageSrv.getCarts(), {archived: false}) > -1; }
  function _getOpenedCarts(){ return _.filter(StorageSrv.getCarts(), {archived: false}); }
  function getCart(id){ return _.find(StorageSrv.getCarts(), {id: id}); }
  function getCurrentCart(){
    var cart = _hasOpenedCarts() ? _getOpenedCarts()[0] : createCart();
    if(!cart._formated){ cart._formated = {}; }
    cart._formated.isEmpty = isEmpty(cart);
    return cart;
  }
  function getRecipeFromCart(cart, recipeId){ return cart ? _.find(cart.recipes, {id: recipeId}) : null; }

  function isEmpty(cart){
    return !(cart && (
      (cart.recipes && cart.recipes.length > 0) ||
      (cart.customItems && cart.customItems.length > 0) ||
      (cart.products && cart.products.length > 0)));
  }

  function createCart(name){
    var cart = _CartBuilder.createCart(name);
    StorageSrv.addCart(cart);
    return cart;
  }

  function updateCartRecipe(recipe){
    if(recipe && recipe.cartData && recipe.cartData.cart){
      var cart = getCart(recipe.cartData.cart);
      var cartRecipe = getRecipeFromCart(cart, recipe.id);
      if(cartRecipe){
        angular.copy(recipe, cartRecipe);
        StorageSrv.saveCart(cart);
      }
    }
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

  function _recipesFromCarts(carts){
    return _.reduce(carts, function(result, cart){
      return result.concat(cart.recipes);
    }, []);
  }

  return service;
})


.factory('CartUtils', function(PriceCalculator, StorageSrv, _CartUtils, _CartBuilder){
  'use strict';
  var service = {
    getEstimatedPrice: getEstimatedPrice,
    getShopPrice: getShopPrice,
    hasRecipe: hasRecipe,
    addRecipe: addRecipe,
    removeRecipe: removeRecipe,
    addItem: function(cart, item){buyItem(cart, item, true);},
    removeItem: function(cart, item){buyItem(cart, item, false);},
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
      // TODO : cartData is undefined when the ingredient previously failed to load !?!?!?!?
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


.factory('CustomItemUtils', function(StorageSrv, LogSrv, Utils){
  'use strict';
  var service = {
    compatibility: compatibility,
    toList: toList,
    toText: toText
  };

  function compatibility(cart){
    // this is for compatibility with previous versions where customItems were saved as text !
    if(!Array.isArray(cart.customItems)){
      cart.customItems = toList(cart.customItems);
      StorageSrv.saveCart(cart);
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


.factory('CartUiUtils', function($rootScope, $state, $window, CartSrv, CartUtils, ItemUtils, BackendSrv, ProductSrv, StoreSrv, ToastSrv, IonicUi){
  'use strict';
  var service = {
    initStartSelfScanModal: initStartSelfScanModal,
    initProductModal: initProductModal,
    initCartOptions: initCartOptions
  };

  function initStartSelfScanModal($scope){
    var scope = $scope.$new();
    var fn = {};
    var data = {};
    var modal = {fn: fn, data: data};
    scope.modal = modal;

    StoreSrv.getAll().then(function(stores){
      data.stores = stores;
    });

    fn.cancelSelfScan = function(){
      modal.self.hide();
    };
    fn.activeSelfScan = function(store){
      if(store && store.id){
        scope.data.cart.selfscan = true;
        scope.data.cart.store = store;
        CartSrv.updateCart(scope.data.cart);
        $state.go('app.cart.selfscan');
        modal.self.hide();
      } else {
        $window.alert('Error: unknown store: '+JSON.stringify(store));
      }
    };

    return IonicUi.initModal(scope, 'scripts/cart/partials/shop-modal.html').then(function(modal){
      scope.modal.self = modal;
      return modal;
    });
  }


  function initProductModal(){
    var data = {}, fn = {};
    var scope = $rootScope.$new(true);
    scope.data = data;
    scope.fn = fn;

    /*scope.$watch('data.updateProductFood', function(food){
      if(food && data.product && data.product.foodId !== food.id){
        updateProductFood(data.product, food);
      }
    });
    function updateProductFood(cartProduct, food){
      ProductSrv.setFoodId(cartProduct.barcode, food.id).then(function(){
        // TODO : should access to controller items & cart...
        ItemUtils.removeCartProduct(scope.data.items, cartProduct);
        cartProduct.foodId = food.id;
        ItemUtils.addCartProduct(scope.data.items, cartProduct);
        CartUtils.updateProduct(scope.data.cart, cartProduct);
        ToastSrv.show(scope.data.product.name+' est assigné comme '+food.name);
      });
    }
    BackendSrv.getFoods().then(function(foods){
      data.foods = [];
      for(var i in foods){
        data.foods.push(foods[i]);
      }
      data.foods.sort(function(a,b){
        if(a.name > b.name){return 1; }
        else if(a.name < b.name){ return -1; }
        else { return 0; }
      });
    });*/

    return IonicUi.initModal(scope, 'scripts/cart/partials/product-modal.html').then(function(modal){
      return {
        open: function(opts){
          var startTime = Date.now(), modalShowedTime = null, productLoadedTime = null;

          fn.close = function(action){
            modal.hide().then(function(){
              if(opts.callback){opts.callback(action, data.product);}
              data.product = null;
              //data.updateProductFood = null;
            });
          };
          data.title = opts.title;
          data.buyBar = opts.buyBar;

          return modal.show().then(function(){
            modalShowedTime = Date.now();
            console.log('Modal showed in '+((modalShowedTime-startTime)/1000)+' sec');
            return opts.product ? opts.product : (opts.store ? ProductSrv.getWithStore(opts.store, opts.barcode) : ProductSrv.get(opts.barcode));
          }).then(function(product){
            productLoadedTime = Date.now();
            console.log('Product loaded in '+((productLoadedTime-modalShowedTime)/1000)+' sec');
            data.product = product;
            //data.updateProductFood = {id: product.food.id};
          }, function(err){
            $window.alert('err: '+JSON.stringify(err));
            modal.hide();
          });
        }
      };
    });
  }


  function initCartOptions($scope){
    var scope = $scope.$new();
    var fn = {};
    var popover = {fn: fn};
    scope.popover = popover;

    fn.archiveCart = function(){
      if($window.confirm('Archiver cette liste ?')){
        CartUtils.archive(scope.data.cart);
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
