angular.module('app')

.controller('CartCtrl', function($scope, $state, $window, CartSrv, CartUtils, ItemUtils, CartUiUtils, BarcodeSrv, ProductSrv, ToastSrv){
  'use strict';
  var data = {}, fn = {}, ui = {};
  $scope.data = data;
  $scope.fn = fn;
  $scope.ui = ui;

  data.cart = CartSrv.getCurrentCart();
  data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
  data.shopPrice = CartUtils.getShopPrice(data.cart);

  CartUiUtils.initStartSelfScanModal()    .then(function(modal)   { ui.shopModal    = modal;    });
  CartUiUtils.initProductModal()          .then(function(modal)   { ui.productModal = modal;    });
  CartUiUtils.initCartOptions(data.cart)  .then(function(popover) { ui.cartOptions  = popover;  });

  fn.showOptions = function(event){
    ui.cartOptions.open(event);
  };

  fn.toggleSelfScan = function(){
    if(data.cart.selfscan){
      if($window.confirm('Abandonner le self-scan ?')){
        delete data.cart.selfscan;
        delete data.cart.store;
        CartSrv.updateCart(data.cart);
        $state.go('app.cart.ingredients');
      }
    } else {
      ui.shopModal.open({
        callback: function(action, store){
          if(action === 'storeSelected' && store && store.id){
            data.cart.selfscan = true;
            data.cart.store = store;
            CartSrv.updateCart(data.cart);
            $state.go('app.cart.selfscan');
          }
        }
      });
    }
  };

  fn.scan = function(multi){
    var startScanTime = Date.now();
    BarcodeSrv.scan(function(result){
      if(!result.cancelled){
        ToastSrv.show('Scanned in '+((Date.now()-startScanTime)/1000)+' sec');
        var barcode = result.text;
        var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533', '3023290642177', '3017230000059', '3036810207923'];
        barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];

        ui.productModal.open({
          title: 'Produit scanné',
          store: data.cart.store.id,
          barcode: barcode,
          callback: function(action, product){
            if(action === 'bought'){
              CartUtils.addProduct(data.cart, product, 1);
              ItemUtils.addProduct(data.cart, data.items, product, 1);
              data.shopPrice = CartUtils.getShopPrice(data.cart);
              ToastSrv.show('✔ '+product.name+' acheté !');
            }
          }
        });
      }
    }, function(error){
      $window.alert('Scanning failed: ' + error);
    });
  };
})

.controller('CartSelfscanCtrl', function($scope, $state, $window, CartUtils, CartUiUtils, ItemUtils, BackendSrv, BarcodeSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;
  var ui = $scope.ui;

  if(!data.cart.selfscan){
    $state.go('app.cart.ingredients');
  } else {
    data.items = ItemUtils.fromCart(data.cart);

    fn.removeFromCart = function(product){
      if($window.confirm('Supprimer du panier : '+product.name+' ?')){
        CartUtils.removeProduct(data.cart, product);
        ItemUtils.removeCartProduct(data.items, product);
        data.shopPrice = CartUtils.getShopPrice(data.cart);
      }
    };

    fn.productDetails = function(product){
      ui.productModal.open({
        title: 'Produit acheté',
        buyBar: false,
        product: product
      });
    };

    fn.checkout = function(){
      $window.alert('TODO...');
      //BarcodeSrv.encode();
    };
  }
})

.controller('CartRecipesCtrl', function($scope, CartUtils, StorageSrv, ToastSrv, LogSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;

  data.selectedRecipe = null;
  data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);

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
    CartUtils.removeRecipe(data.cart, recipe);
    ToastSrv.show('✔ recette supprimée de la liste de courses');
  };

  fn.updateServings = function(recipe, servingsValue){
    StorageSrv.saveCart(data.cart);
    data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
  };
})

.controller('CartIngredientsCtrl', function($scope, $state, $window, CartUtils, ItemUtils, CustomItemUtils, CartUiUtils, StorageSrv, BarcodeSrv, ProductSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;
  var ui = $scope.ui;

  if(data.cart.selfscan){
    $state.go('app.cart.selfscan');
  } else {
    var user = StorageSrv.getUser();
    if(!(user && user.settings && user.settings.skipCartFeatures)){
      PopupSrv.tourCartFeatures().then(function(){
        StorageSrv.saveUserSetting('skipCartFeatures', true);
      });
    }

    data.items = ItemUtils.fromCart(data.cart);

    CustomItemUtils.compatibility(data.cart);
    var customItems = {
      data: {
        editing: false,
        text: ''
      },
      fn: {
        edit: function(){
          if(!customItems.data.editing){
            customItems.data.editing = true;
            customItems.data.text = CustomItemUtils.toText(data.cart.customItems);
          }
        },
        cancel: function(){
          if(customItems.data.editing){
            customItems.data.editing = false;
            customItems.data.text = '';
          }
        },
        save: function(){
          if(customItems.data.editing){
            customItems.data.editing = false;
            data.cart.customItems = CustomItemUtils.toList(customItems.data.text);
            StorageSrv.saveCart(data.cart);
            customItems.data.text = '';
            LogSrv.trackEditCartCustomItems(data.cart.customItems);
          }
        },
        buy: function(item){
          item.bought = true;
          StorageSrv.saveCart(data.cart);
          ToastSrv.show('✔ '+item.name+' acheté !');
        },
        unbuy: function(item){
          item.bought = false;
          StorageSrv.saveCart(data.cart);
        }
      }
    };
    $scope.customItems = customItems;

    var openedItems = {
      data: {
        list: []
      },
      fn: {
        isOpened: function(item){
          return _.findIndex(openedItems.data.list, {food: {id: item.food.id}}) > -1;
        },
        toggleItem: function(item){
          var index = _.findIndex(openedItems.data.list, {food: {id: item.food.id}});
          if(index > -1){
            openedItems.data.list.splice(index, 1);
          } else {
            openedItems.data.list.push(item);
            LogSrv.trackShowCartItemDetails(item.food.id);
          }
        }
      }
    };
    $scope.openedItems = openedItems;

    fn.cartHasItems = function(){
      return data.items.length > 0 || data.cart.customItems.length > 0;
    };
    fn.cartHasItemsToBuy = function(){
      var itemsToBuy = _.filter(data.items, function(item){
        return !fn.isBought(item);
      });
      return itemsToBuy.length > 0;
    };
    fn.cartHasCustomItemsToBuy = function(){
      var itemsToBuy = _.filter(data.cart.customItems, function(item){
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
      CartUtils.addItem(data.cart, item);
      ToastSrv.show('✔ '+item.food.name+' acheté !');
    };
    fn.unbuyItem = function(item){
      LogSrv.trackUnbuyItem(item.food.id);
      CartUtils.removeItem(data.cart, item);
    };

    fn.productDetails = function(item){
      var startScanTime = Date.now();
      BarcodeSrv.scan(function(result){
        if(!result.cancelled){
          ToastSrv.show('Scanned in '+((Date.now()-startScanTime)/1000)+' sec');
          var barcode = result.text;
          var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533', '3023290642177', '3017230000059', '3036810207923'];
          barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];

          ui.productModal.open({
            title: 'Produit scanné',
            barcode: barcode,
            callback: function(action, product){
              if(action === 'bought'){
                fn.buyItem(item);
              }
            }
          });
        }
      }, function(error){
        $window.alert('Scanning failed: ' + error);
      });
    };
  }
});
