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
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.recipe', {
    url: '/recipe/:recipeId',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/recipe.html',
        controller: 'RecipeCtrl'
      }
    },
    data: {
      restrict: 'connected'
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
      noSleep: true,
      restrict: 'connected'
    }
  })
  .state('app.tocook', {
    url: '/tocook',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/tocook.html',
        controller: 'TocookCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.cooked', {
    url: '/cooked',
    views: {
      'menuContent': {
        templateUrl: 'scripts/recipe/cooked.html',
        controller: 'CookedCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  });
})

.controller('RecipesCtrl', function($rootScope, $scope, $state, $window, PopupSrv, SelectionSrv, RecipeSrv, CartSrv, LogSrv){
  'use strict';
  $scope.loading = true;
  $scope.recipesOfWeek = {};
  SelectionSrv.getCurrent().then(function(recipesOfWeek){
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
    PopupSrv.changeServings($rootScope.settings.defaultServings, recipe.name).then(function(servings){
      if(servings){
        LogSrv.trackAddRecipeToCart(recipe.id, servings, index, 'selection');
        $rootScope.settings.defaultServings = servings;
        CartSrv.addRecipe(cart, recipe, servings);
        $window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
        RecipeSrv.addToHistory(recipe);
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe, index){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, index, 'selection');
    CartSrv.removeRecipe(cart, recipe);
    $window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };

  $scope.recipeFeedback = function(feedback){
    LogSrv.trackRecipesFeedback($scope.recipesOfWeek.week, feedback);
    $state.go('app.feedback', {source: 'recipes-rating-'+feedback});
  };
})

.controller('RecipeCtrl', function($rootScope, $scope, $stateParams, $window, RecipeSrv, CartSrv, PopupSrv, LogSrv){
  'use strict';
  $scope.recipe = {};
  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    RecipeSrv.addToHistory(recipe);
    $scope.recipe = recipe;
  });

  var cart = CartSrv.hasOpenedCarts() ? CartSrv.getOpenedCarts()[0] : CartSrv.createCart();

  $scope.cartHasRecipe = function(recipe){
    return CartSrv.hasRecipe(cart, recipe);
  };

  $scope.addRecipeToCart = function(recipe){
    PopupSrv.changeServings($rootScope.settings.defaultServings, recipe.name).then(function(servings){
      if(servings){
        LogSrv.trackAddRecipeToCart(recipe.id, servings, null, 'recipe');
        $rootScope.settings.defaultServings = servings;
        CartSrv.addRecipe(cart, recipe, servings);
        $window.plugins.toast.show('✔ recette ajoutée à la liste de courses');
      }
    });
  };
  $scope.removeRecipeFromCart = function(recipe){
    LogSrv.trackRemoveRecipeFromCart(recipe.id, null, 'recipe');
    CartSrv.removeRecipe(cart, recipe);
    $window.plugins.toast.show('✔ recette supprimée de la liste de courses');
  };
})

.controller('CookCtrl', function($scope, $state, $stateParams, $window, RecipeSrv, CartSrv, StorageSrv, PopupSrv, LogSrv, Utils){
  'use strict';
  // TODO : vocal commands : should go to next step when knock knock (speech recognition)
  // TODO : should stick active timers on top (or bottom?) of screen if you scroll
  var cartId = $stateParams.cartId;
  var recipeId = $stateParams.recipeId;
  var startTime, timer = null;
  $scope.timer = 0;

  if(cartId === 'none'){
    RecipeSrv.get(recipeId).then(function(recipe){
      initData(recipe);
    });
  } else {
    initData(CartSrv.getCartRecipe(cartId, recipeId));
  }

  function initData(recipe){
    if(recipe){
      $scope.recipe = recipe;
      RecipeSrv.addToHistory($scope.recipe);
      $scope.servings = $scope.recipe.cartData ? $scope.recipe.cartData.servings.value : $scope.recipe.servings.value;
      $scope.servingsAdjust = $scope.servings / $scope.recipe.servings.value;
      $scope.timer = moment.duration($scope.recipe.time.eat, 'minutes').asSeconds();

      var user = StorageSrv.getUser();
      if(user && user.data && user.data.skipCookFeatures){
        startTimer();
      } else {
        PopupSrv.tourCookFeatures().then(function(){
          user.data.skipCookFeatures = true;
          StorageSrv.saveUser(user);
          startTimer();
        });
      }
    } else {
      // TODO error !
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
    var fiveMinutes = 300;
    var cookDuration = (Date.now() - startTime)/1000;
    if(cookDuration < fiveMinutes){
      $window.history.back();
      $window.plugins.toast.show('T\'as pas cuisiné, avoue ! ;)');
    } else {
      LogSrv.trackRecipeCooked($scope.recipe.id, cookDuration);
      addToCookedRecipes($scope.recipe, $scope.servings, cookDuration);

      PopupSrv.recipeCooked().then(function(shouldExit){
        if(shouldExit){
          if(navigator.app){
            navigator.app.exitApp();
          } else if(navigator.device){
            navigator.device.exitApp();
          }
        } else {
          $state.go('app.home');
        }
      });
    }
  };

  function addToCookedRecipes(recipe, servings, cookDuration){
    if(recipe && recipe.cartData){
      recipe.cartData.cooked = {
        time: Date.now(),
        duration: cookDuration
      };
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
    Utils.cancelClock(timer);
    timer = null;
  }
})

.controller('TocookCtrl', function($scope, PopupSrv, CartSrv){
  'use strict';
  $scope.recipes = CartSrv.getRecipesToCook();
  $scope.recipes.sort(function(a, b){
    var ret = -(CartSrv.boughtPercentage(a) - CartSrv.boughtPercentage(b));
    return ret === 0 ? -(a.cartData.created - b.cartData.created) : ret;
  });

  $scope.boughtPercentage = CartSrv.boughtPercentage;

  $scope.changeServings = function(recipe){
    PopupSrv.changeServings($scope.servings).then(function(servings){
      if(servings){
        recipe.cartData.servings.value = servings;
      }
    });
  };
})

.controller('CookedCtrl', function($scope, CartSrv){
  'use strict';
  $scope.recipes = CartSrv.getCookedRecipes();
  $scope.recipes.sort(function(a, b){
    return -(a.cartData.cooked.time - b.cartData.cooked.time);
  });
})

.factory('RecipeSrv', function($http, $q, StorageSrv, firebaseUrl){
  'use strict';
  var service = {
    get: getRecipe,
    addToHistory: StorageSrv.addRecipeToHistory,
    getHistory: StorageSrv.getRecipeHistory
  };

  function getRecipe(recipeId){
    var recipe = StorageSrv.getRecipe(recipeId);
    if(recipe){
      return $q.when(recipe);
    } else {
      return downloadRecipe(recipeId);
    }
  }

  function downloadRecipe(recipeId){
    // TODO : create BackendSrv !!!
    return $http.get(firebaseUrl+'/recipes/'+recipeId+'.json').then(function(result){
      StorageSrv.addRecipe(result.data);
      return result.data;
    });
  }

  return service;
})

.factory('SelectionSrv', function($http, $q, StorageSrv, firebaseUrl, RecipeSrv, debug){
  'use strict';
  var service = {
    getCurrent: function(){ return getSelection(moment().week()+(debug ? 1 : 0)); }
  };

  function getSelection(selectionId){
    var selection = StorageSrv.getSelection(selectionId);
    if(selection){
      return $q.when(selection);
    } else {
      return downloadSelection(selectionId);
    }
  }

  function downloadSelection(selectionId){
    // TODO : create BackendSrv !!!
    return $http.get(firebaseUrl+'/selections/'+selectionId+'.json').then(function(result){
      return fullLoad(result.data);
    }).then(function(selection){
      StorageSrv.addSelection(selection);
      return selection;
    });
  }

  function fullLoad(selection){
    if(selection && selection.recipes){
      var recipePromises = [];
      for(var i in selection.recipes){
        recipePromises.push(RecipeSrv.get(selection.recipes[i].id));
      }
      return $q.all(recipePromises).then(function(recipes){
        selection.recipes = recipes;
        return selection;
      });
    } else {
      return $q.when(selection);
    }
  }

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
