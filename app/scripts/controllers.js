angular.module('ionicApp')

.controller('IntroCtrl', function($scope, $state, UserService){
  'use strict';
  var user = UserService.get();
  if(!user.profile){user.profile = {};}

  $scope.profile = {
    defaultServings: user.profile.defaultServings ? user.profile.defaultServings : 2,
    mail: user.profile.mail ? user.profile.mail : ''
  };

  $scope.startApp = function(){
    $state.go('app.home');
  };
  $scope.submitUserInfos = function(){
    user.profile.mail = $scope.profile.mail;
    user.profile.defaultServings = $scope.profile.defaultServings;
    $scope.startApp();
  };
})

.controller('AppCtrl', function($rootScope, $scope, $state, $localStorage, $interval){
  'use strict';
  if($rootScope.showIntro){
    $rootScope.showIntro = false;
    $state.go('intro');
  }

  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.userAvatar = 'images/user.jpg'; // TODO : set user avatar (if connected with facebook...)
  $scope.userName = 'Anonymous'; // TODO : ask username
  $scope.recipesHistory = $localStorage.recipesHistory;
  $scope.recipesHistoryGoal = 10;

  $scope.role = function(recipesHistory){
    if(!recipesHistory || recipesHistory.length === 0){return '<i class="fa fa-eye"></i> Explorateur';}
    else if(recipesHistory.length < 3){return '<i class="fa fa-thumbs-o-up"></i> Testeur';}
    else if(recipesHistory.length < 5){return '<i class="fa fa-graduation-cap"></i> Cuisinier';}
    else if(recipesHistory.length < 10){return '<i class="fa fa-university"></i> Chef';}
    else {return '<i class="fa fa-trophy"></i> Grand chef';}
  };

  $interval(function(){
    if($localStorage.recipesHistory && $localStorage.recipesHistory.length > 0 && Math.random() > ($localStorage.recipesHistory.length/$scope.defaultCovers.length)){
      $scope.imageCover = $localStorage.recipesHistory[Math.floor(Math.random() * $localStorage.recipesHistory.length)].images.landing;
    } else {
      $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
    }
  }, 10000);
})

.controller('HomeCtrl', function($scope, $localStorage, CartService){
  'use strict';
  $scope.cart = CartService.getCurrentCart();
  $scope.items = CartService.getCurrentCartItems();
  $scope.recipesHistory = $localStorage.recipesHistory;
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
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('Recipes2Ctrl', function($scope, WeekrecipeService, CartService){
  'use strict';
  var recipesToAdd = [];
  $scope.weekrecipes = [];
  $scope.recipes = [];
  $scope.loading = true;

  WeekrecipeService.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes.recipes;
    recipesToAdd = _.filter(weekrecipes.recipes, function(recipe){
      return !CartService.cartHasRecipe(recipe);
    });
    $scope.cardSwiped();
    $scope.loading = false;
  });

  $scope.cardSwiped = function(recipe){
    if(recipe){
      if(!CartService.cartHasRecipe(recipe)){
        recipesToAdd.push(recipe);
      }
    }

    if(recipesToAdd.length > 0){
      var newRecipe = recipesToAdd.splice(0, 1)[0];
      $scope.recipes.push(angular.copy(newRecipe));
    }
  };
})

.controller('RecipeCardCtrl', function($scope, $ionicSwipeCardDelegate, CartService){
  'use strict';
  $scope.goAway = function(){
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe();
  };

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
    $scope.goAway();
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, $localStorage, RecipeService, CartService){
  'use strict';
  $scope.recipe = {};
  RecipeService.get($stateParams.recipeId).then(function(recipe){
    _.remove($localStorage.recipesHistory, {id: recipe.id});
    $localStorage.recipesHistory.unshift(recipe);
    $scope.recipe = recipe;
  });

  $scope.cartHasRecipe = CartService.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    CartService.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
  };
  $scope.removeRecipeFromCart = function(recipe){
    CartService.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
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

  $scope.ingredientBoughtPc = function(recipe){
    // TODO : this method is call 4 times by recipe... It's highly inefficient... Must fix !!!
    if(recipe && recipe.data && recipe.data.ingredients && recipe.data.ingredients.length > 0){
      var ingredientBought = 0;
      for(var i in recipe.data.ingredients){
        if(recipe.data.ingredients[i].bought){
          ingredientBought++;
        }
      }
      return 100 * ingredientBought / recipe.data.ingredients.length;
    } else {
      return 100;
    }
  };

  $scope.removeRecipeFromCart = function(recipe){
    if(CartService.hasCarts()){
      CartService.removeRecipeFromCart(recipe);
    }
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
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

.controller('FeedbackCtrl', function($scope, UserService){
  'use strict';
  var user = UserService.get();
  $scope.feedback = {
    mail: user.profile.mail,
    content: '',
    sent: false
  };
  $scope.sendFeedback = function(){
    // TODO really send feedback !!!
    $scope.feedback.sent = true;
  };
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
})

.controller('DebugCtrl', function($scope, $localStorage){
  'use strict';
  $scope.$storage = $localStorage;
});
