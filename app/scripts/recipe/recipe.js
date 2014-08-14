angular.module('app.recipe', ['ui.router'])

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
    url: '/cook/:recipeId',
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
  });
})

.controller('RecipesCtrl', function($rootScope, $scope, $state, $window, $ionicPopup, WeekrecipeSrv, RecipeSrv, CartSrv, LogSrv){
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
})

.controller('CookCtrl', function($scope, $state, $stateParams, $interval, RecipeSrv, LogSrv){
  'use strict';
  // TODO : should get servings in $stateParams !
  var timer = null;
  $scope.recipe = {};
  $scope.timer = 0;

  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    RecipeSrv.addToHistory(recipe);
    $scope.recipe = recipe;
    $scope.timer = moment.duration(recipe.time.eat, "minutes").asSeconds();
    startTimer();
  });

  $scope.steps = [
    {time: 0, label: 'Met la viande hachée dans la poêle'},
    {time: 300, label: 'Ajoute les oignons et l\'ail'},
    {time: 300, label: 'Ajoute la chair de l\'aubergine et les tomates'},
    {time: 600, label: 'Ajoute la purée de tomates'},
    {time: 300, label: 'Sors la préparation du feu'}
  ];
  $scope.steps = [
    {time: 0, label: 'Met la viande hachée dans la poêle'},
    {time: 10, label: 'Ajoute les oignons et l\'ail'},
    {time: 10, label: 'Ajoute la chair de l\'aubergine et les tomates'},
    {time: 10, label: 'Ajoute la purée de tomates'},
    {time: 10, label: 'Sors la préparation du feu'}
  ];

  $scope.toggleTimer = function(){
    if(timer === null){startTimer();}
    else {stopTimer();}
  };
  $scope.done = function(){
    $state.go('app.home');
  };

  function startTimer(){
    timer = $interval(function(){
      if($scope.timer > 0){$scope.timer--;}
      else {stopTimer();}
    }, 1000);
  }
  function stopTimer(){
    $interval.cancel(timer);
    timer = null;
  }
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

.directive('cookTimer', function($interval){
  'use strict';
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'scripts/recipe/timer.html',
    scope: {
      color: '@',
      label: '=',
      seconds: '=',
      steps: '='
    },
    link: function(scope, element, attrs){
      var timer = null;
      var nearInterval = 6;

      scope.time = 0;
      if(scope.steps){
        scope.timeline = [];
        var acc = 0;
        for(var i in scope.steps){
          acc += scope.steps[i].time;
          scope.timeline.push({time: acc, label: scope.steps[i].label});
        }
        scope.timer = acc;
      } else {
        scope.timer = scope.seconds;
      }

      scope.isSelected = function(step){
        return step.time - (nearInterval/2) <= scope.time && scope.time < step.time + (nearInterval/2);
      };
      scope.isUnselected = function(step){
        return scope.time >= step.time + (nearInterval/2);
      };

      scope.toggleTimer = function(){
        if(timer === null){startTimer();}
        else {stopTimer();}
      };

      function startTimer(){
        timer = $interval(function(){
          if(scope.timer - scope.time > 0){
            scope.time++;
            
            if(scope.timeline){
              for(var i in scope.timeline){
                if(scope.timeline[i].time === scope.time+(nearInterval/2)){stepNearlyReached(scope.timeline[i]);}
                if(scope.timeline[i].time === scope.time){stepReached(scope.timeline[i]);}
              }
            }
            if(scope.timer === scope.time+(nearInterval/2)){timerNearlyEnds();}
            if(scope.timer === scope.time){timerEnds();}
          } else {
            stopTimer();
          }
        }, 1000);
      }
      function stopTimer(){
        $interval.cancel(timer);
        timer = null;
      }

      function stepNearlyReached(step){ console.log('stepNearlyReached(step)', step); }
      function stepReached(step){ console.log('stepReached(step)', step); }
      function timerNearlyEnds(){ console.log('timerNearlyEnds()'); }
      function timerEnds(){ console.log('timerEnds()'); }
    }
  };
});
