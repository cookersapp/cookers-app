angular.module('ionicApp')

.controller('IntroCtrl', function($scope, $state, UserService){
  'use strict';
  $scope.defaultServings = 2;
  $scope.mail = '';
  
  $scope.startApp = function(){
    $state.go('app.home');
  };
  $scope.submitUserInfos = function(){
    var user = UserService.get();
    if(!user.profile){user.profile = {};}
    // TODO : problems, data are not updated !!! (mail & defaultServings) :(
    user.profile.mail = $scope.mail;
    user.profile.defaultServings = $scope.defaultServings;
    $state.go('app.home');
  };
})

.controller('AppCtrl', function($rootScope, $scope, $state, UserService){
  'use strict';
  $scope.user = UserService.get();
  $scope.ionic = ionic;

  if($rootScope.showIntro){
    $rootScope.showIntro = false;
    $state.go('intro');
  }
})

.controller('HomeCtrl', function($scope, $localStorage, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();
  $scope.items = CartService.getCurrentCartItems();
  $scope.selectedRecipes = $localStorage.selectedRecipes;
})

.controller('RecipesCtrl', function($scope, WeekrecipeService, CartService){
  'use strict';
  $scope.loading = true;
  $scope.weekrecipes = [];
  WeekrecipeService.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes;
    $scope.loading = false;
  });

  $scope.cartHasRecipe = CartService.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    // TODO add toast
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    // TODO add toast
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, RecipeService, CartService){
  'use strict';
  $scope.recipe = {};
  RecipeService.get($stateParams.recipeId).then(function(recipe){
    $scope.recipe = recipe;
  });

  $scope.cartHasRecipe = CartService.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    // TODO add toast
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    // TODO add toast
  };
})

.controller('CartCtrl', function($scope, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();
  $scope.archiveCart = function(){
    if(window.confirm('Archiver cette liste ?')){
      CartService.archiveCart();
    }
  };
})

.controller('CartRecipesCtrl', function($scope, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();

  $scope.removeRecipeFromCart = function(recipe){
    if(CartService.hasCarts()){
      CartService.removeRecipeFromCart(recipe);
    }
    // TODO add toast
  };
})

.controller('CartIngredientsCtrl', function($scope, CartService){
  'use strict';
  $scope.items = CartService.getCurrentCartItems();
  $scope.boughtItems = CartService.getCurrentCartBoughtItems();

  $scope.buyItem = function(item){
    CartService.buyCartItem(item);
    updateCart();
  };
  $scope.buySource = function(source, item){
    CartService.buyCartItemSource(source, item);
    updateCart();
  };
  $scope.unbuyItem = function(item){
    CartService.unbuyCartItem(item);
    updateCart();
  };

  function updateCart(){
    $scope.items = CartService.getCurrentCartItems();
    $scope.boughtItems = CartService.getCurrentCartBoughtItems();
  }
})

.controller('SettingsCtrl', function($scope, $localStorage, localStorageDefault){
  'use strict';
  $scope.resetApp = function(){
    if(window.confirm('Reset app ?')){
      $localStorage.$reset(localStorageDefault);
      if(navigator.app){
        navigator.app.exitApp();
      } else if(navigator.device){
        navigator.device.exitApp();
      }
    }
  };
});
