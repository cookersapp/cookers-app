angular.module('app')

.factory('LogSrv', function($timeout, $window, Utils, _LocalStorageSrv, appVersion){
  'use strict';
  var service = {
    identify: Logger.identify,
    registerUser: registerUser,
    trackInstall: function(user){track('install', {user: user});},
    trackUpgrade: function(from, to){track('upgrade', {from: from, to: to});},
    trackLaunch: function(user, launchTime){track('launch', {user: user, launchTime: launchTime});},
    trackLogin: function(provider, data){track('login', {provider: provider, data: data});},
    trackIntroChangeSlide: function(from, to){track('intro-change-slide', {from: from, to: to});},
    trackIntroExit: function(slide){track('intro-exit', {slide: slide});},
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
    trackLogout: function(user){track('logout', {user: user});},
    trackClearCache: function(user){track('clear-cache', {user: user});},
    trackClearApp: function(user){track('clear-app', {user: user});},
    trackError: function(type, error){track('error', {type: type, error: error});}
  };
  var previousEventId = null;

  function trackWithPosition(event, params){
    if(navigator && navigator.geolocation){
      var timeoutGeoloc = $timeout(function(){
        console.log('position timeout !');
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
    properties.appVersion = appVersion;
    if(!properties.email && user && user.email){properties.email = user.email;}
    if(user && user.device){
      if(!properties.uuid && user.device.uuid){properties.uuid = user.device.uuid;}
      if(!properties.device && user.device.model && user.device.platform && user.device.version){
        properties.device = {
          model: user.device.model,
          platform: user.device.platform,
          version: user.device.version
        };
      }
    }

    Logger.track(event, properties);
  }

  function registerUser(){
    var app = _LocalStorageSrv.getApp();
    var user = _LocalStorageSrv.getUser();
    var userProfile = {};
    if(app.firstLaunch){userProfile.$created = new Date(app.firstLaunch);}
    if(user.email && Utils.isEmail(user.email)){userProfile.$email = user.email;}
    if(app.firstName){userProfile.$first_name = app.firstName;}
    if(app.lastName){userProfile.$last_name = app.lastName;}
    if(app.name){userProfile.fullName = app.name;}
    if(app.avatar){userProfile.avatar = app.avatar;}
    if(app.backgroundCover){userProfile.backgroundCover = app.backgroundCover;}
    if(appVersion){userProfile.appVersion = appVersion;}
    if(user.device){
      if(user.device.uuid)     { userProfile['device.uuid']       = user.device.uuid;      }
      if(user.device.model)    { userProfile['device.model']      = user.device.model;     }
      if(user.device.platform) { userProfile['device.platform']   = user.device.platform;  }
      if(user.device.version)  { userProfile['device.version']    = user.device.version;   }
    }
    for(var i in user.more){
      userProfile['more.'+i] = user.more[i];
    }
    for(var j in user.settings){
      userProfile['setting.'+j] = user.settings[j];
    }

    Logger.setProfile(userProfile);
  }

  return service;
});
