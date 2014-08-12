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

.factory('LogSrv', function($rootScope, $timeout, $window, $localStorage, $state, GamificationSrv, firebaseUrl, appVersion, debug){
  'use strict';
  var buyLogsRef = new Firebase(firebaseUrl+'/logs/buy');
  var service = {
    identify: identify,
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
    // ??? merge trackAddRecipeToCart with trackRemoveRecipeFromCart ??? And with trackAddItemToCart or trackRemoveItemFromCart ???
    trackAddRecipeToCart: function(recipe, servings, index, from){trackWithPosition('add-recipe-to-cart', {recipe: recipe, servings: servings, index: index, from: from});},
    trackRemoveRecipeFromCart: function(recipe, index, from){trackWithPosition('remove-recipe-from-cart', {recipe: recipe, index: index, from: from});},
    trackAddItemToCart: function(item, quantity, unit, missing, search){trackWithPosition('add-item-to-cart', {item: item, quantity: quantity, unit: unit, missing: missing, search: search});},
    trackRemoveItemFromCart: function(item){trackWithPosition('remove-item-from-cart', {item: item});},
    trackEditCartCustomItems: function(customItems){trackWithPosition('edit-cart-custom-items', {customItems: customItems});},
    // ??? merge trackCartRecipeDetails with trackCartItemDetails ???
    trackCartRecipeDetails: function(recipe, action){track('cart-recipe-details', {recipe: recipe, action: action});},
    trackCartItemDetails: function(item, action){track('cart-item-details', {item: item, action: action});},
    trackBuyItem: function(item){trackWithPosition('buy-item', {item: item});},
    trackBuyItemSource: function(item, recipe){trackWithPosition('buy-item-source', {item: item, recipe: recipe});},
    trackUnbuyItem: function(item){track('unbuy-item', {item: item});},
    trackArchiveCart: function(){track('archive-cart');},
    trackSendFeedback: function(email){track('send-feedback', {email: email});},
    trackOpenUservoice: function(){track('open-uservoice');},
    trackChangeSetting: function(setting, value){track('change-setting', {setting: setting, value: value});},
    trackLogout: function(user){track('logout', {user: user});},
    trackClearCache: function(user){track('clear-cache', {user: user});},
    trackClearApp: function(user){track('clear-app', {user: user});},
    trackError: function(id, error){track('error', {id: id, error: error});}
  };
  
  function sApp(){return $localStorage.app;}
  function sUser(){return $localStorage.user;}

  function trackWithPosition(event, params){
    if(navigator && navigator.geolocation){
      var fallbackTrack = $timeout(function(){
        track(event, params);
      }, 3000);
      navigator.geolocation.getCurrentPosition(function(position){
        $timeout.cancel(fallbackTrack);
        params.position = position.coords;
        if(params.position){params.position.timestamp = position.timestamp;}
        if(event === 'buy-item' || event === 'buy-item-source'){buyLogsRef.push(params);}
        track(event, params);
      }, function(error){
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

  function track(event, params){
    if(!params){params = {};}
    params.localtime = Date.now();
    params.appVersion = appVersion;
    if(!params.url && $window.location && $window.location.hash) {params.url = $window.location.hash;}
    if(!params.email && sUser() && sUser().email){params.email = sUser().email;}
    if(sUser() && sUser().device){
      if(!params.uuid && sUser().device.uuid){params.uuid = sUser().device.uuid;}
      if(!params.device && sUser().device.model && sUser().device.platform && sUser().device.version){
        params.device = {
          model: sUser().device.model,
          platform: sUser().device.platform,
          version: sUser().device.version
        };
      }
    }

    if(debug){
      console.log('track '+event, params);
    } else {
      mixpanel.track(event, params);
    }
    GamificationSrv.sendEvent(event, params);
  }

  function identify(id){
    if(debug){
      console.log('identify', id);
    } else {
      mixpanel.identify(id);
    }
  }

  function registerUser(){
    var mixpanelUser = {
      $created: moment(sApp().firstLaunch).format('llll'),
      $email: sUser().email,
      fullName: sUser().name,
      avatar: sUser().avatar,
      backgroundCover: sUser().backgroundCover
    };
    if(sUser().profiles.gravatar.entry && sUser().profiles.gravatar.entry.length > 0){
      var e = sUser().profiles.gravatar.entry[0];
      if(e.hash)            { mixpanelUser.gravatar = e.hash; }
      if(e.aboutMe)         { mixpanelUser.about = e.aboutMe; }
      if(e.currentLocation) { mixpanelUser.location = e.currentLocation; }
      if(e.name){
        if(e.name.givenName) { mixpanelUser.$first_name = e.name.givenName; }
        if(e.name.familyName){ mixpanelUser.$last_name = e.name.familyName; }
      }
    }
    for(var i in sUser().settings){
      mixpanelUser['setting.'+i] = sUser().settings[i];
    }

    if(debug){
      console.log('register', mixpanelUser);
    } else {
      mixpanel.people.set(mixpanelUser);
    }
  }

  return service;
});
