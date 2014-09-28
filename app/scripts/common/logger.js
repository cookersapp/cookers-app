angular.module('app')

.factory('LogSrv', function($timeout, Utils, _LocalStorageSrv, appVersion){
  'use strict';
  var service = {
    registerUser:               function()                      { registerUser(true);                                                   },
    trackInstall:               function(user)                  { track('app-installed', {user: user});                                 },
    trackUpgrade:               function(from, to)              { track('app-upgraded', {from: from, to: to});                          },
    trackLaunch:                function(user, launchTime)      { track('app-launched', {user: user, launchTime: launchTime});          },

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

    trackClearCache:            function(user)                  { track('cache-cleared', {user: user});                                 },
    trackClearApp:              function(user)                  { track('app-cleared', {user: user});                                   },
    trackOpenUservoice:         function()                      { track('uservoice-opened');                                            },

    trackError:                 function(type, error)           { track('error', {type: type, error: error});                           }
  };
  var identified = false;
  var previousEventId = null;

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

  function track(event, properties){
    if(!identified){
      registerUser(false);
      identified = true;
    }
    var user = _LocalStorageSrv.getUser();
    if(!properties){properties = {};}
    if(!properties.appVersion)                  { properties.appVersion  = appVersion;  }
    if(!properties.id && user && user.id)       { properties.userId  = user.id;         }
    if(!properties.email && user && user.email) { properties.email   = user.email;      }
    if(user && user.device){
      if(!properties.device && user.device.uuid && user.device.model && user.device.platform && user.device.version){
        properties.device = {
          uuid: user.device.uuid,
          model: user.device.model,
          platform: user.device.platform,
          version: user.device.version
        };
      }
    }

    Logger.track(event, properties);
  }

  function registerUser(async){
    var app = _LocalStorageSrv.getApp();
    var user = _LocalStorageSrv.getUser();
    var userProfile = {};
    if(app.firstLaunch){userProfile.$created = new Date(app.firstLaunch);}
    if(appVersion){userProfile.appVersion = appVersion;}
    if(user.id){userProfile.id = user.id;}
    if(user.email && Utils.isEmail(user.email)){userProfile.$email = user.email;}
    if(user.device){
      if(user.device.uuid)     { userProfile['device.uuid']       = user.device.uuid;      }
      if(user.device.model)    { userProfile['device.model']      = user.device.model;     }
      if(user.device.platform) { userProfile['device.platform']   = user.device.platform;  }
      if(user.device.version)  { userProfile['device.version']    = user.device.version;   }
    }
    for(var j in user.settings){
      userProfile['setting.'+j] = user.settings[j];
    }

    Logger.identify(user.id, userProfile, async);
  }

  return service;
});
