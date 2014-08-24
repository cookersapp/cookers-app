angular.module('app.logger', [])

// TODO : problem : lose trace of source log (file & line)
/*.factory('Logger', function(){
  'use strict';
  var service = {
    log: log,
    warn: warn
  };

  function log(text, obj){
    if(obj){console.log(text, obj);}
    else {console.log(text);}
  }

  function warn(text, obj){
    if(obj){console.warn(text, obj);}
    else {console.warn(text);}
  }

  return service;
})*/

.factory('LogSrv', function($timeout, $window, $localStorage, GamificationSrv, appVersion){
  'use strict';
  var service = {
    identify: Logger.identify,
    registerUser: registerUser,
    trackInstall: function(user){track('install', {user: user});},
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
    trackError: function(id, error){track('error', {id: id, error: error});}
  };
  var previousEventId = null;

  function sApp(){return $localStorage.app;}
  function sUser(){return $localStorage.user;}

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
    if(!properties){properties = {};}
    properties.appVersion = appVersion;
    if(!properties.email && sUser() && sUser().email){properties.email = sUser().email;}
    if(sUser() && sUser().device){
      if(!properties.uuid && sUser().device.uuid){properties.uuid = sUser().device.uuid;}
      if(!properties.device && sUser().device.model && sUser().device.platform && sUser().device.version){
        properties.device = {
          model: sUser().device.model,
          platform: sUser().device.platform,
          version: sUser().device.version
        };
      }
    }

    Logger.track(event, properties);
    GamificationSrv.sendEvent(event, properties);
  }

  function registerUser(){
    var userProfile = {
      $created: moment(sApp().firstLaunch).format('llll'),
      $email: sUser().email,
      $first_name: sUser().firstName,
      $last_name: sUser().lastName,
      fullName: sUser().name,
      avatar: sUser().avatar,
      backgroundCover: sUser().backgroundCover,
      appVersion: appVersion
    };
    if(sUser().device){
      if(sUser().device.uuid)     { userProfile['device.uuid']       = sUser().device.uuid;      }
      if(sUser().device.model)    { userProfile['device.model']      = sUser().device.model;     }
      if(sUser().device.platform) { userProfile['device.platform']   = sUser().device.platform;  }
      if(sUser().device.version)  { userProfile['device.version']    = sUser().device.version;   }
    }
    for(var i in sUser().more){
      userProfile['more.'+i] = sUser().more[i];
    }
    for(var j in sUser().settings){
      userProfile['setting.'+j] = sUser().settings[j];
    }

    Logger.setProfile(userProfile);
  }

  return service;
});
