angular.module('app')

.factory('FoodSrv', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var sFoods = $localStorage.foods;
  var service = {
    getAll: getAll
  };

  function getAll(){
    if(!sFoods || sFoods.length === 0){
      return downloadFoods();
    } else {
      downloadFoods();
      return $q.when(sFoods);
    }
  }

  function downloadFoods(){
    return $http.get(firebaseUrl+'/foods.json').then(function(result){
      // problem : don't remove deleted food...
      for(var i in result.data){
        storeFood(result.data[i]);
      }
      return sFoods;
    });
  }

  function storeFood(food){
    var index = _.findIndex(sFoods, {id: food.id});
    if(index > -1){
      angular.copy(food, sFoods[index]);
    } else {
      sFoods.push(food);
    }
  }

  return service;
})

.factory('AppSrv', function($localStorage){
  'use strict';
  var sApp = $localStorage.app;
  var service = {
    get: function(){return sApp;},
  };

  return service;
})

.factory('GlobalMessageSrv', function($q, $http, $localStorage, firebaseUrl, debug, appVersion){
  'use strict';
  var sGlobalmessages = $localStorage.data.globalmessages;
  var service = {
    getStandardMessageToDisplay: getStandardMessageToDisplay,
    getStickyMessages: getStickyMessages,
    execMessages: execMessages
  };

  function getStandardMessageToDisplay(){
    var type = 'standard';
    var message = findMessage(type);
    if(message){
      fetchMessages();
      return $q.when(message);
    } else {
      return fetchMessages().then(function(){
        return findMessage(type);
      });
    }
  }

  function getStickyMessages(){
    var type = 'sticky';
    return fetchMessages().then(function(){
      return findMessages(type);
    });
  }

  function execMessages(){
    var type = 'exec';
    return fetchMessages().then(function(){
      var messages = findMessages(type);
      for(var i in messages){
        if(messages[i].exec){
          execMessage(messages[i].exec, messages[i]);
        }
        messages[i].hide = true;
      }
      return messages;
    });
  }

  function findMessages(type){
    return _.filter(sGlobalmessages.messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function findMessage(type){
    return _.find(sGlobalmessages.messages, function(msg){
      return msg.type === type && !msg.hide && msg.shouldDisplay && execMessage(msg.shouldDisplay, msg);
    });
  }

  function fetchMessages(){
    sGlobalmessages.lastCall = Date.now();
    return $http.get(firebaseUrl+'/globalmessages.json').then(function(result){
      var messages = _.filter(result.data, function(msg){
        return msg && (msg.isProd || debug) && msg.targets && msg.targets.indexOf(appVersion) > -1 && !messageExists(msg);
      });
      sGlobalmessages.messages = sGlobalmessages.messages.concat(messages);
      // sort chronogically
      sGlobalmessages.messages.sort(function(a,b){
        return a.added - b.added;
      });
    });
  }

  function execMessage(fn, message){
    var user = $localStorage.user;
    return eval(fn);
  }

  function messageExists(message){
    return message && message.added && _.findIndex(sGlobalmessages.messages, {added: message.added}) > -1;
  }

  return service;
})

.factory('EmailSrv', function($http, $q, mandrillUrl, mandrillKey, supportTeamEmail){
  'use strict';
  var service = {
    sendFeedback: sendFeedback
  };

  function sendFeedback(email, feedback){
    return $http.post(mandrillUrl+'/messages/send.json', {
      'key': mandrillKey,
      'message': {
        'subject': '[Cookers] Feedback from app',
        'text': feedback,
        //'html': '<p>'+feedback+'</p>',
        'from_email': email,
        'to': [
          {'email': supportTeamEmail, 'name': 'Cookers team'}
        ],
        'important': false,
        'track_opens': true,
        'track_clicks': null,
        'preserve_recipients': null,
        'tags': [
          'app', 'feedback'
        ]
      },
      'async': false
    }).then(function(result){
      var sent = true;
      for(var i in result.data){
        if(result.data[i].reject_reason){
          sent = false;
        }
      }
      return sent;
    });
  }

  return service;
})

.factory('FirebaseSrv', function(firebaseUrl){
  'use strict';
  var service = {
    push: function(endpoint, data){
      new Firebase(firebaseUrl+endpoint).push(data);
    }
  };

  return service;
})

.factory('StorageSrv', function($localStorage, localStorageDefault){
  'use strict';
  var service = {
    clearCache: function(){
      $localStorage.data.foods = localStorageDefault.data.foods;
      $localStorage.data.recipes = localStorageDefault.data.recipes;
      $localStorage.data.recipesOfWeek = localStorageDefault.data.recipesOfWeek;
    },
    clear: function(){
      $localStorage.$reset(localStorageDefault);
    },
    migrate: migrate
  };

  function migrate(previousVersion){
    // for version 0.1.1, data is reseted !!!
    $localStorage.$reset(localStorageDefault);
  }

  return service;
})

.factory('LogSrv', function($rootScope, $timeout, $window, $localStorage, $state, GamificationSrv, firebaseUrl, appVersion, debug){
  'use strict';
  var buyLogsRef = new Firebase(firebaseUrl+'/logs/buy');
  var sApp = $localStorage.app;
  var sUser = $localStorage.user;
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

  function trackWithPosition(event, params){
    if(navigator && navigator.geolocation){
      var fallbackTrack = $timeout(function(){
        track(event, params);
      }, 3000);
      navigator.geolocation.getCurrentPosition(function(position){
        $timeout.cancel(fallbackTrack);
        params.position = position.coords;
        params.position.timestamp = position.timestamp;
        if(event === 'buy-item' || event === 'buy-item-source'){buyLogsRef.push(params);}
        track(event, params);
      }, function(error){
        params.position = error;
        params.position.timestamp = Date.now();
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
    if(!params.email && sUser && sUser.email){params.email = sUser.email;}
    if(sUser && sUser.device){
      if(!params.uuid && sUser.device.uuid){params.uuid = sUser.device.uuid;}
      if(!params.device && sUser.device.model && sUser.device.platform && sUser.device.version){
        params.device = {
          model: sUser.device.model,
          platform: sUser.device.platform,
          version: sUser.device.version
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
    if(!sApp){sApp = $localStorage.app;}
    if(!sUser){sUser = $localStorage.user;}
    var mixpanelUser = {
      $created: moment(sApp.firstLaunch).format('llll'),
      $email: sUser.email,
      fullName: sUser.name,
      avatar: sUser.avatar,
      backgroundCover: sUser.backgroundCover
    };
    if(sUser.profiles.gravatar.entry && sUser.profiles.gravatar.entry.length > 0){
      var e = sUser.profiles.gravatar.entry[0];
      if(e.hash)            { mixpanelUser.gravatar = e.hash; }
      if(e.aboutMe)         { mixpanelUser.about = e.aboutMe; }
      if(e.currentLocation) { mixpanelUser.location = e.currentLocation; }
      if(e.name){
        if(e.name.givenName) { mixpanelUser.$first_name = e.name.givenName; }
        if(e.name.familyName){ mixpanelUser.$last_name = e.name.familyName; }
      }
    }
    for(var i in sUser.settings){
      mixpanelUser['setting.'+i] = sUser.settings[i];
    }

    if(debug){
      console.log('register', mixpanelUser);
    } else {
      mixpanel.people.set(mixpanelUser);
    }
  }

  return service;
});