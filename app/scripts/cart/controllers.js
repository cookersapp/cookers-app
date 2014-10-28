angular.module('app')

.controller('CartCtrl', function($scope, $state, $ionicPopover, $ionicModal, $window, CartSrv, ScanSrv, ProductSrv, ToastSrv){
  'use strict';
  var data = {}, fn = {}, ui = {shopModal: null, productModal: null};
  $scope.data = data;
  $scope.fn = fn;
  $scope.ui = ui;

  data.cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  if(!data.cart._formated){data.cart._formated = {};}
  data.cart._formated.isEmpty = isEmpty(data.cart);
  data.items = CartSrv.getItemsWithProducts(data.cart);
  data.estimatedPrice = CartSrv.getPrice(data.cart);
  data.totalProductsPrice = CartSrv.getProductPrice(data.cart);

  // TODO : refactor

  $ionicModal.fromTemplateUrl('scripts/cart/partials/shop-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    ui.shopModal = modal;
  });
  $scope.$on('$destroy', function(){
    ui.shopModal.remove();
  });

  fn.toggleSelfScan = function(){
    if(data.cart.selfscan){
      if($window.confirm('Abandonner le self-scan ?')){
        data.cart.selfscan = false;
        CartSrv.updateCart(data.cart);
        $state.go('app.cart.ingredients');
      }
    } else {
      ui.shopModal.show();
    }
  };
  fn.cancelSelfScan = function(){
    ui.shopModal.hide();
  };
  fn.activeSelfScan = function(){
    data.cart.selfscan = true;
    CartSrv.updateCart(data.cart);
    $state.go('app.cart.selfscan');
    ui.shopModal.hide();
  };

  $ionicModal.fromTemplateUrl('scripts/cart/partials/product-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    ui.productModal = modal;
  });
  $scope.$on('$destroy', function(){
    ui.productModal.remove();
  });

  fn.scan = function(multi){
    ScanSrv.scan(function(result){
      //alert("We got a barcode\nResult: " + result.text + "\nFormat: " + result.format + "\nCancelled: " + result.cancelled);
      if(!result.cancelled){
        var barcode = result.text;
        var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533'];
        barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];
        ui.productModal.show().then(function(){
          return ProductSrv.getWithStore('demo', barcode);
        }).then(function(product){
          if(product && product.name){
            data.product = product;
          } else {
            $window.alert('Product not found :(');
            ui.productModal.hide();
          }
        }, function(err){
          $window.alert('err: '+JSON.stringify(err));
        });
      }
    }, function(error){
      $window.alert('Scanning failed: ' + error);
    });
  };
  fn.addToCart = function(product){
    console.log('product', product);
    CartSrv.buyProduct(data.cart, data.items, product, 1);
    data.totalProductsPrice = CartSrv.getProductPrice(data.cart);
    ToastSrv.show('✔ '+product.name+' acheté !');
    ui.productModal.hide().then(function(){
      data.product = null;
    });
  };
  fn.notAddToCart = function(product){
    ui.productModal.hide().then(function(){
      data.product = null;
    });
  };

  $ionicPopover.fromTemplateUrl('scripts/cart/partials/cart-popover.html', {
    scope: $scope
  }).then(function(popover){
    ui.popover = popover;
  });

  fn.archiveCart = function(){
    if($window.confirm('Archiver cette liste ?')){
      CartSrv.archive(data.cart);
      ui.popover.remove();
      $state.go('app.home');
    }
  };

  function isEmpty(cart){
    return !(cart && (
      (cart.recipes && cart.recipes.length > 0) ||
      (cart.customItems && cart.customItems.length > 0) ||
      (cart.products && cart.products.length > 0)));
  }
})

.controller('CartSelfscanCtrl', function($scope, $window, $state, CartSrv, LogSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;

  if(!data.cart.selfscan){
    $state.go('app.cart.ingredients');
  } else {
    data.items = CartSrv.getItemsWithProducts(data.cart);
    data.totalProductsPrice = CartSrv.getProductPrice(data.cart);
    console.log('items', data.items);

    fn.unbuyProduct = function(product){
      if($window.confirm('Supprimer du panier : '+product.name+' ?')){
        CartSrv.unbuyProduct(data.cart, data.items, product);
      }
    };
  }
})

.controller('CartRecipesCtrl', function($scope, CartSrv, StorageSrv, ToastSrv, LogSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;

  data.selectedRecipe = null;
  data.estimatedPrice = CartSrv.getPrice(data.cart);

  fn.toggleRecipe = function(recipe){
    if(data.selectedRecipe === recipe){
      data.selectedRecipe = null;
    } else {
      LogSrv.trackCartRecipeDetails(recipe.id);
      data.selectedRecipe = recipe;
    }
  };

  fn.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'cart');
    CartSrv.removeRecipe(data.cart, recipe);
    ToastSrv.show('✔ recette supprimée de la liste de courses');
  };

  fn.updateServings = function(recipe, servingsValue){
    StorageSrv.saveCart(data.cart);
    data.estimatedPrice = CartSrv.getPrice(data.cart);
  };
})

.controller('CartIngredientsCtrl', function($scope, $state, CartSrv, StorageSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;

  if(data.cart.selfscan){
    $state.go('app.cart.selfscan');
  } else {
    data.estimatedPrice = CartSrv.getPrice(data.cart);
    var user = StorageSrv.getUser();
    if(!(user && user.settings && user.settings.skipCartFeatures)){
      PopupSrv.tourCartFeatures().then(function(){
        StorageSrv.saveUserSetting('skipCartFeatures', true);
      });
    }

    // for compatibility
    if(!Array.isArray(data.cart.customItems)){
      data.cart.customItems = customItemsToList(data.cart.customItems);
      StorageSrv.saveCart(data.cart);
    }
    data.customItems = data.cart.customItems;
    data.items = CartSrv.getItems(data.cart);

    data.editingCustomItems = false;
    data.customItemsText = '';
    fn.editCustomItems = function(){
      if(!data.editingCustomItems){
        data.editingCustomItems = true;
        data.customItemsText = customItemsToText(data.cart.customItems);
      }
    };
    fn.cancelCustomItems = function(){
      if(data.editingCustomItems){
        data.editingCustomItems = false;
        data.customItemsText = '';
      }
    };
    fn.saveCustomItems = function(){
      if(data.editingCustomItems){
        data.editingCustomItems = false;
        data.cart.customItems = customItemsToList(data.customItemsText);
        data.customItems = data.cart.customItems;
        StorageSrv.saveCart(data.cart);
        data.customItemsText = '';
        LogSrv.trackEditCartCustomItems(data.cart.customItems);
      }
    };
    fn.buyCustomItem = function(item){
      item.bought = true;
      StorageSrv.saveCart(data.cart);
      ToastSrv.show('✔ '+item.name+' acheté !');
    };
    fn.unbuyCustomItem = function(item){
      item.bought = false;
      StorageSrv.saveCart(data.cart);
    };

    data.openedItems = [];
    data.isOpened = function(item){
      return _.findIndex(data.openedItems, {food: {id: item.food.id}}) > -1;
    };
    fn.toggleItem = function(item){
      var index = _.findIndex(data.openedItems, {food: {id: item.food.id}});
      if(index > -1){
        data.openedItems.splice(index, 1);
      } else {
        data.openedItems.push(item);
        LogSrv.trackShowCartItemDetails(item.food.id);
      }
    };

    fn.cartHasItems = function(){
      return data.items.length > 0 || data.customItems.length > 0;
    };
    fn.cartHasItemsToBuy = function(){
      var itemsToBuy = _.filter(data.items, function(item){
        return !fn.isBought(item);
      });
      return itemsToBuy.length > 0;
    };
    fn.cartHasCustomItemsToBuy = function(){
      var itemsToBuy = _.filter(data.customItems, function(item){
        return !item.bought;
      });
      return itemsToBuy.length > 0;
    };
    fn.isBought = function(item){
      var bought = true;
      angular.forEach(item.sources, function(source){
        if(!source.ingredient.bought){bought = false;}
      });
      return bought;
    };
    fn.buyItem = function(item){
      LogSrv.trackBuyItem(item.food.id, item.quantity);
      CartSrv.buyItem(data.cart, item);
      ToastSrv.show('✔ '+item.food.name+' acheté !');
    };
    fn.unbuyItem = function(item){
      LogSrv.trackUnbuyItem(item.food.id);
      CartSrv.unbuyItem(data.cart, item);
    };
  }

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
});
