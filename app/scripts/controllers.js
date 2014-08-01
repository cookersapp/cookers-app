angular.module('ionicApp')

.controller('IntroCtrl', function($scope, $state, $ionicPlatform, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var currentSlide = 0;
  $scope.profile = angular.copy(UserSrv.getProfile());

  $scope.startApp = function(){
    UserSrv.skipIntro(true);
    if(LoginSrv.isLogged()){
      $state.go('app.home');
    } else {
      $state.go('login');
    }
  };
  $scope.submitUserInfos = function(){
    LogSrv.trackSetMail($scope.profile.mail);
    UserSrv.setMail($scope.profile.mail, function(){
      LogSrv.registerUser();
    });
    UserSrv.setDefaultServings($scope.profile.defaultServings);
    $scope.startApp();
  };
  $scope.slideChanged = function(index){
    LogSrv.trackIntroChangeSlide(currentSlide, index);
    currentSlide = index;
  };
})

.controller('LoginCtrl', function($scope, $state, $rootScope, $firebase, $firebaseSimpleLogin, firebaseUrl, UserSrv, LoginSrv){
  'use strict';
  // TODO : redirect to login if not logged
  // TODO : manage message errors on login
  // TODO : real login with mail&pass
  // TODO : real login with facebook (get mail !)
  // TODO : real login with twitter (get mail !)
  
  /*// Get a reference to the Firebase
  var firebaseRef = new Firebase(firebaseUrl);
  // Create a Firebase Simple Login object
  $scope.auth = $firebaseSimpleLogin(firebaseRef);
  // Initially set no user to be logged in
  $scope.user = null;
  // Logs a user in with inputted provider
  $scope.login = function(provider) {
    console.log('login with', provider);
    $scope.auth.$login(provider);
  };
  // Logs a user out
  $scope.logout = function() {
    console.log('logout');
    $scope.auth.$logout();
  };
  // Upon successful login, set the user object
  $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
    console.log('$firebaseSimpleLogin:login', user);
    $scope.user = user;
  });
  // Upon successful logout, reset the user object
  $rootScope.$on("$firebaseSimpleLogin:logout", function(event) {
    console.log('$firebaseSimpleLogin:logout');
    $scope.user = null;
  });
  // Log any login-related errors to the console
  $rootScope.$on("$firebaseSimpleLogin:error", function(event, error) {
    console.log("Error logging user in: ", error);
  });*/
  
  $scope.credentials = {
    email: '',
    password: ''
  };

  $scope.goIntro = function(){
    UserSrv.skipIntro(false);
    $state.go('intro');
  };
  $scope.login = function(){
    LoginSrv.login($scope.credentials).then(function(){
      $state.go('app.home');
    });
  };
})

.controller('AppCtrl', function($rootScope, $scope, $state, $localStorage, $interval, $ionicSideMenuDelegate, RecipeSrv, UserSrv, LogSrv){
  'use strict';
  if($rootScope.showIntro){
    $rootScope.showIntro = false;
    $state.go('intro');
  }

  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.userProfile = UserSrv.getProfile();
  var recipesHistory = RecipeSrv.getHistory();

  $interval(function(){
    var historyLength = recipesHistory ? recipesHistory.length : 0;
    if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
      $scope.imageCover = recipesHistory[Math.floor(Math.random() * historyLength)].images.landing;
    } else {
      $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
    }
  }, 10000);

  $scope.$watch($ionicSideMenuDelegate.getOpenRatio, function(newValue, oldValue){
    if(newValue !== oldValue){
      if(newValue === 0){
        // close
      } else if(newValue === 1){
        // open
      } else {
        // opening ...
      }
    }
  });
})

.controller('HomeCtrl', function($scope, $timeout, $localStorage, GlobalMessageSrv, CartSrv, RecipeSrv, WeekrecipeSrv, LogSrv){
  'use strict';
  $scope.cart = CartSrv.getCurrentCart();
  $scope.items = CartSrv.getCurrentCartItems();
  $scope.recipesHistory = RecipeSrv.getHistory();
  $scope.favoriteRecipes = RecipeSrv.getFavorites();
  $scope.weekrecipes = [];
  $scope.standardMessage = null;
  $scope.stickyMessages = [];

  WeekrecipeSrv.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes;
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

.controller('RecipesCtrl', function($scope, WeekrecipeSrv, RecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.weekrecipes = [];
  WeekrecipeSrv.getCurrent().then(function(weekrecipes){
    $scope.weekrecipes = weekrecipes;
    $scope.loading = false;
  });

  $scope.cartHasRecipe = CartSrv.cartHasRecipe;

  $scope.toggleIngredients = function(recipe){
    recipe.showIngredients = !recipe.showIngredients;
  };
  $scope.addRecipeToCart = function(recipe, index){
    LogSrv.trackAddRecipeToCart(recipe.id, index, 'weekrecipes');
    CartSrv.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
    RecipeSrv.addToHistory(recipe);
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'weekrecipes');
    CartSrv.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };

  $scope.isFavorited = function(recipe){
    return RecipeSrv.isFavorite(recipe);
  };
  $scope.addToFavorite = function(recipe, index){
    LogSrv.trackAddRecipeToFavorite(recipe, index, 'weekrecipes');
    RecipeSrv.addToFavorite(recipe);
    RecipeSrv.addToHistory(recipe);
    window.plugins.toast.show('✔ ajoutée aux favoris');
  };
  $scope.removeFromFavorite = function(recipe, index){
    LogSrv.trackRemoveRecipeFromFavorite(recipe, index, 'weekrecipes');
    RecipeSrv.removeFromFavorite(recipe);
    window.plugins.toast.show('✔ supprimée des favoris');
  };
})

.controller('RecipeCtrl', function($scope, $stateParams, $localStorage, RecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.recipe = {};
  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    RecipeSrv.addToHistory(recipe);
    $scope.recipe = recipe;
  });

  /*$scope.cartHasRecipe = CartSrv.cartHasRecipe;

  $scope.addRecipeToCart = function(recipe){
    LogSrv.trackAddRecipeToCart(recipe.id, null, 'recipedetail');
    CartSrv.addRecipeToCart(recipe);
    window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'recipedetail');
    CartSrv.removeRecipeFromCart(recipe);
    window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };*/
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
  $scope.cart = CartSrv.getCurrentCart();
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
    var index = _.findIndex($scope.items, {food:{id: item.food.id}});
    var elt = $scope.items.splice(index, 1)[0];
    $scope.boughtItems.unshift(elt);
  };
  $scope.unbuyItem = function(item){
    LogSrv.trackUnbuyItem(item.food.id);
    CartSrv.unbuyCartItem(item);
    var index = _.findIndex($scope.boughtItems, {food:{id: item.food.id}});
    var elt = $scope.boughtItems.splice(index, 1)[0];
    $scope.items.unshift(elt);
  };

  // add product
  /*$scope.ingredientSearch = '';
  $scope.selectedProduct = null;
  $scope.quantityMult = 1;
  $scope.quantityRound = 0;

  $scope.foods = [];
  $scope.quantities = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  $scope.units = dataList.quantityUnits;

  FoodSrv.getAll().then(function(foods){
    $scope.foods = foods;
  });

  $scope.customItemsEdited = function(customItems){
    LogSrv.trackEditCartCustomItems(customItems);
  };

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
    LogSrv.trackAddItemToCart(item.product.id, item.quantity, item.unit, item.product.category === 'Inconnue', $scope.ingredientSearch);
    CartSrv.addCustomItemToCart(item);
    updateCart();
    window.plugins.toast.showShortTop('✔ ingrédient ajouté à la liste de courses');
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

  function resetAddIngredient(){
    resetProduct();
    $scope.ingredientSearch = '';
  }
  function resetProduct(){
    $scope.selectedProduct = null;
    $scope.quantityMult = 1;
    $scope.quantityRound = 0;
  }

  function updateCart(){
    // TODO : don't create new lists, update them
    $scope.items = CartSrv.getCurrentCartItems();
    $scope.boughtItems = CartSrv.getCurrentCartBoughtItems();
  }*/
})

.controller('ProfileCtrl', function($scope, $state, $localStorage, localStorageDefault, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var user = UserSrv.get();

  var covers = [
    'images/profile-covers/cover01.jpg',
    'images/profile-covers/cover02.jpg',
    'images/profile-covers/cover03.jpg',
    'images/profile-covers/cover04.jpg',
    'images/profile-covers/cover05.jpg',
    'images/profile-covers/cover06.jpg',
    'images/profile-covers/cover07.jpg',
    'images/profile-covers/cover08.jpg',
    'images/profile-covers/cover09.jpg',
    'images/profile-covers/cover10.jpg',
    'images/profile-covers/cover11.jpg',
    'images/profile-covers/cover12.jpg',
    'images/profile-covers/cover13.jpg',
    'images/profile-covers/cover14.jpg',
    'images/profile-covers/cover15.jpg',
    'images/profile-covers/cover16.jpg',
    'images/profile-covers/cover17.jpg',
    'images/profile-covers/cover18.jpg',
    'images/profile-covers/cover19.jpg',
    'images/profile-covers/cover20.jpg',
    'images/profile-covers/cover21.jpg',
    'images/profile-covers/cover22.jpg',
    'images/profile-covers/cover23.jpg',
    'images/profile-covers/cover24.jpg'
  ];
  if(!gravatarCoverIsInCovers(user, covers) && getGravatarCover(user)){ covers.unshift(getGravatarCover(user)); }
  var currentCover = -1;
  $scope.changeCover = function(){
    currentCover = (currentCover+1)%covers.length;
    user.profile.backgroundCover = covers[currentCover];
    LogSrv.trackChangeSetting('profileCover', user.profile.backgroundCover);
    LogSrv.registerUser();
  };

  $scope.mail = angular.copy(user.profile.mail);
  $scope.saveMail = function(mail){
    LogSrv.trackSetMail(mail);
    UserSrv.setMail(mail, function(){
      LogSrv.registerUser();
    });
  };
  $scope.about = function(){
    window.alert('Not implemented yet :(');
  };

  $scope.clearCache = function(){
    if(window.confirm('Vider le cache ?')){
      $localStorage.foods = localStorageDefault.foods;
      $localStorage.recipes = localStorageDefault.recipes;
      $localStorage.weekrecipes = localStorageDefault.weekrecipes;
    }
  };
  $scope.logout = function(){
    LoginSrv.logout().then(function(){
      $state.go('login');
    });
  };
  $scope.resetApp = function(){
    if(window.confirm('Réinitialiser complètement l\'application ?')){
      LogSrv.trackClearApp(user.device.uuid);
      $localStorage.$reset(localStorageDefault);
      if(navigator.app){
        navigator.app.exitApp();
      } else if(navigator.device){
        navigator.device.exitApp();
      }
    }
  };

  $scope.$watch('settings.showPrices', function(newValue, oldValue){
    if(newValue !== oldValue){
      LogSrv.trackChangeSetting('showPrices', newValue);
      LogSrv.registerUser();
    }
  });
  $scope.$watch('settings.bigImages', function(newValue, oldValue){
    if(newValue !== oldValue){
      LogSrv.trackChangeSetting('bigImages', newValue);
      LogSrv.registerUser();
    }
  });
  /*$scope.$watch('settings.strictIngredients', function(newValue, oldValue){
    if(newValue !== oldValue){
      LogSrv.trackChangeSetting('strictIngredients', newValue);
      LogSrv.registerUser();
    }
  });*/

  function gravatarCoverIsInCovers(user, covers){
    var gravatarCover = getGravatarCover(user);
    if(gravatarCover && _.find(covers, function(cover){return cover === gravatarCover;}) !== undefined){
      return true;
    }
    return false;
  }
  function getGravatarCover(user){
    if(user &&
       user.gravatar &&
       user.gravatar.entry &&
       user.gravatar.entry.length > 0 &&
       user.gravatar.entry[0].profileBackground &&
       user.gravatar.entry[0].profileBackground.url){
      return user.gravatar.entry[0].profileBackground.url;
    }
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
      LogSrv.trackSetMail($scope.feedback.mail);
      UserSrv.setMail($scope.feedback.mail, function(){
        LogSrv.registerUser();
      });
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

.controller('DebugCtrl', function($scope, $localStorage){
  'use strict';
  $scope.$storage = $localStorage;
});
