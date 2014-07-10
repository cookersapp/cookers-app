angular.module('ionicApp')

.controller('IntroCtrl', function($scope, $state, $ionicPlatform, UserSrv, LogSrv){
  'use strict';
  var currentSlide = 0;
  $scope.profile = angular.copy(UserSrv.getProfile());

  $scope.startApp = function(){
    $state.go('app.home');
  };
  $scope.submitUserInfos = function(){
    UserSrv.setMail($scope.profile.mail);
    UserSrv.setDefaultServings($scope.profile.defaultServings);
    $scope.startApp();
  };
  $scope.slideChanged = function(index){
    LogSrv.trackIntroChangeSlide(currentSlide, index);
    currentSlide = index;
  };
})

.controller('AppCtrl', function($rootScope, $scope, $state, $localStorage, $interval, $ionicSideMenuDelegate, UserSrv, LogSrv){
  'use strict';
  if($rootScope.showIntro){
    $rootScope.showIntro = false;
    $state.go('intro');
  }

  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.userProfile = UserSrv.getProfile();

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

  $scope.$watch($ionicSideMenuDelegate.getOpenRatio, function(newValue, oldValue){
    if(newValue !== oldValue){
      if(newValue === 0){
        LogSrv.trackToggleMenu('close');
      } else if(newValue === 1){
        LogSrv.trackToggleMenu('open');
      }
    }
  });
})

.controller('HomeCtrl', function($scope, $localStorage, UserInfoSrv, CartSrv, LogSrv){
  'use strict';
  $scope.message = null;
  $scope.cart = CartSrv.getCurrentCart();
  $scope.items = CartSrv.getCurrentCartItems();
  $scope.recipesHistory = $localStorage.recipesHistory;

  UserInfoSrv.messageToDisplay().then(function(message){
    $scope.message = message;
  });
  $scope.hideMessage = function(){
    LogSrv.trackCloseMessageInfo($scope.message.id);
    $scope.message.hide = true;
    $scope.message = null;
    UserInfoSrv.messageToDisplay().then(function(message){
      $scope.message = message;
    });
  };
})

.controller('RecipesCtrl', function($scope, WeekrecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.weekrecipes = [];
  WeekrecipeSrv.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes;
    $scope.loading = false;
  });

  $scope.cartHasRecipe = CartSrv.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe, index){
    LogSrv.trackAddRecipeToCart(recipe.id, index, 'weekrecipes');
    CartSrv.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'weekrecipes');
    CartSrv.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('Recipes2Ctrl', function($scope, WeekrecipeSrv, CartSrv){
  'use strict';
  var recipesToAdd = [];
  $scope.weekrecipes = [];
  $scope.recipes = [];
  $scope.loading = true;

  WeekrecipeSrv.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes.recipes;
    recipesToAdd = _.filter(weekrecipes.recipes, function(recipe){
      return !CartSrv.cartHasRecipe(recipe);
    });
    $scope.cardSwiped();
    $scope.loading = false;
  });

  $scope.cardSwiped = function(recipe){
    if(recipe){
      if(!CartSrv.cartHasRecipe(recipe)){
        recipesToAdd.push(recipe);
      }
    }

    if(recipesToAdd.length > 0){
      var newRecipe = recipesToAdd.splice(0, 1)[0];
      $scope.recipes.push(angular.copy(newRecipe));
    }
  };
})

.controller('RecipeCardCtrl', function($scope, $ionicSwipeCardDelegate, CartSrv){
  'use strict';
  $scope.goAway = function(){
    var card = $ionicSwipeCardDelegate.getSwipebleCard($scope);
    card.swipe();
  };

  $scope.addRecipeToCart = function(recipe){
    CartSrv.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
    $scope.goAway();
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, $localStorage, RecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.recipe = {};
  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    _.remove($localStorage.recipesHistory, {id: recipe.id});
    $localStorage.recipesHistory.unshift(recipe);
    $scope.recipe = recipe;
  });

  $scope.cartHasRecipe = CartSrv.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    LogSrv.trackAddRecipeToCart(recipe.id, null, 'recipedetail');
    CartSrv.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'recipedetail');
    CartSrv.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CartCtrl', function($scope, CartSrv, LogSrv){
  'use strict';
  $scope.cart = CartSrv.getCurrentCart();
  $scope.archiveCart = function(){
    if(window.confirm('Archiver cette liste ?')){
      LogSrv.trackArchiveCart();
      CartSrv.archiveCart();
    }
  };
})

.controller('CartRecipesCtrl', function($scope, CartSrv, LogSrv){
  'use strict';
  $scope.cart = CartSrv.getCurrentCart();

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

  $scope.toggleRecipe = function(recipe){
    LogSrv.trackCartRecipeDetails(recipe.id, recipe.selected ? 'hide' : 'show');
    recipe.selected=!recipe.selected;
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'cart');
    CartSrv.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CartIngredientsCtrl', function($scope, CartSrv, FoodSrv, FirebaseSrv, dataList, LogSrv){
  'use strict';
  $scope.openedItems = [];
  $scope.items = CartSrv.getCurrentCartItems();
  $scope.boughtItems = CartSrv.getCurrentCartBoughtItems();

  $scope.categoryId = function(food){
    return getSlug(food.category);
  };
  $scope.isOpened = function(item){
    return _.findIndex($scope.openedItems, {food: {id: item.food.id}}) > -1;
  };
  $scope.toggleItem = function(item){
    var index = _.findIndex($scope.openedItems, {food: {id: item.food.id}});
    LogSrv.trackCartItemDetails(item.food.id, index > -1 ? 'hide' : 'show');
    if(index > -1){$scope.openedItems.splice(index, 1);}
    else {$scope.openedItems.push(item);}
  };
  $scope.buyItem = function(item){
    LogSrv.trackBuyItem(item.food.id);
    CartSrv.buyCartItem(item);
    updateCart();
  };
  $scope.buySource = function(source, item){
    LogSrv.trackBuyItemSource(item.food.id, source.recipe ? source.recipe.id : null);
    CartSrv.buyCartItemSource(source, item);
    updateCart();
  };
  $scope.unbuyItem = function(item){
    LogSrv.trackUnbuyItem(item.food.id);
    CartSrv.unbuyCartItem(item);
    updateCart();
  };

  // add product
  $scope.ingredientSearch = {};
  $scope.selectedProduct = null;
  $scope.quantityMult = 1;
  $scope.quantityRound = 0;

  $scope.foods = [];
  $scope.quantities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  $scope.units = dataList.quantityUnits;

  FoodSrv.getAll().then(function(foods){
    $scope.foods = foods;
  });

  $scope.selectProduct = function(product){
    if(typeof product === 'string'){
      product = {
        id: getSlug(product),
        name: product,
        category: 'Inconnue'
      };
      FirebaseSrv.push('/missing/food', product);
    }
    $scope.selectedProduct = {
      product: product
    };
  };
  $scope.unselectProduct = function(){
    resetProduct();
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
    var item = $scope.selectedProduct;
    LogSrv.trackAddItemToCart(item.product.id, item.quantity, item.unit, item.product.category === 'Inconnue', $scope.ingredientSearch.name);
    CartSrv.addCustomItemToCart(item);
    updateCart();
    window.plugins.toast.show('✔ ingrédient ajouté à la liste de courses');
    resetAddIngredient();
  };
  $scope.removeCartItemSource = function(item){
    LogSrv.trackRemoveItemFromCart(item.ingredient.id);
    CartSrv.removeCustomItemFromCart(item);
    updateCart();
    window.plugins.toast.show('✔ ingrédient supprimé de la liste de courses');
  };

  window.addEventListener('native.keyboardhide', function(e){
    resetAddIngredient();
  });

  function resetProduct(){
    $scope.selectedProduct = null;
    $scope.quantityMult = 1;
    $scope.quantityRound = 0;
  }
  function resetAddIngredient(){
    resetProduct();
    $scope.ingredientSearch = {};
  }

  function updateCart(){
    // TODO : don't create new lists, update them
    $scope.items = CartSrv.getCurrentCartItems();
    $scope.boughtItems = CartSrv.getCurrentCartBoughtItems();
  }
})

.controller('FeedbackCtrl', function($scope, UserSrv, MailSrv, LogSrv){
  'use strict';
  var user = UserSrv.get();
  $scope.feedback = {
    mail: user.profile.mail,
    content: '',
    sending: false,
    sent: false
  };
  
  $scope.sendFeedback = function(){
    $scope.feedback.sending = true;
    LogSrv.trackSendFeedback($scope.feedback.mail);
    MailSrv.sendFeedback($scope.feedback.mail, $scope.feedback.content).then(function(sent){
      $scope.feedback.sending = false;
      if(sent){
        $scope.feedback.sent = true;
      } else {
        window.alert('Echec de l\'envoi du mail. Réessayez !');
      }
    });
    if(user.profile.mail !== $scope.feedback.mail){
      UserSrv.setMail($scope.feedback.mail);
    }
  };
  $scope.openUservoice = function(){
    LogSrv.trackOpenUservoice();
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
