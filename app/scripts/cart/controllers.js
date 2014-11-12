angular.module('app')

.controller('CartCtrl', function($scope, $state, $window, $ionicLoading, CartSrv, CartUtils, ItemUtils, CartUiUtils, BarcodeSrv, StoreSrv, ToastSrv, DialogSrv, LogSrv, Utils, PerfSrv){
  'use strict';
  var data = {}, fn = {}, ui = {};
  $scope.data = data;
  $scope.fn = fn;
  $scope.ui = ui;

  PerfSrv.loadController($scope, function(){
    CartSrv.getCurrentCart().then(function(cart){
      data.cart = cart;
      data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
      data.shopPrice = CartUtils.getShopPrice(data.cart);
    });

    CartUiUtils.initProductModal()          .then(function(modal)   { ui.productModal = modal;    });
    CartUiUtils.initCartOptions(data.cart)  .then(function(popover) { ui.cartOptions  = popover;  });

    fn.showOptions = function(event){
      ui.cartOptions.open(event);
    };

    fn.scan = function(_item){
      var startScanTime = Date.now();
      BarcodeSrv.scan().then(function(result){
        if(!result.cancelled){
          var barcode = result.text;
          var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533', '3023290642177', '3017230000059', '3036810207923'];
          barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];
          if(Config.debug){ToastSrv.show('Scanned in '+((Date.now()-startScanTime)/1000)+' sec');}

          if(Utils.startsWith(barcode, 'http://cookers.io/scan/stores/')){ // format: QR_CODE
            var regex = new RegExp('http://cookers\\.io/scan/stores/([0-9a-z]+)', 'i');
            var matches = barcode.match(regex);
            var storeId = matches ? matches[1] : null;
            $ionicLoading.show();
            StoreSrv.get(storeId).then(function(store){
              $ionicLoading.hide();
              if(store){
                DialogSrv.confirm('Bienvenu à '+store.name+'. Commencer le self-scan ?', 'Self-scan').then(function(result){
                  if(result){
                    data.cart.selfscan = true;
                    data.cart.store = store;
                    CartSrv.updateCart(data.cart);
                    $state.go('app.cart.selfscan');
                  }
                });
              } else {
                DialogSrv.alert('Magasin non reconnu :(', 'Self-scan');
              }
            });
          } else { // format: EAN_13
            var itemId = _item ? (_item.food && _item.food.id ? _item.food.id : _item.name) : undefined;
            LogSrv.trackCartScan(itemId, barcode, Date.now()-startScanTime);

            ui.productModal.open({
              title: 'Produit scanné',
              store: data && data.cart && data.cart.store ? data.cart.store.id : undefined,
              barcode: barcode,
              callback: function(action, product, quantity, price){
                if(action === 'bought'){
                  if(data.cart.selfscan){
                    CartUtils.addProduct(data.cart, product, quantity, price);
                    ItemUtils.addProduct(data.cart, data.items, product, quantity, price);
                    data.shopPrice = CartUtils.getShopPrice(data.cart);
                    ToastSrv.show('✔ '+product.name+' acheté !');
                  } else {
                    if(_item){
                      if(_item.food && _item.food.id){
                        fn.buyItem(_item);
                      } else {
                        fn.buyCustomItems(_item);
                      }
                    }
                  }
                }
              }
            });
          }
        }
      }, function(error){
        DialogSrv.alert(JSON.stringify(error), 'Scanning failed !');
        LogSrv.trackError('scanFailed', error);
      });
    };

    fn.toggleSelfScan = function(){
      if(data.cart.selfscan){
        DialogSrv.confirm('Votre panier sera perdu !', 'Abandonner le self-scan ?').then(function(result){
          if(result){
            delete data.cart.selfscan;
            delete data.cart.store;
            CartSrv.updateCart(data.cart);
            $state.go('app.cart.ingredients');
          }
        });
      } else {
        fn.scan();
      }
    };
  });
})

.controller('CartRecipesCtrl', function($scope, CartUtils, CartSrv, ToastSrv, LogSrv, PerfSrv){
  'use strict';
  PerfSrv.loadController($scope, function(){
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
      data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
      ToastSrv.show('✔ recette supprimée de la liste de courses');
    };

    fn.updateServings = function(recipe, servingsValue){
      CartSrv.updateCart(data.cart);
      data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
    };
  });
})

.controller('CartIngredientsCtrl', function($scope, $state, CartSrv, CartUtils, ItemUtils, CustomItemUtils, StorageSrv, BarcodeSrv, PopupSrv, ToastSrv, LogSrv, Config, PerfSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;
  var ui = $scope.ui;

  PerfSrv.loadController($scope, function(){
    if(!data.cart){
      CartSrv.getCurrentCart().then(function(cart){
        data.cart = cart;
        controller();
      });
    } else {
      controller();
    }
  });

  function controller(){
    StorageSrv.getUser().then(function(user){
      if(user && user.settings && !user.settings.skipCartFeatures){
        PopupSrv.tourCartFeatures().then(function(){
          StorageSrv.setUserSetting('skipCartFeatures', true);
        });
      }
    });

    if(data.cart && data.cart.selfscan){
      $state.go('app.cart.selfscan');
    } else {
      data.items = ItemUtils.fromCart(data.cart);
      CustomItemUtils.compatibility(data.cart);
    }

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
            CartSrv.updateCart(data.cart);
            customItems.data.text = '';
            LogSrv.trackEditCartCustomItems(data.cart.customItems);
          }
        },
        buy: function(item){
          item.bought = true;
          CartSrv.updateCart(data.cart);
          ToastSrv.show('✔ '+item.name+' acheté !');
        },
        unbuy: function(item){
          item.bought = false;
          CartSrv.updateCart(data.cart);
        }
      }
    };
    $scope.customItems = customItems;
    fn.buyCustomItems = customItems.fn.buy;

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
      return (data.items && data.items.length > 0) || (data.cart && data.cart.customItems.length > 0);
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
      CartUtils.buyItem(data.cart, item);
      ToastSrv.show('✔ '+item.food.name+' acheté !');
    };
    fn.unbuyItem = function(item){
      LogSrv.trackUnbuyItem(item.food.id);
      CartUtils.unbuyItem(data.cart, item);
    };
  }
})

.controller('CartSelfscanCtrl', function($scope, $state, $window, CartSrv, CartUtils, ItemUtils, DialogSrv, PerfSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;
  var ui = $scope.ui;

  PerfSrv.loadController($scope, function(){
    if(!data.cart){
      CartSrv.getCurrentCart().then(function(cart){
        data.cart = cart;
        controller();
      });
    } else {
      controller();
    }
  });

  function controller(){
    if(data.cart && data.cart.selfscan){
      data.items = ItemUtils.fromCart(data.cart);
    } else {
      $state.go('app.cart.ingredients');
    }

    fn.removeFromCart = function(product){
      DialogSrv.confirm('Supprimer du panier : '+product.name+' ?').then(function(result){
        if(result){
          CartUtils.removeProduct(data.cart, product);
          ItemUtils.removeCartProduct(data.items, product);
          data.shopPrice = CartUtils.getShopPrice(data.cart);
        }
      });
    };

    fn.productDetails = function(product){
      var storeId = data && data.cart && data.cart.store ? data.cart.store.id : undefined;
      ui.productModal.open({
        title: 'Produit acheté',
        buyBar: false,
        store: storeId,
        product: product
      });
    };

    fn.checkout = function(){
      $window.alert('TODO...');
    };
  }
});
