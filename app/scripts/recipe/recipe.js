angular.module('app.recipe', ['app.utils', 'ui.router'])

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

.controller('RecipesCtrl', function($rootScope, $scope, $state, $window, PopupSrv, WeekrecipeSrv, RecipeSrv, CartSrv, LogSrv){
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
    PopupSrv.changeServings($rootScope.settings.defaultServings, recipe.name).then(function(servings){
      if(servings){
        $rootScope.settings.defaultServings = servings;
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
})

.controller('CookCtrl', function($scope, $state, $stateParams, RecipeSrv, CartSrv, PopupSrv, LogSrv, Utils){
  'use strict';
  // TODO : should go to next step when knock knock (speech recognition)
  // TODO : should stick active timers on top (or bottom?) of screen if you scroll
  var cartId = $stateParams.cartId;
  var recipeId = $stateParams.recipeId;
  var startTime = Date.now();
  var timer = null;
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
      startTimer();
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
    var cookDuration = (Date.now() - startTime)/1000;
    LogSrv.trackRecipeCooked($scope.recipe.id, cookDuration);
    if($scope.recipe && $scope.recipe.cartData){
      $scope.recipe.cartData.cooked = {
        time: Date.now(),
        duration: cookDuration
      };
    } else {
      var recipe = angular.copy($scope.recipe);
      recipe.cartData = {
        cooked: {
          time: Date.now(),
          duration: cookDuration
        },
        servings: {
          value: $scope.servings,
          unit: recipe.servings.unit
        }
      };
      CartSrv.addStandaloneCookedRecipe(recipe);
    }

    if(navigator.app){
      navigator.app.exitApp();
    } else if(navigator.device){
      navigator.device.exitApp();
    }

    /*PopupSrv.recipeCooked().then(function(shouldExit){
      if(shouldExit){
        if(navigator.app){
          navigator.app.exitApp();
        } else if(navigator.device){
          navigator.device.exitApp();
        }
      } else {
        $state.go('app.home');
      }
    });*/
  };

  function startTimer(){
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
    return CartSrv.boughtPercentage(b) - CartSrv.boughtPercentage(a);
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
    return b.cartData.cooked.time - a.cartData.cooked.time;
  });
})

.factory('RecipeSrv', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var service = {
    get: getRecipe,
    addToHistory: addToHistory,
    getHistory: function(){return sRecipesHistory();},
    store: storeRecipe
  };

  function sRecipes(){return $localStorage.data.recipes;}
  function sRecipesHistory(){return $localStorage.logs.recipesHistory;}

  function getRecipe(recipeId){
    var recipe = _.find(sRecipes(), {id: recipeId});
    if(recipe){
      return $q.when(recipe);
    } else {
      return downloadRecipe(recipeId);
    }
  }

  function addToHistory(recipe){
    _.remove(sRecipesHistory(), {id: recipe.id});
    sRecipesHistory().unshift(recipe);
  }

  function downloadRecipe(recipeId){
    return $http.get(firebaseUrl+'/recipes/'+recipeId+'.json').then(function(result){
      storeRecipe(result.data);
      return result.data;
    });
  }

  function storeRecipe(recipe){
    sRecipes().push(recipe);
  }

  return service;
})

.factory('WeekrecipeSrv', function($http, $q, $localStorage, firebaseUrl, RecipeSrv, debug){
  'use strict';
  var service = {
    getCurrent: function(){ return getRecipesOfWeek(moment().week()+(debug ? 1 : 0)); },
    get: getRecipesOfWeek,
    store: storeRecipesOfWeek
  };

  function sRecipesOfWeek(){return $localStorage.data.recipesOfWeek;}

  function getRecipesOfWeek(week){
    var weekrecipes = _.find(sRecipesOfWeek(), {id: week.toString()});
    if(weekrecipes){
      return $q.when(weekrecipes);
    } else {
      return downloadRecipesOfWeek(week);
    }
  }

  function downloadRecipesOfWeek(week){
    return $http.get(firebaseUrl+'/weekrecipes/'+week+'.json').then(function(result){
      storeRecipesOfWeek(result.data);
      for(var i in result.data.recipes){
        RecipeSrv.store(result.data.recipes[i]);
      }
      return result.data;
    });
  }

  function storeRecipesOfWeek(weekrecipes){
    sRecipesOfWeek().push(weekrecipes);
  }

  return service;
})

.directive('cookTimer', function($ionicScrollDelegate, MediaSrv, Utils){
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
      MediaSrv.loadMedia('sounds/timerEnds.mp3', null, null, restartAlarm).then(function(media){
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

      function stepNearlyReached(step){ console.log('stepNearlyReached(step)', step); }
      function stepReached(step){ console.log('stepReached(step)', step); }
      function timerNearlyEnds(){ console.log('timerNearlyEnds()'); }
      function timerEnds(){
        console.log('timerEnds()');
        startAlarm();
      }
    }
  };
});
