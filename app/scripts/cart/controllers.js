angular.module('app')

.controller('CartCtrl', function($scope, $state, $timeout, $ionicLoading, $ionicTabsDelegate, CartSrv, CartUtils, CartUi, StoreSrv, BarcodeSrv, DialogSrv, ToastSrv, LogSrv, Utils, PerfSrv, Config){
  'use strict';
  var data = {}, fn = {}, ui = {};
  $scope.data = data;
  $scope.fn = fn;
  $scope.ui = ui;


  //PerfSrv.loadController($scope, function(){
  $scope.$on('$viewContentLoaded', function(){
    if(!data.controllerLoaded){
      data.controllerLoaded = true;
      CartSrv.getCurrentCart().then(function(cart){
        // timeout needed to avoid error: Cannot read property 'options' of null (ionic bug !)
        $timeout(function(){
          if(cart.selfscan.started){
            $ionicTabsDelegate.select(1);
          } else {
            $ionicTabsDelegate.select(0);
          }
        }, 1000);
        data.cart = cart;
        data.customItemsText = null;
        data.selectedItem = null;
        data.selectedRecipe = null;
        CartUi.initProductModal(data.cart) .then(function(modal)   { ui.productModal = modal;    });
        CartUi.initCartOptions(data.cart)  .then(function(popover) { ui.cartOptions  = popover;  });
        CartUtils.getRecipes(data.cart).then(function(recipes){
          data.recipes = recipes;
        });
      });

      fn.customItems = {
        edit: function(){
          if(data.customItemsText === null){
            data.customItemsText = CartUtils.customItemsToText(data.cart.customItems);
          }
        },
        cancel: function(){
          data.customItemsText = null;
        },
        save: function(){
          if(data.customItemsText !== null){
            CartUtils.updateCustomItems(data.cart, data.customItemsText).then(function(){
              LogSrv.trackEditCartCustomItems(data.cart.customItems);
              data.customItemsText = null;
            });
          }
        }
      };

      fn.toggleItem = function(item){
        if(data.selectedItem === item){
          data.selectedItem = null;
        } else {
          data.selectedItem = item;
          LogSrv.trackShowCartItemDetails(item.id);
        }
      };
      fn.toggleRecipe = function(recipe){
        if(data.selectedRecipe === recipe){
          data.selectedRecipe = null;
        } else {
          data.selectedRecipe = recipe;
          LogSrv.trackShowCartRecipeDetails(recipe.id);
        }
      };
      fn.isBought = function(bought){
        return function(item){
          var isBought = !!item.bought && (!item.promos || item.promos.length === 0) && (!item.products || item.products.length === 0);
          return isBought === bought;
        };
      };
      fn.buyItem = function(item){
        LogSrv.trackBuyItem(item.id, item.quantity);
        CartUtils.buyItem(data.cart, item);
        ToastSrv.show('✔ '+item.name+' acheté !');
      };
      fn.unbuyItem = function(item){
        LogSrv.trackUnbuyItem(item.id);
        CartUtils.unbuyItem(data.cart, item);
      };
      fn.removeRecipeFromCart = function(recipe){
        LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'cart');
        CartUtils.removeRecipe(data.cart, recipe).then(function(){
          _.remove(data.recipes, {id: recipe.id});
        });
        ToastSrv.show('✔ recette supprimée de la liste de courses');
      };
      fn.updateServings = function(recipe, servings){
        Utils.debounce('cart-recipe-servings-'+recipe.id, {recipe: recipe, servings: servings}, function(value){
          CartUtils.adjustRecipe(data.cart, value.recipe, value.servings, true);
        });
      };
      fn.colorClass = function(prefix, cart, suffix){
        if(!suffix){suffix = '';}
        if(cart && cart.selfscan && cart.selfscan.store){
          if(cart.selfscan.store && cart.selfscan.store.color){ return prefix+cart.selfscan.store.color+suffix; }
          else { return prefix+'black'+suffix; }
        } else {
          return prefix+'custom'+suffix;
        }
      };
      fn.toggleSelfScan = function(){
        if(data.cart.selfscan.started){
          DialogSrv.confirm('Votre panier sera perdu !', 'Abandonner le self-scan ?').then(function(result){
            if(result){
              // TODO : track
              $ionicTabsDelegate.select(0);
              CartUtils.cancelSelfscan(data.cart);
            }
          });
        } else {
          fn.scan();
        }
      };
      fn.showOptions = function(event){
        ui.cartOptions.open(event);
      };
      fn.scan = function(_item){
        var startScanTime = Date.now();
        BarcodeSrv.scan().then(function(result){
          if(!result.cancelled){
            var format = result.format;
            var barcode = result.text;
            if(!barcode){
              var codes = ['3029330003533', '3036810207923', '3564700006061', '3535710002787', '3560070393763', '3038350054203', '3535710002930', '3023290642177', '3017230000059', '3608580750031', '3280221011086'];
              barcode = codes[Math.floor(Math.random() * codes.length)];
              format = 'EAN_13';
            }
            if(Config.debug){ToastSrv.show('Scanned in '+((Date.now()-startScanTime)/1000)+' sec');}

            if(format === 'QR_CODE' && Utils.startsWith(barcode, 'http://cookers.io/scan/stores/')){
              var regex = new RegExp('http://cookers\\.io/scan/stores/([0-9a-z]+)', 'i');
              var matches = barcode.match(regex);
              var storeId = matches ? matches[1] : null;
              startSelfScan(storeId);
            } else if(format === 'EAN_13' || format === 'EAN_8'){
              var itemId = _item ? (_item.id ? _item.id : _item.name) : undefined;
              LogSrv.trackCartScan(itemId, barcode, Date.now()-startScanTime);
              productScanned(barcode, _item);
            } else {
              DialogSrv.alert('Le code barre '+barcode+' comporte un format inutilisable ('+format+')', 'Code barre inconnu !');
            }
          }
        }, function(error){
          DialogSrv.alert(JSON.stringify(error), 'Scanning failed !');
          LogSrv.trackError('scanFailed', error);
        });
      };
      fn.archiveCart = function(){
        CartUtils.archive(data.cart);
        $state.go('app.home');
      };

      fn.removePromo = function(promo){
        DialogSrv.confirm('Supprimer ce coupon promo de votre panier ?', promo.name).then(function(result){
          if(result){
            CartUtils.removePromo(data.cart, promo);
            // TODO track
          }
        });
      };
      fn.unbuyProduct = function(product){
        DialogSrv.confirm('Supprimer du panier : '+product.name+' ?').then(function(result){
          if(result){
            CartUtils.unbuyProduct(data.cart, product);
            // TODO track
          }
        });
      };
      fn.productDetails = function(product){
        var storeId = data && data.cart && data.cart.selfscan && data.cart.selfscan.store ? data.cart.selfscan.store.id : undefined;
        ui.productModal.open({
          title: 'Produit acheté',
          buyBar: false,
          store: storeId,
          product: product
        });
      };
      fn.checkout = function(){
        var stillPromo = false;
        for(var i in data.cart.items){
          if(data.cart.items[i].promos.length > 0){
            stillPromo = true;
            break;
          }
        }
        if(stillPromo){
          DialogSrv.confirm('Il vous reste des coupons de réductions non utilisés. Êtes vous sûr de ne pas vouloir les utiliser ?', 'Coupons').then(function(result){
            if(result){
              DialogSrv.confirm('Vous pouvez maintenant passer en caisse :)').then(function(result){
                if(result){
                  fn.archiveCart();
                }
              });
            }
          });
        } else {
          DialogSrv.confirm('Vous pouvez maintenant passer en caisse :)').then(function(result){
            if(result){
              fn.archiveCart();
            }
          });
        }
      };
    }
  });

  function startSelfScan(storeId){
    $ionicLoading.show();
    StoreSrv.get(storeId).then(function(store){
      $ionicLoading.hide();
      if(store){
        DialogSrv.confirm('Bienvenu à '+store.name+'. Commencer le self-scan ?', 'Self-scan').then(function(result){
          if(result){
            // TODO : track
            CartUtils.startSelfscan(data.cart, store).then(function(){
              $ionicTabsDelegate.select(1);
            });
          }
        });
      } else {
        DialogSrv.alert('Magasin non reconnu :(', 'Self-scan');
        // TODO : track
      }
    });
  }

  function productScanned(barcode, _item){
    ui.productModal.open({
      title: 'Produit scanné',
      store: data && data.cart && data.cart.selfscan && data.cart.selfscan.store ? data.cart.selfscan.store.id : undefined,
      barcode: barcode,
      callback: function(action, product, price, number){
        if(action === 'bought'){
          if(data.cart.selfscan.started){
            CartUtils.buyProduct(data.cart, product, price, number).then(function(){
              if(_item){
                return CartUtils.buyItem(data.cart, _item);
              }
            }).then(function(){
              // TODO : track
              ToastSrv.show('✔ '+product.name+' acheté !');
            });
          } else if(_item){
            fn.buyItem(_item);
          }
        }
      }
    });
  }
});
