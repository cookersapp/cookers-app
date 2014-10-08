angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.recipes', {
    url: '/recipes',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/recipes.html',
        controller: 'RecipesCtrl'
      }
    }
  })
  .state('app.recipe', {
    url: '/recipe/:recipeId?recipeIndex',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/recipe.html',
        controller: 'RecipeCtrl'
      }
    }
  })
  .state('app.cook', {
    url: '/cook/:cartId/:recipeId',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/cook.html',
        controller: 'CookCtrl'
      }
    },
    data: {
      noSleep: true
    }
  })
  .state('app.tocook', {
    url: '/tocook',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/tocook.html',
        controller: 'TocookCtrl'
      }
    }
  })
  .state('app.cooked', {
    url: '/cooked',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/cooked.html',
        controller: 'CookedCtrl'
      }
    }
  });
})

.controller('RecipesCtrl', function($rootScope, $scope, $state, PopupSrv, SelectionSrv, StorageSrv, CartSrv, ToastSrv, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.recipeShowIngredients = null;
  var cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();

  SelectionSrv.getCurrent().then(function(selection){
    if(selection && selection.recipes){
      for(var i in selection.recipes){
        var recipe = selection.recipes[i];
        if(!recipe.$formated){recipe.$formated = {};}
        recipe.$formated.isInCart = CartSrv.hasRecipe(cart, recipe);
      }
      userShiftRecipes(selection.recipes, StorageSrv.getUserSetting('recipeShiftOffset'));
    }
    $scope.selection = selection;
    $scope.loading = false;
  });

  $scope.toggleIngredients = function(recipe, index){
    if($scope.recipeShowIngredients === recipe){$scope.recipeShowIngredients = null;}
    else {
      $scope.recipeShowIngredients = recipe;
      LogSrv.trackShowRecipeIngredients(recipe.id, index);
    }
  };
  $scope.addRecipeToCart = function(recipe, index){
    PopupSrv.changeServings($rootScope.ctx.settings.defaultServings, recipe.name).then(function(servings){
      if(servings){
        LogSrv.trackAddRecipeToCart(recipe.id, index);
        $rootScope.ctx.settings.defaultServings = servings;
        StorageSrv.saveUserSetting('defaultServings', servings);
        CartSrv.addRecipe(cart, recipe, servings);
        recipe.$formated.isInCart = true;
        ToastSrv.show('✔ recette ajoutée à la liste de courses');
        StorageSrv.addRecipeToHistory(recipe);
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'selection');
    CartSrv.removeRecipe(cart, recipe);
    recipe.$formated.isInCart = false;
    ToastSrv.show('✔ recette supprimée de la liste de courses');
  };

  $scope.recipeFeedback = function(feedback){
    LogSrv.trackRecipesFeedback($scope.selection.week, feedback);
    $state.go('app.feedback', {source: 'recipes-rating-'+feedback});
  };

  function userShiftRecipes(recipes, shiftOffset){
    if(Array.isArray(recipes)){
      for(var i=0; i<shiftOffset; i++){
        recipes.push(recipes.shift());
      }
    }
  }
})

.controller('RecipeCtrl', function($rootScope, $scope, $stateParams, CartSrv, StorageSrv, BackendSrv, PopupSrv, ToastSrv, LogSrv){
  'use strict';
  var recipeId = $stateParams.recipeId;
  var recipeIndex = $stateParams.recipeIndex;
  var cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();
  LogSrv.trackShowRecipeDetails(recipeId, recipeIndex);
  BackendSrv.getRecipe(recipeId).then(function(recipe){
    StorageSrv.addRecipeToHistory(recipe);
    if(!recipe.$formated){recipe.$formated = {};}
    recipe.$formated.isInCart = CartSrv.hasRecipe(cart, recipe);
    $scope.recipe = recipe;
  });

  $scope.addRecipeToCart = function(recipe){
    PopupSrv.changeServings($rootScope.ctx.settings.defaultServings, recipe.name).then(function(servings){
      if(servings){
        LogSrv.trackAddRecipeToCart(recipe.id, recipeIndex);
        $rootScope.ctx.settings.defaultServings = servings;
        StorageSrv.saveUserSetting('defaultServings', servings);
        CartSrv.addRecipe(cart, recipe, servings);
        recipe.$formated.isInCart = true;
        ToastSrv.show('✔ recette ajoutée à la liste de courses');
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'recipe');
    CartSrv.removeRecipe(cart, recipe);
    recipe.$formated.isInCart = false;
    ToastSrv.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CookCtrl', function($scope, $state, $stateParams, $window, CartSrv, StorageSrv, BackendSrv, PopupSrv, ToastSrv, LogSrv, Utils){
  'use strict';
  // TODO : vocal commands : should go to next step when knock knock (speech recognition)
  // TODO : visibe timers : should stick active timers on top (or bottom?) of screen if you scroll
  var cartId = $stateParams.cartId;
  var recipeId = $stateParams.recipeId;
  var startTime, timer = null;
  $scope.timer = 0;
  LogSrv.trackShowRecipeCook(recipeId);

  if(cartId === 'none'){
    BackendSrv.getRecipe(recipeId).then(function(recipe){
      initData(recipe);
    });
  } else {
    initData(CartSrv.getCartRecipe(cartId, recipeId));
  }

  function initData(recipe){
    if(recipe){
      $scope.recipe = recipe;
      StorageSrv.addRecipeToHistory($scope.recipe);
      $scope.servings = $scope.recipe.cartData ? $scope.recipe.cartData.servings.value : $scope.recipe.servings.value;
      $scope.servingsAdjust = $scope.servings / $scope.recipe.servings.value;
      $scope.timer = moment.duration($scope.recipe.time.eat, 'minutes').asSeconds();

      var user = StorageSrv.getUser();
      if(user && user.data && user.data.skipCookFeatures){
        startTimer();
      } else {
        PopupSrv.tourCookFeatures().then(function(){
          StorageSrv.saveUserSetting('skipCookFeatures', true);
          startTimer();
        });
      }
    } else {
      LogSrv.trackError('notFoundCookRecipe', {
        message: 'Unable to find cook recipe !',
        cartId: cartId,
        recipeId: recipeId
      });
      $window.alert('Error: forbidden action !\nCan\'t cook recipe from '+cartId+'/'+recipeId+' !\nPlease contact loicknuchel@gmail.com !');
    }
  }

  $scope.changeServings = function(){
    PopupSrv.changeServings($scope.servings).then(function(servings){
      if(servings){
        $scope.servings = servings;
        $scope.servingsAdjust = $scope.servings / $scope.recipe.servings.value;
      }
    });
  };

  $scope.done = function(){
    stopTimer();
    var minCookDuration = 60;
    var cookDuration = (Date.now() - startTime)/1000;
    if(cookDuration < minCookDuration){
      $window.history.back();
      ToastSrv.show('T\'as pas cuisiné, avoue ! ;)');
    } else {
      LogSrv.trackRecipeCooked($scope.recipe.id, cookDuration);
      addToCookedRecipes(cartId, $scope.recipe, $scope.servings, cookDuration);

      PopupSrv.recipeCooked().then(function(shouldExit){
        if(shouldExit){
          Utils.exitApp();
        } else {
          $state.go('app.home');
        }
      });
    }
  };

  $scope.$on('$destroy', function(){
    stopTimer();
  });

  function addToCookedRecipes(cartId, recipe, servings, cookDuration){
    if(recipe && recipe.cartData){
      recipe.cartData.cooked = {
        time: Date.now(),
        duration: cookDuration
      };
      CartSrv.updateCartRecipe(recipe);
    } else {
      var recipeToSave = angular.copy(recipe);
      recipeToSave.cartData = {
        cooked: {
          time: Date.now(),
          duration: cookDuration
        },
        servings: {
          value: servings,
          unit: recipeToSave.servings.unit
        }
      };
      CartSrv.addStandaloneCookedRecipe(recipeToSave);
    }
  }

  function startTimer(){
    startTime = Date.now();
    timer = Utils.clock(function(){
      $scope.timer--;
    });
    $scope.$on('$destroy', function(){
      stopTimer();
    });
  }
  function stopTimer(){
    if(timer !== null){
      Utils.cancelClock(timer);
      timer = null;
    }
  }
})

.controller('TocookCtrl', function($scope, $window, PopupSrv, CartSrv){
  'use strict';
  $scope.recipes = CartSrv.getRecipesToCook(function(a, b){
    var ret = -(a.cartData.boughtPc - b.cartData.boughtPc);
    return ret === 0 ? -(a.cartData.created - b.cartData.created) : ret;
  });

  $scope.changeServings = function(recipe){
    PopupSrv.changeServings($scope.servings).then(function(servings){
      if(servings){
        recipe.cartData.servings.value = servings;
        CartSrv.updateCartRecipe(recipe);
      }
    });
  };

  $scope.remove = function(recipe){
    if($window.confirm('Ne plus cuisiner cette recette ?')){
      recipe.cartData.cooked = 'none';
      CartSrv.updateCartRecipe(recipe);
      $scope.recipes.splice($scope.recipes.indexOf(recipe), 1);
    }
  };
})

.controller('CookedCtrl', function($scope, CartSrv){
  'use strict';
  $scope.recipes = CartSrv.getCookedRecipes(function(a, b){
    return -(a.cartData.cooked.time - b.cartData.cooked.time);
  });
})

.factory('SelectionSrv', function(StorageSrv, BackendSrv, debug){
  'use strict';
  var service = {
    getCurrent: function(){ return BackendSrv.getSelection(moment().week()+(debug ? 1 : 0)); }
  };

  return service;
})

.directive('cookTimer', function($timeout, $ionicScrollDelegate, MediaSrv, Utils){
  'use strict';
  var nearInterval = 60;

  function getParams(scope){
    if(scope.pData){return angular.copy(scope.pData);}
    else if(scope.pSteps){
      return {
        color: scope.pColor,
        label: scope.pLabel,
        steps: angular.copy(scope.pSteps)
      };
    } else {
      return {
        color: scope.pColor,
        label: scope.pLabel,
        seconds: scope.pSeconds
      };
    }
  }

  return {
    restrict: 'E',
    templateUrl: 'scripts/recipe/timer.html',
    scope: {
      pData: '=data',
      pColor: '=color',
      pLabel: '=label',
      pSeconds: '=seconds',
      pSteps: '=steps'
    },
    link: function(scope, element, attrs){
      var scrollDelegate = $ionicScrollDelegate.$getByHandle('cookScroll');
      var timer = getParams(scope);
      timer.duration = null;
      timer.clock = null;
      timer.alarm = false;
      timer.media = null;
      timer.scroll = null;
      scope.timer = timer;
      MediaSrv.loadTimerAlarm(restartAlarm).then(function(media){
        timer.media = media;
      });

      scope.time = 0;
      if(timer.steps && timer.steps.length > 0){
        var lastStep = timer.steps[timer.steps.length-1];
        timer.duration = lastStep.time ? lastStep.time : 0;
      } else {
        timer.duration = timer.seconds ? timer.seconds : 0;
      }

      scope.isSelected = function(step){
        return step.time - (nearInterval/2) <= scope.time && scope.time < step.time + (nearInterval/2);
      };
      scope.isUnselected = function(step){
        return scope.time >= step.time + (nearInterval/2);
      };

      scope.timerClick = function(){
        if(timer.alarm === true){stopAlarm();}
        else if(timer.clock !== null){stopTimer();}
        else {startTimer();}
      };

      // clean alarms if leave view
      scope.$on('$destroy', function(){
        stopTimer();
        stopAlarm();
      });


      function startTimer(){
        timer.scroll = scrollDelegate.getScrollPosition();
        timer.clock = Utils.clock(function(){
          if(timer.duration - scope.time > 0){
            scope.time++;

            if(timer.duration === scope.time+(nearInterval/2)){timerNearlyEnds();}
            else if(timer.duration === scope.time){timerEnds();}
            else if(timer.steps){
              for(var i in timer.steps){
                if(timer.steps[i].time === scope.time+(nearInterval/2)){stepNearlyReached(timer.steps[i]);}
                if(timer.steps[i].time === scope.time){stepReached(timer.steps[i]);}
              }
            }
          } else {
            stopTimer();
          }
        });
      }
      function stopTimer(){
        Utils.cancelClock(timer.clock);
        timer.clock = null;
      }
      function startAlarm(){
        if(timer.alarm === false){
          timer.alarm = true;
          timer.media.play();
          scrollDelegate.scrollTo(timer.scroll.left, timer.scroll.top, true);
        }
      }
      function restartAlarm(){
        if(timer.alarm === true){
          timer.media.play();
        }
      }
      function stopAlarm(){
        if(timer.alarm === true){
          timer.alarm = false;
          timer.media.stop();
          timer.media.release();
        }
      }
      function playShortAlarm(){
        if(timer && timer.media){
          timer.media.play();
          $timeout(function(){
            timer.media.stop();
          }, 1200);
          if(timer.scroll){scrollDelegate.scrollTo(timer.scroll.left, timer.scroll.top, true);}
        }
      }

      function stepNearlyReached(step){}
      function stepReached(step){ playShortAlarm(); }
      function timerNearlyEnds(){}
      function timerEnds(){ startAlarm(); }
    }
  };
});
