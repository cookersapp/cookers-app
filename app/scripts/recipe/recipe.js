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

.controller('CookCtrl', function($scope, $state, $stateParams, $ionicPopup, RecipeSrv, LogSrv, Utils){
  'use strict';
  // TODO : should get servings in $stateParams !
  // TODO : should play alarms when timer ends
  // TODO : should go to next when knock knock
  var timer = null;
  $scope.timer = 0;
  /*$scope.recipe = {};

  RecipeSrv.get($stateParams.recipeId).then(function(recipe){
    RecipeSrv.addToHistory(recipe);
    $scope.recipe = recipe;
    $scope.timer = moment.duration(recipe.time.eat, 'minutes').asSeconds();
    startTimer();
  });*/

  $scope.recipe = {
    name: 'aubergines en farce',
    images: { portrait: 'https://cdn.mediacru.sh/kRCuEv9YTmxZ.jpg', landing: 'https://cdn.mediacru.sh/P-pXlNbu91hO.jpg' },
    servings: { value: 2, unit: 'personnes' },
    time: { cooking: 30, eat: 35, preparation: 15, unit: 'minutes' },
    price: { value: 4.228, currency: '€', unit: 'personnes' },
    tools: [
      {name: 'four'},
      {name: 'mixeur'},
      {name: 'poêle'},
      {name: 'casserole'},
      {name: 'planche à découper'},
      {name: 'couteau'},
      {name: 'grosse cuillère'}
    ],
    ingredients:[
      {food:{category:'Fruits & Légumes',id:'aubergine',name:'aubergine'},pre:'',price:{currency:'€',value:2.98},quantity:{unit:'pièce',value:2},role:'essentiel'},
      {food:{category:'Viandes & Poissons',id:'viande-hachee',name:'viande hachée'},pre:'de',price:{currency:'€',value:2.375},quantity:{unit:'g',value:250},role:'essentiel'},
      {food:{category:'Fruits & Légumes',id:'tomate',name:'tomate'},pre:'',price:{currency:'€',value:1.58},quantity:{unit:'pièce',value:2},role:'essentiel'},
      {food:{category:'Épicerie salée',id:'puree-de-tomates',name:'purée de tomates'},price:{currency:'€',value:0},quantity:{unit:'pièce',value:1},role:'accompagnement'},
      {food:{category:'Fruits & Légumes',id:'ail',name:'ail'},pre:'d\'',price:{currency:'€',value:0.78},quantity:{unit:'pièce',value:1},role:'accompagnement'},
      {food:{category:'Frais',id:'parmesan-rape',name:'parmesan rapé'},pre:'de',price:{currency:'€',value:0.40},quantity:{unit:'g',value:20},role:'accompagnement'},
      {food:{category:'Épicerie salée',id:'chapelure',name:'chapelure'},pre:'de',price:{currency:'€',value:0.04},quantity:{unit:'g',value:20},role:'accompagnement'},
      {food:{category:'Épicerie salée',id:'poivre',name:'poivre'},pre:'',price:{currency:'€',value:0},quantity:{unit:'g',value:0},role:'accompagnement'},
      {food:{category:'Épicerie salée',id:'sel',name:'sel'},pre:'',price:{currency:'€',value:0},quantity:{unit:'g',value:0},role:'accompagnement'},
      {food:{category:'Épicerie salée',id:'riz',name:'riz'},pre:'de',price:{currency:'€',value:0.295},quantity:{unit:'g',value:100},role:'facultatif'}],
    instructions: [{
      content: 'En avant guingamp, préchauffe ton four à <b>200°C</b> et sors ton matos de cuisine !<ul><li>Un mixeur</li><li>Un plat qui va au four</li><li>Une poêle</li><li>Une casserole (optionnel)</li><li>Une planche à découper</li><li>Des couverts.</li></ul>Lance la cuisson de ton riz, s\'il est prévu au repas (d\'où la nécessité de la casserole).'
    }, {
      content: 'Prépare tes découpes :<ol><li>Ôte leur chapeau aux aubergines et retires-en la chair que tu haches et réserves <span class="help">(pour les first level, "que tu mets de côté")</span></li><li>Les tomates en dés</li><li>L\'oignon en quadrillage <span class="help">(je m\'explique, tu découpes en rondelles fines, puis en maintenant celles-ci ensembles, à nouveau en rondelles fines mais perpendiculaire à ta première découpe)</span></li><li>L\'ail en petits morceaux</li></ol>'
    }, {
      content: 'Fais cuire les aubergines vidées pendant <b>20 minutes</b>, partie peau vers le haut (ça a son importance).<br>Dès que tu vois des "ridules" sur la peau de l\'aubergine, time\'s up !',
      timers: [
        {color: 'red', label: 'Sors les aubergines du four', seconds: 1200}
      ]
    }, {
      content: 'Profite de la cuisson au four pour faire cuire la viande hachée dans la poêle :<ul><li>Après <b>5 minutes</b>, ajoutes-y les oignons et l\'ail et laisse dorer pendant <b>5 minutes</b></li><li>Ajoute ensuite la chair d\'aubergine hachée puis les tomates coupées</li><li><b>10 minutes</b> plus tard, rajoute la purée de tomates et assaisonne à ta guise</li><li>Laisse mijoter pendant encore <b>5 minutes</b></li></ul>',
      timers: [
        {color: 'blue', steps: [
          {time: 0, label: 'Met la viande hachée dans la poêle'},
          {time: 300, label: 'Ajoute les oignons et l\'ail'},
          {time: 300, label: 'Ajoute la chair de l\'aubergine et les tomates'},
          {time: 600, label: 'Ajoute la purée de tomates'},
          {time: 300, label: 'Sors la préparation du feu'}
        ]}
      ]
    }, {
      content: 'Retire les aubergines du four, passe-le en mode grill.'
    }, {
      content: 'Remplis tes aubergines vides avec la farce,<br>Mélange la chapelure au parmesan,<br>Saupoudre tes aubergines,<br>Passe le tout au grill <b>3 minutes</b>.',
      timers: [
        {color: 'yellow', label: 'Sors les aubergines du grill', seconds: 180}
      ]
    }]
  };
  $scope.timer = moment.duration($scope.recipe.time.eat, 'minutes').asSeconds();
  startTimer();

  $scope.toggleTimer = function(){
    if(timer === null){startTimer();}
    else {stopTimer();}
  };
  $scope.done = function(){
    if(navigator.app){
      navigator.app.exitApp();
    } else if(navigator.device){
      navigator.device.exitApp();
    }
    /*$ionicPopup.show({
      title: 'La recette est maintenant terminée !',
      subTitle: 'Que veux-tu faire ?',
      buttons: [{
        text: 'Revenir à l\'accueil',
        onTap: function(e){
          $state.go('app.home');
          return null;
        }
      }, {
        text: '<b>Quitter l\'application</b>',
        type: 'button-positive',
        onTap: function(e){
          $state.go('app.home');
          if(navigator.app){
            navigator.app.exitApp();
          } else if(navigator.device){
            navigator.device.exitApp();
          }
          return null;
        }
      }]
    });*/
  };

  function startTimer(){
    timer = Utils.clock(function(){
      if($scope.timer > 0){$scope.timer--;}
      else {stopTimer();}
    });
  }
  function stopTimer(){
    Utils.cancelClock(timer);
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

.directive('cookTimer', function(Utils){
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

  function stepNearlyReached(step){ console.log('stepNearlyReached(step)', step); }
  function stepReached(step){ console.log('stepReached(step)', step); }
  function timerNearlyEnds(){ console.log('timerNearlyEnds()'); }
  function timerEnds(){ console.log('timerEnds()'); }

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
      // TODO : synchronize all timers !
      var timer = null;
      var params = getParams(scope);
      angular.extend(scope, params);

      scope.time = 0;
      if(params.steps){
        scope.timeline = [];
        var acc = 0;
        for(var i in params.steps){
          acc += params.steps[i].time;
          scope.timeline.push({time: acc, label: params.steps[i].label});
        }
        scope.timer = acc;
      } else {
        scope.timer = params.seconds;
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
        timer = Utils.clock(function(){
          if(scope.timer - scope.time > 0){
            scope.time++;

            if(scope.timer === scope.time+(nearInterval/2)){timerNearlyEnds();}
            else if(scope.timer === scope.time){timerEnds();}
            else if(scope.timeline){
              for(var i in scope.timeline){
                if(scope.timeline[i].time === scope.time+(nearInterval/2)){stepNearlyReached(scope.timeline[i]);}
                if(scope.timeline[i].time === scope.time){stepReached(scope.timeline[i]);}
              }
            }
          } else {
            stopTimer();
          }
        });
      }
      function stopTimer(){
        Utils.cancelClock(timer);
        timer = null;
      }
    }
  };
});
