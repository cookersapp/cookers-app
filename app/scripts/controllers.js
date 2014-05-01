angular.module('ionicApp.controllers', [])


.controller('SideMenuCtrl', function($scope) {
  'use strict';
  $scope.header = {
    style: 'bar-positive',
    align: 'center'
  };
})


.controller('HomeCtrl', function($scope, Log) {
  'use strict';
  $scope.header.style = 'bar-positive';
  $scope.header.align = 'center';
})


.controller('ShoppinglistCtrl', function($scope, ShoppinglistService, IngredientService, ModalService, Log) {
  'use strict';
  // Done : open ingredient details when you add it to a list
  
  // TODO : don't show in suggestions ingredients already in list
  // TODO : parse search input
  // BUG : screen blink on phone :(
  // TODO : typer les champ de texte pour que le clavier ne commence pas par une majuscule...
  // TODO : ajouter la liste des unités possibles
  // TODO : set focus on search field when click on suggested ingredient
  // TODO : add a clear search button when it has some text
  // TODO : ingredientDetails : improve design !!! (show picture, name & category)
  // TODO : allow to change ingredient category (in ingredientDetails)
  // TODO : for unknown ingredient, allow to change name & picture (in addition on category)
  // TODO : save ingredients, ingredient categories & units on localstorage to allow users to add & customize them (and sync with API)
  $scope.header.style = 'bar-royal';
  $scope.header.align = 'left';
  $scope.ingredients = [];
  $scope.ingredientGrid = {};
  $scope.list = ShoppinglistService.getCurrentList();

  $scope.itemDetails = {};
  ModalService.shoppinglist.itemDetails($scope, function(modal) {
    $scope.itemDetails.modal = modal;
  });

  $scope.unknownClick = function(name){
    var ingredient = ShoppinglistService.createIngredient(name);
    $scope.ingredientClick(ingredient);
  };
  $scope.ingredientClick = function(ingredient){
    /*if(ShoppinglistService.existInCurrentList(ingredient)){
      $scope.itemClick(ShoppinglistService.getCurrentListItem(ingredient));
    } else {
      ShoppinglistService.addToCurrentList(ingredient);
    }*/
    var item = ShoppinglistService.createItem(ingredient);
    $scope.itemClick(item);
  };
  $scope.itemClick = function(item){
    $scope.itemDetails.title = 'Product';
    $scope.itemDetails.update = ShoppinglistService.existInCurrentList(item);
    $scope.itemDetails.item = item;
    $scope.itemDetails.data = angular.copy(item);
    $scope.itemDetails.modal.show();
  };
  $scope.addItem = function(){
    angular.copy($scope.itemDetails.data, $scope.itemDetails.item);
    ShoppinglistService.addToCurrentList($scope.itemDetails.item);
    $scope.itemDetails.modal.hide();
  };
  $scope.updateItem = function(){
    angular.copy($scope.itemDetails.data, $scope.itemDetails.item);
    $scope.itemDetails.modal.hide();
  };
  $scope.deleteItem = function(){
    console.log($scope.itemDetails.item);
    ShoppinglistService.removeFromCurrentList($scope.itemDetails.item);
    $scope.itemDetails.modal.hide();
  };

  IngredientService.getAsync().then(function(ingredients){
    $scope.ingredients = ingredients;
  });
})


.controller('ShoppinglistCartCtrl', function($scope, ShoppinglistService, ModalService, Log) {
  'use strict';
  $scope.search = {
    dirty: ''
  };
  /*
  // TODO => move to service
  var units = [
    {"id": "g"},
    {"id": "kg"}
  ];
  var matcher = {
    quantity: /\d+ /
  };
  $scope.$watch('search.dirty', function(value){
    $scope.search.parsed = parseSearch(value);
  });

  var str = "1 kg de pomme de terre";
  console.log(parseSearch(str));

  function parseSearch(str){
    console.log('quantity matcher', str.match(matcher.quantity));

    return {
      quantity: "",
      quantityUnit: "",
      value: str
    };
  }*/

  $scope.editList = {};
  ModalService.shoppinglist.editList($scope, function(modal) {
    $scope.editList.modal = modal;
  });
  $scope.switchList = {};
  ModalService.shoppinglist.switchList($scope, function(modal) {
    $scope.switchList.modal = modal;
  });

  $scope.createListForm = function(){
    $scope.editList.title = 'Nouvelle liste';
    $scope.editList.create = true;
    $scope.editList.data = ShoppinglistService.newList();
    $scope.editList.modal.show();
  };
  $scope.createList = function(){
    $scope.list = ShoppinglistService.addList($scope.editList.data);
    $scope.editList.modal.hide();
    $scope.switchList.modal.hide();
  };
  $scope.editListForm = function(){
    $scope.editList.title = 'Modifier la liste';
    $scope.editList.create = false;
    $scope.editList.data = angular.copy($scope.list);
    $scope.editList.modal.show();
  };
  $scope.deleteList = function(){
    $scope.list = ShoppinglistService.removeCurrentList();
    $scope.editList.modal.hide();
  };
  $scope.clearList = function(){
    ShoppinglistService.clearCurrentList();
    $scope.editList.modal.hide();
  };
  $scope.updateList = function(){
    angular.copy($scope.editList.data, $scope.list);
    $scope.editList.modal.hide();
  };
  $scope.switchListForm = function(){
    // TODO : BUG : if editList is called before and you want to create a new list, modal editList will comes under model switchList :(
    $scope.switchList.title = 'Changer de liste';
    $scope.switchList.data = ShoppinglistService.getAllLists();
    $scope.switchList.modal.show();
  };
  $scope.switchToList = function(list){
    $scope.list = ShoppinglistService.setCurrentList(list);
    // TODO : BUG : sometimes, list don't switch ... :(
    $scope.switchList.modal.hide();
  };
  $scope.shareList = function(){
    Log.alert('shareList : not implemented yet !');
  };

  $scope.buyItem = function(item){
    ShoppinglistService.buyFromCurrentList(item);
  };
  $scope.unbuyItem = function(item){
    ShoppinglistService.unbuyFromCurrentList(item);
  };
})


.controller('ShoppinglistProductsCtrl', function($scope, Log) {
  'use strict';

  $scope.done = function(){
    Log.alert('done : not implemented yet !');
  };
})


.controller('RecipesCtrl', function($scope) {
  'use strict';
  $scope.header.style = 'bar-assertive';
  $scope.header.align = 'center';
})


.controller('RecipesSearchCtrl', function($scope) {
  'use strict';

})


.controller('RecipesResultsCtrl', function($scope) {
  'use strict';

})


.controller('RecipeCtrl', function($scope, Log) {
  'use strict';

  $scope.favorite = function(){
    Log.alert('favorite : not implemented yet !');
  };
  $scope.share = function(){
    Log.alert('share : not implemented yet !');
  };
  $scope.addToList = function(){
    Log.alert('addToList : not implemented yet !');
  };
})


.controller('ScanCtrl', function($scope, $state, $stateParams, UserService){
  'use strict';
  var from = $stateParams.from;
  var start = moment().valueOf();

  cordova.plugins.barcodeScanner.scan(
    function (result) {
      if(!result.cancelled){
        UserService.makeScan(result.text, from, moment().valueOf() - start);
        $state.go('sidemenu.product', {barcode: result.text, from: from});
      } else {
        $state.go($rootScope.$previousState);
      }
    }, 
    function (error) {
      alert("Scanning failed: " + error);
    }
  );
})


.controller('ProductCtrl', function($scope, $stateParams/*, ProductService, RecipeService*/, UserService){
  'use strict';
  $scope.header.style = 'bar-balanced';
  $scope.header.align = 'center';
  var barcode = $stateParams.barcode;
  var from = $stateParams.from;

  $scope.product = {
    barcode: barcode
  };
  $scope.linkedRecipes = [];

  /*ProductService.getAsync(barcode).then(function(product){
    $scope.product = product;
    if(product){
      UserService.seeProduct(product);
      RecipeService.getAsync(product.linkedRecipes).then(function(recipes){
        $scope.linkedRecipes = recipes;
      });
    }
  });*/
})


.controller('LogsCtrl', function($scope, UserService){
  'use strict';
  $scope.formated = true;
  $scope.logs = UserService.getLogHistory();
})


.controller('DeviceCtrl', function($scope, $localStorage, Log){
  'use strict';
  $scope.$storage = $localStorage;

  window.ionic.Platform.ready(function(){
    $scope.device = window.ionic.Platform.device();
  });

  $scope.resetApp = function(){
    $scope.$storage.$reset();
    Log.alert('Application réinitialisée !');
    window.ionic.Platform.exitApp();
  };
});
