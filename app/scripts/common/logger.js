angular.module('app')

.factory('LogSrv', function(GeolocationSrv){
  'use strict';
  var service = {
    trackInstall:               function()                        { track('app-installed');                                                           },
    trackUpgrade:               function(from, to)                { track('app-upgraded', {from: from, to: to});                                      },
    trackLaunch:                function(launchTime)              { track('app-launched', {launchTime: launchTime});                                  },

    trackShowRecipeIngredients: function(recipe, index)           { track('recipe-ingredients-showed', {recipe: recipe, index: index});               },
    trackShowRecipeDetails:     function(recipe, index)           { track('recipe-details-showed', {recipe: recipe, index: index});                   },
    trackAddRecipeToCart:       function(recipe, servings, index) { track('recipe-added-to-cart', {recipe:recipe,servings:servings,index:index});     },
    trackRemoveRecipeFromCart:  function(recipe, index)           { track('recipe-removed-from-cart', {recipe: recipe, index: index});                },
    trackShowRecipeCook:        function(recipe)                  { track('recipe-cook-showed', {recipe: recipe});                                    },
    trackRecipeCooked:          function(recipe, cookDuration)    { track('recipe-cooked', {recipe: recipe, cookDuration: cookDuration});             },
    trackRecipesFeedback:       function(week, feedback)          { track('recipes-feedback-sent', {week: week, feedback: feedback});                 },

    trackBuyItem:               function(item, quantity)          { trackWithPosition('item-bought', {item: item, quantity: quantity});               },
    trackUnbuyItem:             function(item)                    { track('item-unbought', {item: item});                                             },
    trackCartScan:              function(item, barcode, time)     { trackWithPosition('cart-product-scanned', {item:item,barcode:barcode,time:time}); },
    trackCartProductLoaded:     function(barcode, time, found)    { track('cart-product-loaded', {barcode: barcode, time: time, found: found});       },

    trackEditCartCustomItems:   function(customItems)             { track('cart-custom-items-edited', {customItems: customItems});                    },
    trackShowCartRecipeDetails: function(recipe)                  { track('cart-recipe-details-showed', {recipe: recipe});                            },
    trackShowCartItemDetails:   function(item)                    { track('cart-item-details-showed', {item: item});                                  },

    trackClearCache:            function()                        { track('cache-cleared');                                                           },
    trackClearApp:              function()                        { track('app-cleared');                                                             },
    trackOpenUservoice:         function()                        { track('uservoice-opened');                                                        },

    trackError:                 function(type, error)             { track('error', {type: type, error: error});                                       }
  };

  function trackWithPosition(event, params){
    var now = Date.now();
    GeolocationSrv.getCurrentPosition().then(function(position){
      params.position = position.coords;
      if(params.position){params.position.timestamp = position.timestamp;}
      track(event, params, now);
    }, function(error){
      params.position = error;
      if(params.position){params.position.timestamp = Date.now();}
      track(event, params, now);
    });
  }

  function track(name, data, time){
    var event = {};
    if(data){ event.data = data; }
    if(time){ event.time = time; }

    Logger.track(name, event);
  }

  return service;
})

// logger without service dependency (to avoid circular dependencies)
.factory('SimpleLogSrv', function(){
  'use strict';
  var service = {
    trackError: function(type, error){ track('error', {type: type, error: error});},
    track: track
  };
  

  function track(name, data, time){
    var event = {};
    if(data){ event.data = data; }
    if(time){ event.time = time; }

    Logger.track(name, event);
  }

  return service;
});
