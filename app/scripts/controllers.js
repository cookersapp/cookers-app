angular.module('ionicApp.controllers', [])


.controller('SideMenuCtrl', function($scope) {
  'use strict';
  $scope.header = {
    align: 'center'
  };
})


.controller('HomeCtrl', function($scope, Log) {
  'use strict';
  $scope.header.align = 'center';
})


.controller('ShoppinglistCtrl', function($scope, ShoppinglistService, IngredientService, CategoryService, DataService, ModalService, Log) {
  'use strict';
  $scope.header.align = 'left';
  $scope.ingredients = [];
  $scope.ingredientUnits = [];
  $scope.ingredientGrid = {};
  $scope.list = ShoppinglistService.getCurrentList();

  DataService.getUnitsAsync().then(function(units){
    $scope.ingredientUnits = units;
  });

  IngredientService.getAsync().then(function(ingredients){
    $scope.ingredients = ingredients;
  });

  $scope.itemDetails = {};
  ModalService.shoppinglist.itemDetails($scope, function(modal) {
    $scope.itemDetails.modal = modal;
  });

  /*function getPriceRef(item){
    if(item){
      var unitId = item.quantityUnit && item.quantityUnit.id ? item.quantityUnit.id : item.quantityUnit;
      var prices = item.ingredient.prices;
      if(prices.length > 0){
        var price =  prices[0];
        for(var i in prices){
          if(prices[i].unit === unitId){
            price = prices[i];
          }
        }
        return price;
      }
    }
  };
  function getPrice(item){
    var ref = getPriceRef(item);
    if(ref){
      return item.quantity * ref.price;
    }
  }*/

  $scope.unknownAdd = function(name){
    var ingredient = ShoppinglistService.createIngredient(name);
    $scope.ingredientAdd(ingredient);
  };
  $scope.ingredientAdd = function(ingredient){
    var item = ShoppinglistService.createItem(ingredient);
    $scope.itemClick(item);
  };
  $scope.itemClick = function(item){
    console.log('item', item);
    $scope.itemDetails.title = 'Product';
    $scope.itemDetails.update = ShoppinglistService.existInCurrentList(item);
    $scope.itemDetails.item = item;
    $scope.itemDetails.data = {
      item: angular.copy(item),
      category: null,
      units: []
    };
    if($scope.itemDetails.data.item.quantityUnit){$scope.itemDetails.data.item.quantityUnit = $scope.itemDetails.data.item.quantityUnit.id;}
    CategoryService.getAsync(item.ingredient.category).then(function(category){
      $scope.itemDetails.data.category = category;
    });
    $scope.itemDetails.modal.show();
  };
  $scope.addItem = function(){
    angular.copy($scope.itemDetails.data.item, $scope.itemDetails.item);
    $scope.itemDetails.item.quantityUnit = _.find($scope.ingredientUnits, {id: $scope.itemDetails.item.quantityUnit});
    ShoppinglistService.addToCurrentList($scope.itemDetails.item);
    $scope.itemDetails.modal.hide();
  };
  $scope.updateItem = function(){
    angular.copy($scope.itemDetails.data.item, $scope.itemDetails.item);
    $scope.itemDetails.item.quantityUnit = _.find($scope.ingredientUnits, {id: $scope.itemDetails.item.quantityUnit});
    $scope.itemDetails.modal.hide();
  };
  $scope.deleteItem = function(){
    ShoppinglistService.removeFromCurrentList($scope.itemDetails.item);
    $scope.itemDetails.modal.hide();
  };

  $scope.isIngredientInCurrentList = function(ingredient){
    var item = ShoppinglistService.createItem(ingredient);
    return ShoppinglistService.existInCurrentList(item);
  };
})


.controller('ShoppinglistCartCtrl', function($scope, ShoppinglistService, ShoppingParserService, ModalService, Log) {
  'use strict';
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


.controller('ShoppinglistIngredientsCtrl', function($scope, $stateParams, $state, IngredientGridService, ShoppinglistService, ShoppingParserService, Util, Log) {
  'use strict';
  var category = $stateParams.category ? $stateParams.category : 'root';
  $scope.rowIngredients = [];
  $scope.categoryPath = [];
  $scope.search = {
    dirty: ''
  };
  $scope.$watch('search.dirty', function(value){
    $scope.search.parsed = ShoppingParserService.parse(value);
  });

  IngredientGridService.getAsync(category).then(function(results){
    if(results && results.length > 0){
      $scope.rowIngredients = Util.toRows(results, 4);
    } else {
      Log.error('No results for category <'+category+'> !');
    }
  });
  IngredientGridService.getPathAsync(category).then(function(path){
    if(path && path.length > 0){
      $scope.categoryPath = path;
    } else {
      Log.error('No path for category <'+category+'> !');
    }
  });

  $scope.clearSearch = function(){
    console.log('clearSearch');
    $scope.search.dirty = '';
  };

  $scope.alreadyAdded = function(ingredient){
    var item = ShoppinglistService.createItem(ingredient);
    return ShoppinglistService.existInCurrentList(item);
  };

  $scope.ingredientClick = function(ingredient){
    if(ingredient.type === 'category'){
      $state.go('sidemenu.shoppinglist.ingredients', {category: ingredient.id});
    } else if($scope.alreadyAdded(ingredient)){
      var item = ShoppinglistService.createItem(ingredient);
      $scope.itemClick(item);
    } else {
      $scope.ingredientAdd(ingredient);
    }
  };
})


.controller('RecipesCtrl', function($scope) {
  'use strict';
  $scope.header.align = 'center';
})


.controller('RecipesSearchCtrl', function($scope, IngredientService) {
  'use strict';
  $scope.search = {
    text: '',
    ingredients: [],
    price: 5,
    time: 15
  };
  $scope.ingredients = [];
  IngredientService.getAsync().then(function(ingredients){
    $scope.ingredients = ingredients;
  });
  
  $scope.selectIngredient = function(ingredient){
    $scope.search.ingredients.push(ingredient);
  };
  $scope.unselectIngredient = function(index){
    $scope.search.ingredients.splice(index, 1);
  };
})


.controller('RecipesResultsCtrl', function($scope, RecipeService) {
  'use strict';
  $scope.recipes = [];

  // TODO : search !!!
  RecipeService.getAsync().then(function(recipes){
    console.log(recipes)
    $scope.recipes = recipes;
  });
})


.controller('RecipeCtrl', function($scope, $stateParams, DataService, RecipeService, ShoppinglistService, UserService, ModalService, Log) {
  'use strict';
  var id = $stateParams.id;
  var from = $stateParams.from;
  $scope.recipe = {
    id: id
  };
  $scope.ingredientUnits = [];

  DataService.getUnitsAsync().then(function(units){
    $scope.ingredientUnits = units;
  });

  RecipeService.getAsync(id).then(function(recipe){
    $scope.recipe = recipe;
    UserService.seeRecipe(recipe);
  });


  $scope.toCurrentList = {};
  ModalService.recipe.ingredientsToShoppinglist($scope, function(modal) {
    $scope.toCurrentList.modal = modal;
  });

  $scope.favorite = function(){
    Log.alert('favorite : not implemented yet !');
  };
  $scope.share = function(){
    Log.alert('share : not implemented yet !');
  };
  $scope.addIngredientsToListForm = function(recipe){
    $scope.toCurrentList.title = 'Ajouter à la liste de courses';
    $scope.toCurrentList.init = angular.copy(recipe);
    $scope.toCurrentList.data = angular.copy(recipe);
    $scope.toCurrentList.modal.show();
  };
  $scope.addIngredientsToList = function(recipeName, ingredients, quantityFactor){
    for(var i in ingredients){
      var ingredient = ingredients[i];
      if(ingredient.shouldAdd){
        var notes = recipeName;
        var quantity = ingredient.quantity ? ingredient.quantity * quantityFactor : null;
        var quantityUnit = _.find($scope.ingredientUnits, {id: ingredient.quantityUnit});

        // TODO : choose list to add items (and create one if needed...)
        var item = ShoppinglistService.createItem(ingredient.ingredientId, notes, quantity, quantityUnit);
        ShoppinglistService.addToCurrentList(item);
      }
    }
    // TODO : show toast to confirm...
    $scope.toCurrentList.modal.hide();
  };
})


.controller('ScanCtrl', function($scope, $state, $stateParams, UserService){
  'use strict';
  var from = $stateParams.from;
  var start = moment().valueOf();

  if(ionic.Platform.isWebView()){
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
  } else {
    var barcode = prompt('Barcode :');
    UserService.makeScan(barcode, from, moment().valueOf() - start);
    $state.go('sidemenu.product', {barcode: barcode, from: from});
  }
})


.controller('ProductCtrl', function($scope, $stateParams, ProductService, RecipeService, UserService){
  'use strict';
  $scope.header.align = 'center';
  var barcode = $stateParams.barcode;
  var from = $stateParams.from;

  $scope.product = {
    id: barcode
  };
  $scope.linkedRecipes = [];

  ProductService.getAsync(barcode).then(function(product){
    $scope.product = product;
    if(product){
      UserService.seeProduct(product);
      RecipeService.matchWithAsync(product.ingredient).then(function(recipes){
        $scope.linkedRecipes = recipes;
      });
    }
  });
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
