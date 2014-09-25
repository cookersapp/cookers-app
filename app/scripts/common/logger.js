angular.module('app')

.factory('LogSrv', function($timeout, Utils, _LocalStorageSrv, appVersion){
  'use strict';
  // rename events with a past-tense verb and a noun.
  // ex: app installed, page viewed, feedback sent...
  var service = {
    identify: function(){registerUser(false);},
    registerUser: function(){registerUser(true);},
    trackInstall: function(user){track('install', {user: user});},
    trackUpgrade: function(from, to){track('upgrade', {from: from, to: to});},
    trackLaunch: function(user, launchTime){track('launch', {user: user, launchTime: launchTime});},
    trackState: function(params){track('state', params);},
    trackStateError: function(params){track('state-error', params);},
    trackStateNotFound: function(params){track('state-not-found', params);},
    trackSetEmail: function(email){track('set-email', {email: email});},
    trackHideMessage: function(message){track('hide-message', {message: message});},
    trackRecipesFeedback: function(week, feedback){track('recipes-feedback', {week: week, feedback: feedback});},
    trackAddRecipeToCart: function(recipe, servings, index, from){trackWithPosition('add-recipe-to-cart', {recipe: recipe, servings: servings, index: index, from: from});},
    trackRemoveRecipeFromCart: function(recipe, index, from){trackWithPosition('remove-recipe-from-cart', {recipe: recipe, index: index, from: from});},
    trackEditCartCustomItems: function(customItems){track('edit-cart-custom-items', {customItems: customItems});},
    trackCartRecipeDetails: function(recipe, action){track('cart-recipe-details', {recipe: recipe, action: action});},
    trackCartItemDetails: function(item, action){track('cart-item-details', {item: item, action: action});},
    trackBuyItem: function(item){trackWithPosition('buy-item', {item: item});},
    trackUnbuyItem: function(item){track('unbuy-item', {item: item});},
    trackArchiveCart: function(){track('archive-cart');},
    trackRecipeCooked: function(recipe, cookDuration){track('recipe-cooked', {recipe: recipe, cookDuration: cookDuration});},
    trackSendFeedback: function(email){track('send-feedback', {email: email});},
    trackOpenUservoice: function(){track('open-uservoice');},
    trackChangeSetting: function(setting, value){track('change-setting', {setting: setting, value: value});},
    trackClearCache: function(user){track('clear-cache', {user: user});},
    trackClearApp: function(user){track('clear-app', {user: user});},
    trackError: function(type, error){track('error', {type: type, error: error});}
  };
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
