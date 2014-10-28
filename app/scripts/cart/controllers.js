angular.module('app')

.controller('CartCtrl', function($scope, $state, $ionicPopover, $ionicModal, $window, CartSrv, ItemsSrv, ScanSrv, ProductSrv, ToastSrv){
  'use strict';
  var shopModal = null, productModal = null;
  $scope.cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  if(!$scope.cart._formated){$scope.cart._formated = {};}
  $scope.cart._formated.isEmpty = isEmpty($scope.cart);
  $scope.items = ItemsSrv.items;

  $ionicModal.fromTemplateUrl('scripts/cart/partials/shop-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    shopModal = modal;
  });
  $scope.$on('$destroy', function(){
    shopModal.remove();
  });

  $scope.toggleSelfScan = function(){
    if($scope.cart.selfscan){
      if($window.confirm('Abandonner le self-scan ?')){
        $scope.cart.selfscan = false;
        CartSrv.updateCart($scope.cart);
        $state.go('app.cart.ingredients');
      }
    } else {
      shopModal.show();
    }
  };
  $scope.cancelSelfScan = function(){
    shopModal.hide();
  };
  $scope.activeSelfScan = function(){
    $scope.cart.selfscan = true;
    CartSrv.updateCart($scope.cart);
    $state.go('app.cart.selfscan');
    shopModal.hide();
  };

  $ionicModal.fromTemplateUrl('scripts/cart/partials/product-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    productModal = modal;
  });
  $scope.$on('$destroy', function(){
    productModal.remove();
  });

  $scope.scan = function(multi){
    ScanSrv.scan(function(result){
      //alert("We got a barcode\nResult: " + result.text + "\nFormat: " + result.format + "\nCancelled: " + result.cancelled);
      if(!result.cancelled){
        var barcode = result.text;
        var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533'];
        barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];
        productModal.show().then(function(){
          return ProductSrv.getWithStore('demo', barcode);
        }).then(function(product){
          if(product && product.name){
            $scope.product = product;
          } else {
            $window.alert('Product not found :(');
            productModal.hide();
          }
        }, function(err){
          $window.alert('err: '+JSON.stringify(err));
        });
      }
    }, function(error){
      $window.alert('Scanning failed: ' + error);
    });
  };
  $scope.addToCart = function(product){
    console.log('product', product);
    CartSrv.buyProduct($scope.cart, $scope.items, product, 1);
    ToastSrv.show('✔ '+product.name+' acheté !');
    productModal.hide().then(function(){
      $scope.product = null;
    });
  };
  $scope.notAddToCart = function(product){
    productModal.hide().then(function(){
      $scope.product = null;
    });
  };

  $ionicPopover.fromTemplateUrl('scripts/cart/partials/cart-popover.html', {
    scope: $scope
  }).then(function(popover){
    $scope.popover = popover;
  });

  $scope.archiveCart = function(){
    if($window.confirm('Archiver cette liste ?')){
      CartSrv.archive($scope.cart);
      $scope.popover.remove();
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

.controller('CartSelfscanCtrl', function($scope, $window, $state, CartSrv, ItemsSrv, LogSrv){
  'use strict';
  if(!$scope.cart.selfscan){
    $state.go('app.cart.ingredients');
  } else {
    ItemsSrv.loadCart($scope.cart);
    $scope.items = ItemsSrv.items;
    console.log('items', $scope.items);

    $scope.unbuyProduct = function(product){
      if($window.confirm('Supprimer du panier : '+product.name+' ?')){
        CartSrv.unbuyProduct($scope.cart, $scope.items, product);
      }
    };
  }
})

.controller('CartRecipesCtrl', function($scope, CartSrv, StorageSrv, ToastSrv, LogSrv){
  'use strict';
  $scope.selectedRecipe = null;
  $scope.totalPrice = CartSrv.getPrice($scope.cart);

  $scope.toggleRecipe = function(recipe){
    if($scope.selectedRecipe === recipe){
      $scope.selectedRecipe = null;
    } else {
      LogSrv.trackCartRecipeDetails(recipe.id);
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

.controller('CartIngredientsCtrl', function($scope, $state, CartSrv, ItemsSrv, StorageSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  if($scope.cart.selfscan){
    $state.go('app.cart.selfscan');
  } else {
    $scope.totalPrice = CartSrv.getPrice($scope.cart);
    var user = StorageSrv.getUser();
    if(!(user && user.settings && user.settings.skipCartFeatures)){
      PopupSrv.tourCartFeatures().then(function(){
        StorageSrv.saveUserSetting('skipCartFeatures', true);
      });
    }

    // for compatibility
    if(!Array.isArray($scope.cart.customItems)){
      $scope.cart.customItems = customItemsToList($scope.cart.customItems);
      StorageSrv.saveCart($scope.cart);
    }
    $scope.customItems = $scope.cart.customItems;
    ItemsSrv.loadCart($scope.cart);
    $scope.items = ItemsSrv.items;
    //$scope.items = CartSrv.getItems($scope.cart);

    $scope.editingCustomItems = false;
    $scope.customItemsText = '';
    $scope.editCustomItems = function(){
      if(!$scope.editingCustomItems){
        $scope.editingCustomItems = true;
        $scope.customItemsText = customItemsToText($scope.cart.customItems);
      }
    };
    $scope.cancelCustomItems = function(){
      if($scope.editingCustomItems){
        $scope.editingCustomItems = false;
        $scope.customItemsText = '';
      }
    };
    $scope.saveCustomItems = function(){
      if($scope.editingCustomItems){
        $scope.editingCustomItems = false;
        $scope.cart.customItems = customItemsToList($scope.customItemsText);
        $scope.customItems = $scope.cart.customItems;
        StorageSrv.saveCart($scope.cart);
        $scope.customItemsText = '';
        LogSrv.trackEditCartCustomItems($scope.cart.customItems);
      }
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

    $scope.openedItems = [];
    $scope.isOpened = function(item){
      return _.findIndex($scope.openedItems, {food: {id: item.food.id}}) > -1;
    };
    $scope.toggleItem = function(item){
      var index = _.findIndex($scope.openedItems, {food: {id: item.food.id}});
      if(index > -1){
        $scope.openedItems.splice(index, 1);
      } else {
        $scope.openedItems.push(item);
        LogSrv.trackShowCartItemDetails(item.food.id);
      }
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
      LogSrv.trackBuyItem(item.food.id, item.quantity);
      CartSrv.buyItem($scope.cart, item);
      ToastSrv.show('✔ '+item.food.name+' acheté !');
    };
    $scope.unbuyItem = function(item){
      LogSrv.trackUnbuyItem(item.food.id);
      CartSrv.unbuyItem($scope.cart, item);
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
