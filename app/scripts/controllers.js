angular.module('app')

.controller('IntroCtrl', function($scope, $state, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var currentSlide = 0;

  $scope.startApp = function(){
    LogSrv.trackIntroExit(currentSlide);
    UserSrv.get().skipIntro = true;
    if(LoginSrv.isLogged()){
      $state.go('app.home');
    } else {
      $state.go('login');
    }
  };
  
  $scope.slideChanged = function(index){
    LogSrv.trackIntroChangeSlide(currentSlide, index);
    currentSlide = index;
  };
})

.controller('LoginCtrl', function($scope, $state, $window, $ionicPopup, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var sUser = UserSrv.get();

  $scope.credentials = {
    dismissed: false,
    email: '',
    password: ''
  };

  $scope.loading = {
    facebook: false,
    twitter: false,
    google: false,
    email: false
  };

  $scope.goIntro = function(){
    sUser.skipIntro = false;
    $state.go('intro');
  };

  $scope.facebookConnect = function(){ connect('facebook'); };
  $scope.twitterConnect = function(){ connect('twitter'); };
  $scope.googleConnect = function(){ connect('google'); };
  $scope.emailConnect = function(tab){ connect('email', tab); };

  function connect(provider, tab){
    $scope.loading[provider] = true;
    var promise;

    if(provider === 'facebook'){ promise = LoginSrv.facebookConnect(); }
    if(provider === 'twitter'){ promise = LoginSrv.twitterConnect(); }
    if(provider === 'google'){ promise = LoginSrv.googleConnect(); }
    else if(provider === 'email' && tab && tab === 'login'){ promise = LoginSrv.login($scope.credentials); }
    else if(provider === 'email' && tab && tab !== 'login'){ promise = LoginSrv.register($scope.credentials); }

    if(promise){
      promise.then(function(user){
        if(UserSrv.hasMail()){
          loginSuccess(provider, user);
        } else {
          $ionicPopup.show(emailPopup).then(function(email){
            UserSrv.setEmail(email);
            loginSuccess(provider, user);
          });
        }
      }, function(error){
        LogSrv.trackError('login:'+provider, error);
        $scope.loading[provider] = false;
        $window.plugins.toast.show(LoginSrv.getMessage(error));
      });
    } else {
      $scope.loading[provider] = false;
    }
  }

  function loginSuccess(provider, user){
    $scope.loading[provider] = false;
    // TODO : send welcome mail if first time !
    LogSrv.trackLogin(provider, user);
    $state.go('app.home');
  }

  var emailPopup = {
    template: '<input type="email" placeholder="ex: nom@example.com" ng-model="credentials.email" required>',
    title: '<i class="fa fa-smile-o"></i> Lâche ton mail &nbsp;<i class="fa fa-smile-o"></i>',
    subTitle: '!! No spam guaranteed !!',
    scope: $scope,
    buttons: [
      { text: 'Non !', onTap: function(e){
        if(!$scope.credentials.dismissed){
          $window.plugins.toast.show('S\'il-te-plaît ...');
          $scope.credentials.dismissed = true;
          e.preventDefault();
        } else {
          return '';
        }
      }},
      { text: '<b>Voilà !</b>', type: 'button-positive', onTap: function(e){
        if(!$scope.credentials.email){
          e.preventDefault();
        } else {
          $window.plugins.toast.show('Merci :D');
          return $scope.credentials.email;
        }
      }}
    ]
  };
})

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

.controller('HomeCtrl', function($scope, $timeout, GlobalMessageSrv, CartSrv2, RecipeSrv, WeekrecipeSrv, LogSrv){
  'use strict';
  $scope.recipesInCart = CartSrv2.recipesFromOpenedCarts();
  $scope.itemsInCart = CartSrv2.itemsFromOpenedCarts();
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

.controller('RecipesCtrl', function($localStorage, $rootScope, $scope, $state, $window, $ionicPopup, WeekrecipeSrv, RecipeSrv, CartSrv2, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.recipesOfWeek = {};
  WeekrecipeSrv.getCurrent().then(function(recipesOfWeek){
    $scope.recipesOfWeek = recipesOfWeek;
    $scope.loading = false;
  });
  
  var cart = CartSrv2.hasOpenedCarts() ? CartSrv2.getOpenedCarts()[0] : CartSrv2.createCart();

  $scope.cartHasRecipe = function(recipe){
    return CartSrv2.hasRecipe(cart, recipe);
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
        CartSrv2.addRecipe(cart, recipe, servings);
        $window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
        RecipeSrv.addToHistory(recipe);
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'weekrecipes');
    CartSrv2.removeRecipe(cart, recipe);
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
})

.controller('CartCtrl', function($scope, $window, CartSrv2, LogSrv){
  'use strict';
  // TODO : add $ionicPopover for more options (rename, archive, switch...)
  $scope.cart = CartSrv2.hasOpenedCarts() ? CartSrv2.getOpenedCarts()[0] : CartSrv2.createCart();
  $scope.archiveCart = function(){
    if($window.confirm('Archiver cette liste ?')){
      LogSrv.trackArchiveCart();
      CartSrv2.archive($scope.cart);
      // TODO : what to do now ???
    }
  };
})

.controller('CartRecipesCtrl', function($scope, $window, CartSrv2, LogSrv){
  'use strict';
  $scope.cart = CartSrv2.hasOpenedCarts() ? CartSrv2.getOpenedCarts()[0] : CartSrv2.createCart();
  $scope.selectedRecipe;

  $scope.ingredientBoughtPc = function(recipe){
    // TODO : this method is call 4 times by recipe... It's highly inefficient... Must fix !!!
    if(recipe && recipe.ingredients && recipe.ingredients.length > 0){
      var ingredientBought = 0;
      for(var i in recipe.ingredients){
        if(recipe.ingredients[i].bought){
          ingredientBought++;
        }
      }
      return 100 * ingredientBought / recipe.ingredients.length;
    } else {
      return 100;
    }
  };

  $scope.toggleRecipe = function(recipe){
    if($scope.selectedRecipe === recipe){
      LogSrv.trackCartRecipeDetails(recipe.id, 'hide');
      $scope.selectedRecipe = null;
    } else {
      LogSrv.trackCartRecipeDetails(recipe.id, 'show');
      $scope.selectedRecipe = recipe;
    }
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'cart');
    CartSrv2.removeRecipe(cart, recipe);
    $window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CartIngredientsCtrl', function($scope, CartSrv2, FoodSrv, FirebaseSrv, dataList, LogSrv){
  'use strict';
  var cart = CartSrv2.hasOpenedCarts() ? CartSrv2.getOpenedCarts()[0] : CartSrv2.createCart();
  
  $scope.openedItems = [];
  $scope.customItems = cart.customItems;
  $scope.items = CartSrv2.getItems(cart);

  $scope.customItemsEdited = function(customItems){
    cart.customItems = customItems;
    LogSrv.trackEditCartCustomItems(customItems);
  };

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
  
  $scope.allItemsBought = function(){
    var boughtItems = _.filter($scope.items, function(item){
      return $scope.isBought(item);
    });
    return $scope.items.length > 0 && $scope.items.length === boughtItems.length;
  };
  $scope.isBought = function(item){
    var bought = true;
    angular.forEach(item.sources, function(source){
      if(!source.ingredient.bought){bought = false;}
    });
    return bought;
  };
  $scope.buyItem = function(item){
    LogSrv.trackBuyItem(item.food.id);
    CartSrv2.buyItem(cart, item);
  };
  $scope.unbuyItem = function(item){
    LogSrv.trackUnbuyItem(item.food.id);
    CartSrv2.unbuyItem(cart, item);
  };
})

.controller('ProfileCtrl', function($scope, $state, $window, StorageSrv, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var sUser = UserSrv.get();

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
  if(!gravatarCoverIsInCovers(sUser, covers) && getGravatarCover(sUser)){ covers.unshift(getGravatarCover(sUser)); }
  var currentCover = -1;
  $scope.changeCover = function(){
    currentCover = (currentCover+1)%covers.length;
    sUser.backgroundCover = covers[currentCover];
    LogSrv.trackChangeSetting('profileCover', sUser.backgroundCover);
    LogSrv.registerUser();
  };

  $scope.clearCache = function(){
    if($window.confirm('Vider le cache ?')){
      LogSrv.trackClearCache(sUser.device.uuid);
      StorageSrv.clearCache();
    }
  };
  $scope.logout = function(){
    LoginSrv.logout().then(function(){
      LogSrv.trackLogout(sUser.device.uuid);
      $state.go('login');
    });
  };
  $scope.resetApp = function(){
    if($window.confirm('Réinitialiser complètement l\'application ?')){
      LogSrv.trackClearApp(sUser.device.uuid);
      StorageSrv.clear();
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

  function gravatarCoverIsInCovers(user, covers){
    var gravatarCover = getGravatarCover(user);
    if(gravatarCover && _.find(covers, function(cover){return cover === gravatarCover;}) !== undefined){
      return true;
    }
    return false;
  }
  function getGravatarCover(user){
    if(user &&
       user.profiles &&
       user.profiles.gravatar &&
       user.profiles.gravatar.entry &&
       user.profiles.gravatar.entry.length > 0 &&
       user.profiles.gravatar.entry[0].profileBackground &&
       user.profiles.gravatar.entry[0].profileBackground.url){
      return user.profiles.gravatar.entry[0].profileBackground.url;
    }
  }
})

.controller('FeedbackCtrl', function($scope, $stateParams, $window, AppSrv, UserSrv, EmailSrv, LogSrv){
  'use strict';
  var sApp = AppSrv.get();
  var sUser = UserSrv.get();
  $scope.feedback = {
    email: sUser.email,
    content: '',
    sending: false,
    sent: false
  };
  
  if($stateParams.source){
    if($stateParams.source === 'recipes-rating-1'){$scope.feedback.content = 'Bof bof bof... Tiens quelques conseils !\n\nJe serais plus fan de ...';}
    else if($stateParams.source === 'recipes-rating-2'){$scope.feedback.content = 'Plutôt cool tes recettes !\n\nJe verrais bien un peu plus ... ou un peu moins de ...';}
    else if($stateParams.source === 'recipes-rating-3'){$scope.feedback.content = 'Wahou c\'est top !\n\nEt ça serait encore mieux si tu pouvais ...';}
  }

  $scope.sendFeedback = function(){
    $scope.feedback.sending = true;
    LogSrv.trackSendFeedback($scope.feedback.email);
    EmailSrv.sendFeedback($scope.feedback.email, $scope.feedback.content).then(function(sent){
      $scope.feedback.sending = false;
      if(sent){
        $scope.feedback.sent = true;
      } else {
        $window.alert('Echec de l\'envoi du email. Réessayez !');
      }
    });
    if(sUser.email !== $scope.feedback.email){
      LogSrv.trackSetEmail($scope.feedback.email);
      UserSrv.setEmail($scope.feedback.email).then(function(){
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
  if(sUser && sUser.email){identity.email = sUser.email;}
  if(sUser && sUser.name){identity.name = sUser.name;}
  if(sApp && sApp.firstLaunch){identity.created_at = sApp.firstLaunch/1000;}
  if(sUser && sUser.device && sUser.device.uuid){identity.id = sUser.device.uuid;}
  UserVoice.push(['identify', identity]);
  UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
  UserVoice.push(['autoprompt', {}]);
});
