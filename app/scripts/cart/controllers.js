angular.module('app')

.controller('CartCtrl', function($scope, $state, $window, CartSrv, CartUtils, ItemUtils, CartUiUtils, ScanSrv, ProductSrv, ToastSrv){
  'use strict';
  var data = {}, fn = {}, ui = {};
  $scope.data = data;
  $scope.fn = fn;
  $scope.ui = ui;

  data.cart = CartSrv.getCurrentCart();
  data.items = ItemUtils.fromCart(data.cart);
  data.estimatedPrice = CartUtils.getEstimatedPrice(data.cart);
  data.shopPrice = CartUtils.getShopPrice(data.cart);

  CartUiUtils.initStartSelfScanModal  ($scope).then(function(modal)   { ui.shopModal    = modal;    });
  CartUiUtils.initScanModal           ($scope).then(function(modal)   { ui.scanModal    = modal;    });
  CartUiUtils.initCartOptions         ($scope).then(function(popover) { ui.popover      = popover;  });

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

  fn.scan = function(multi){
    var startScan = Date.now();
    ScanSrv.scan(function(result){
      //alert("We got a barcode\nResult: " + result.text + "\nFormat: " + result.format + "\nCancelled: " + result.cancelled);
      if(!result.cancelled){
        var scanDone = Date.now();
        ToastSrv.show('Scanned in '+(scanDone-startScan)+' ms');
        var barcode = result.text;
        var codes = ['3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3029330003533'];
        barcode = barcode ? barcode : codes[Math.floor(Math.random() * codes.length)];
        ui.scanModal.show().then(function(){
          return ProductSrv.getWithStore('demo', barcode);
        }).then(function(product){
          var productShowed = Date.now();
          ToastSrv.show('Get product in '+(productShowed-scanDone)+' ms');
          if(product && product.name){
            data.product = product;
          } else {
            $window.alert('Product not found :(');
            ui.scanModal.hide();
          }
        }, function(err){
          $window.alert('err: '+JSON.stringify(err));
        });
      }
    }, function(error){
      $window.alert('Scanning failed: ' + error);
    });
  };
})

.controller('CartSelfscanCtrl', function($scope, $state, CartUtils, CartUiUtils, ItemUtils, BackendSrv){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;
  var ui = $scope.ui;

  if(!data.cart.selfscan){
    $state.go('app.cart.ingredients');
  } else {
    CartUiUtils.initProductModal($scope).then(function(modal){
      ui.productModal = modal;
    });

    fn.removeFromCart = function(product){
      if($window.confirm('Supprimer du panier : '+product.name+' ?')){
        CartUtils.removeProduct(data.cart, product);
        ItemUtils.removeCartProduct(data.items, product);
        data.shopPrice = CartUtils.getShopPrice(data.cart);
      }
    };

    fn.productDetails = function(product){
      data.product = product;
      data.updateProductFood = {id: product.foodId};
      if(!data.foods){
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
        });
      }
      ui.productModal.show();
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

.controller('CartIngredientsCtrl', function($scope, $state, CartUtils, ItemUtils, CustomItemUtils, StorageSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  // herited from CartCtrl
  var data = $scope.data;
  var fn = $scope.fn;

  if(data.cart.selfscan){
    $state.go('app.cart.selfscan');
  } else {
    var user = StorageSrv.getUser();
    if(!(user && user.settings && user.settings.skipCartFeatures)){
      PopupSrv.tourCartFeatures().then(function(){
        StorageSrv.saveUserSetting('skipCartFeatures', true);
      });
    }

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
  }
});
