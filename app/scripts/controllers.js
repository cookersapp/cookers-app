angular.module('ionicApp')

.controller('IntroCtrl', function($scope, $state, $ionicPlatform, UserService){
  'use strict';
  $scope.profile = angular.copy(UserService.getProfile());

  $scope.startApp = function(){
    $state.go('app.home');
  };
  $scope.submitUserInfos = function(){
    UserService.setMail($scope.profile.mail);
    UserService.setDefaultServings($scope.profile.defaultServings);
    $scope.startApp();
  };
})

.controller('AppCtrl', function($rootScope, $scope, $state, $localStorage, $interval, UserService, debug){
  'use strict';
  if($rootScope.showIntro){
    $rootScope.showIntro = false;
    $state.go('intro');
  }

  $scope.debug = debug;
  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.userProfile = UserService.getProfile();

  // TODO : do it with boughtRecipes or CartCreated !
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

.controller('HomeCtrl', function($scope, $localStorage, UserInfoService, CartService){
  'use strict';
  $scope.message = null;
  $scope.cart = CartService.getCurrentCart();
  $scope.items = CartService.getCurrentCartItems();
  $scope.recipesHistory = $localStorage.recipesHistory;

  UserInfoService.messageToDisplay().then(function(message){
    $scope.message = message;
  });
  $scope.hideMessage = function(){
    $scope.message.hide = true;
    $scope.message = null;
    UserInfoService.messageToDisplay().then(function(message){
      $scope.message = message;
    });
  };
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

.controller('CartCtrl', function($scope, CartService, FoodService, dataList){
  'use strict';
  $scope.cart = CartService.getCurrentCart();
  $scope.archiveCart = function(){
    if(window.confirm('Archiver cette liste ?')){
      CartService.archiveCart();
    }
  };

  $scope.ingredientSearch = {};
  $scope.foods = [];
  $scope.quantities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  $scope.units = dataList.quantityUnits;
  FoodService.getAll().then(function(foods){
    $scope.foods = foods;
  });

  $scope.selectedProduct = null;
  $scope.quantityMult = 1;
  $scope.quantityRound = 0;
  $scope.selectProduct = function(product){
    if(typeof product === 'string'){
      product = {
        id: getSlug(product),
        name: product,
        category: 'Inconnue'
      };
    }
    $scope.selectedProduct = {
      product: product
    };
  };
  $scope.unselectProduct = function(){
    $scope.selectedProduct = null;
    $scope.quantityMult = 1;
    $scope.quantityRound = 0;
  };
  $scope.increaseQuantityMult = function(){
    $scope.quantityMult = $scope.quantityMult * 10;
    $scope.quantityRound--;
  };
  $scope.decreaseQuantityMult = function(){
    $scope.quantityMult = $scope.quantityMult / 10;
    $scope.quantityRound++;
  };
  $scope.selectQuantity = function(quantity){
    $scope.selectedProduct.quantity = quantity;
  };
  $scope.selectUnit = function(unit){
    $scope.selectedProduct.unit = unit;
  };
  $scope.addSelectedProductToCart = function(){

    // TODO add product to cart
    $scope.selectedProduct = null
    $scope.quantityMult = 1;
    $scope.quantityRound = 0;
    $scope.ingredientSearch = {};
  };

  window.addEventListener('native.keyboardshow', function(e){
    //window.plugins.toast.show('SHOW keyboard');
  });
  window.addEventListener('native.keyboardhide', function(e){
    //window.plugins.toast.show('HIDE keyboard');
    $scope.ingredientSearch = {};
  });
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

  $scope.categoryId = function(food){
    return getSlug(food.category);
  };
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

.controller('FeedbackCtrl', function($scope, UserService, MailService){
  'use strict';
  var user = UserService.get();
  $scope.feedback = {
    mail: user.profile.mail,
    content: '',
    sending: false,
    sent: false
  };
  $scope.sendFeedback = function(){
    $scope.feedback.sending = true;
    MailService.sendFeedback($scope.feedback.mail, $scope.feedback.content).then(function(sent){
      $scope.feedback.sending = false;
      if(sent){
        $scope.feedback.sent = true;
      } else {
        window.alert('Echec de l\'envoi du mail. Réessayez !');
      }
    });
    if(!user.profile.mail){
      UserService.setMail($scope.feedback.mail);
    }
  };

  // UserVoice widget
  UserVoice.push(['set', {
    accent_color: '#e2753a',
    trigger_color: 'white',
    trigger_background_color: '#e2753a'
  }]);
  var identity = {};
  if(user && user.profile && user.profile.mail){identity.email = user.profile.mail;}
  if(user && user.profile && user.profile.name){identity.name = user.profile.name;}
  if(user && user.profile && user.profile.firstLaunch){identity.created_at = user.profile.firstLaunch/1000;}
  if(user && user.device && user.device.uuid){identity.id = user.device.uuid;}
  UserVoice.push(['identify', identity]);
  UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
  UserVoice.push(['autoprompt', {}]);
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
