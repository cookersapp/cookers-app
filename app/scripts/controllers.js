angular.module('app')

.controller('AppCtrl', function($scope, $interval, $ionicSideMenuDelegate, RecipeSrv, UserSrv){
  'use strict';
  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.user = UserSrv.get();
  var recipesHistory = RecipeSrv.getHistory();

  $interval(function(){
    var historyLength = recipesHistory ? recipesHistory.length : 0;
    if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
      $scope.imageCover = recipesHistory[Math.floor(Math.random() * historyLength)].images.landing;
    } else {
      $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
    }
  }, 10000);
})

.controller('HomeCtrl', function($scope, $timeout, GlobalMessageSrv, CartSrv, RecipeSrv, WeekrecipeSrv, LogSrv){
  'use strict';
  $scope.recipesInCart = CartSrv.recipesFromOpenedCarts();
  $scope.itemsInCart = CartSrv.itemsFromOpenedCarts();
  $scope.recipesHistory = RecipeSrv.getHistory();
  $scope.recipesOfWeek = [];
  $scope.standardMessage = null;
  $scope.stickyMessages = [];

  WeekrecipeSrv.getCurrent().then(function(recipesOfWeek){
    $scope.recipesOfWeek = recipesOfWeek;
  });

  GlobalMessageSrv.getStandardMessageToDisplay().then(function(message){
    $scope.standardMessage = message;
  });
  GlobalMessageSrv.getStickyMessages().then(function(messages){
    $scope.stickyMessages = messages;
  });
  GlobalMessageSrv.execMessages();

  $scope.hideStandardMessage = function(){
    LogSrv.trackHideMessage($scope.standardMessage.id);
    $scope.standardMessage.hide = true;
    $scope.standardMessage = null;
    // wait 3 sec before show new message
    $timeout(function(){
      GlobalMessageSrv.getStandardMessageToDisplay().then(function(message){
        $scope.standardMessage = message;
      });
    }, 3000);
  };
})

.controller('RecipesCtrl', function($localStorage, $rootScope, $scope, $state, $window, $ionicPopup, WeekrecipeSrv, RecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.recipesOfWeek = {};
  WeekrecipeSrv.getCurrent().then(function(recipesOfWeek){
    $scope.recipesOfWeek = recipesOfWeek;
    $scope.loading = false;
  });
  
  var cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();

  $scope.cartHasRecipe = function(recipe){
    return CartSrv.hasRecipe(cart, recipe);
  };

  $scope.toggleIngredients = function(recipe){
    recipe.showIngredients = !recipe.showIngredients;
  };
  $scope.addRecipeToCart = function(recipe, index){
    $ionicPopup.show({
      template: ['<div style="text-align: center;">'+
                 '<h3 class="title" style="font-size: 20px;">'+recipe.name+'</h3>'+
                 '<div>Pour <b ng-bind="settings.defaultServings">??</b> personnes ?</div>'+
                 '</div>'+
                 '<div class="range">'+
                 '<i class="fa fa-user"></i>'+
                 '<input type="range" name="servings" min="1" max="10" ng-model="settings.defaultServings">'+
                 '<i class="fa fa-users"></i>'+
                 '</div>'].join(''),
      scope: $scope,
      buttons: [
        { text: 'Annuler' },
        { text: '<b>Ajouter</b>', type: 'button-positive', onTap: function(e){
          if(!$rootScope.settings.defaultServings){ e.preventDefault(); }
          else { return $rootScope.settings.defaultServings; }
        }}
      ]
    }).then(function(servings){
      if(servings){
        LogSrv.trackAddRecipeToCart(recipe.id, servings, index, 'weekrecipes');
        CartSrv.addRecipe(cart, recipe, servings);
        $window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
        RecipeSrv.addToHistory(recipe);
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'weekrecipes');
    CartSrv.removeRecipe(cart, recipe);
    $window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
  
  $scope.recipeFeedback = function(feedback){
    LogSrv.trackRecipesFeedback($scope.recipesOfWeek.week, feedback);
    $state.go('app.feedback', {source: 'recipes-rating-'+feedback});
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, RecipeSrv, LogSrv){
  'use strict';
  $scope.recipe = {};
  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    RecipeSrv.addToHistory(recipe);
    $scope.recipe = recipe;
  });
});
