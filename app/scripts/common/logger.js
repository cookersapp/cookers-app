angular.module('app')

.factory('LogSrv', function($timeout, Utils, _LocalStorageSrv, appVersion){
  'use strict';
  var service = {
    trackInstall:               function()                      { track('app-installed');                                               },
    trackUpgrade:               function(from, to)              { track('app-upgraded', {from: from, to: to});                          },
    trackLaunch:                function(launchTime)            { track('app-launched', {launchTime: launchTime});                      },

    trackShowRecipeIngredients: function(recipe, index)         { track('recipe-ingredients-showed', {recipe: recipe, index: index});   },
    trackShowRecipeDetails:     function(recipe, index)         { track('recipe-details-showed', {recipe: recipe, index: index});       },
    trackAddRecipeToCart:       function(recipe, index)         { track('recipe-added-to-cart', {recipe: recipe, index: index});        },
    trackRemoveRecipeFromCart:  function(recipe, index)         { track('recipe-removed-from-cart', {recipe: recipe, index: index});    },
    trackShowRecipeCook:        function(recipe)                { track('recipe-cook-showed', {recipe: recipe});                        },
    trackRecipeCooked:          function(recipe, cookDuration)  { track('recipe-cooked', {recipe: recipe, cookDuration: cookDuration}); },
    trackRecipesFeedback:       function(week, feedback)        { track('recipes-feedback-sent', {week: week, feedback: feedback});     },

    trackBuyItem:               function(item)                  { trackWithPosition('item-bought', {item: item});                       },
    trackUnbuyItem:             function(item)                  { track('item-unbought', {item: item});                                 },

    trackEditCartCustomItems:   function(customItems)           { track('cart-custom-items-edited', {customItems: customItems});        },
    trackCartRecipeDetails:     function(recipe)                { track('cart-recipe-details-showed', {recipe: recipe});                },
    trackShowCartItemDetails:   function(item)                  { track('cart-item-details-showed', {item: item});                      },

    trackClearCache:            function()                      { track('cache-cleared');                                               },
    trackClearApp:              function()                      { track('app-cleared');                                                 },
    trackOpenUservoice:         function()                      { track('uservoice-opened');                                            },

    trackError:                 function(type, error)           { track('error', {type: type, error: error});                           }
  };

  function trackWithPosition(event, params){
    if(navigator && navigator.geolocation){
      var timeoutGeoloc = $timeout(function(){
        track(event, params);
      }, 3000);
      navigator.geolocation.getCurrentPosition(function(position){
        $timeout.cancel(timeoutGeoloc);
        params.position = position.coords;
        if(params.position){params.position.timestamp = position.timestamp;}
        track(event, params);
      }, function(error){
        $timeout.cancel(timeoutGeoloc);
        params.position = error;
        if(params.position){params.position.timestamp = Date.now();}
        track(event, params);
      }, {
        enableHighAccuracy: true,
        timeout: 2000,
        maximumAge: 0
      });
    } else {
      track(event, params);
    }
  }

  function track(name, data){
    var user = _LocalStorageSrv.getUser();
    var event = {};
    if(data)            { event.data = data;       }
    if(user && user.id) { event.userId = user.id;  }
    if(user && user.device){
      event.source = {};
      event.source.device = angular.copy(user.device);
    }

    Logger.track(name, event);
  }

  return service;
});
