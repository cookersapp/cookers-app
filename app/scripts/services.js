angular.module('app')

.factory('WeekrecipeSrv', function($http, $q, $localStorage, firebaseUrl, RecipeSrv, debug){
  'use strict';
  var sRecipesOfWeek = $localStorage.data.recipesOfWeek;
  var service = {
    getCurrent: function(){ return getRecipesOfWeek(moment().week()+(debug ? 1 : 0)); },
    get: getRecipesOfWeek,
    store: storeRecipesOfWeek
  };

  function getRecipesOfWeek(week){
    var weekrecipes = _.find(sRecipesOfWeek, {id: week.toString()});
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
    sRecipesOfWeek.push(weekrecipes);
  }

  return service;
})

.factory('RecipeSrv', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var sRecipes = $localStorage.data.recipes;
  var sRecipesHistory = $localStorage.logs.recipesHistory;
  var service = {
    get: getRecipe,
    addToHistory: addToHistory,
    getHistory: function(){return sRecipesHistory;},
    store: storeRecipe
  };

  function getRecipe(recipeId){
    var recipe = _.find(sRecipes, {id: recipeId});
    if(recipe){
      return $q.when(recipe);
    } else {
      return downloadRecipe(recipeId);
    }
  }

  function addToHistory(recipe){
    _.remove(sRecipesHistory, {id: recipe.id});
    sRecipesHistory.unshift(recipe);
  }

  function downloadRecipe(recipeId){
    return $http.get(firebaseUrl+'/recipes/'+recipeId+'.json').then(function(result){
      storeRecipe(result.data);
      return result.data;
    });
  }

  function storeRecipe(recipe){
    sRecipes.push(recipe);
  }

  return service;
})

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

.factory('UserSrv', function($q, $localStorage, $http, localStorageDefault, md5){
  'use strict';
  var sUser = $localStorage.user;
  var service = {
    get: function(){return sUser;},
    hasMail: hasMail,
    setEmail: setEmail,
    updateProfile: updateProfile
  };

  function hasMail(){
    return sUser && sUser.email && sUser.email.length > 0;
  }

  function setEmail(email){
    sUser.email = email;
    if(email){
      return _updateGravatar(email).then(function(){
        updateProfile();
      });
    } else {
      return $q.when();
    }
  }

  function updateProfile(){
    var defaultProfile = _defaultProfile();
    var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
    var passwordProfile = _passwordProfile(sUser.profiles.password);
    var twitterProfile = _twitterProfile(sUser.profiles.twitter);
    var facebookProfile = _facebookProfile(sUser.profiles.facebook);
    var googleProfile = _googleProfile(sUser.profiles.google);

    angular.extend(sUser, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);

    if(sUser.email !== gravatarProfile.email){
      _updateGravatar(sUser.email).then(function(){
        var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
        angular.extend(sUser, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);
      });
    }
  }

  function _updateGravatar(email){
    if(email && email.length > 0){
      var hash = md5.createHash(email);
      return $http.jsonp('http://www.gravatar.com/'+hash+'.json?callback=JSON_CALLBACK').then(function(result){
        var g = result.data;
        if(g && g.entry && g.entry.length > 0){
          g.entry[0].email = email;
        }
        sUser.profiles.gravatar = g;
      }, function(error){
        sUser.profiles.gravatar = {
          entry: [
            {email: email, hash: hash}
          ]
        };
      });
    } else {
      return $q.when();
    }
  }

  function _defaultProfile(){
    return {
      email: localStorageDefault.user.email,
      name: localStorageDefault.user.name,
      avatar: localStorageDefault.user.avatar,
      background: localStorageDefault.user.background,
      backgroundCover: localStorageDefault.user.backgroundCover,
      firstName: localStorageDefault.user.firstName,
      lastName: localStorageDefault.user.lastName
    };
  }

  function _gravatarProfile(g){
    var profile = {};
    if(g && g.entry && g.entry.length > 0){
      if(g.entry[0].email){        profile.email = g.entry[0].email; }
      if(g.entry[0].displayName) { profile.name = g.entry[0].displayName; }
      if(g.entry[0].thumbnailUrl){ profile.avatar = g.entry[0].thumbnailUrl; }
      if(g.entry[0].name){
        if(g.entry[0].name.givenName){  profile.firstName = g.entry[0].name.givenName; }
        if(g.entry[0].name.familyName){ profile.lastName = g.entry[0].name.familyName; }
        // override displayName
        if(g.entry[0].name.formatted){profile.name = g.entry[0].name.formatted;}
      }
      if(g.entry[0].profileBackground){
        if(g.entry[0].profileBackground.color) { profile.background = g.entry[0].profileBackground.color; }
        if(g.entry[0].profileBackground.url)   { profile.backgroundCover = g.entry[0].profileBackground.url; }
      }
    }
    return profile;
  }

  function _passwordProfile(p){
    var profile = {};
    if(p){
      if(p.email){ profile.email = p.email; }
    }
    return profile;
  }

  function _twitterProfile(t){
    var profile = {};
    if(t){
      if(t.displayName){ profile.name = t.displayName; }
      if(t.thirdPartyUserData){
        if(t.thirdPartyUserData.profile_image_url){  profile.avatar = t.thirdPartyUserData.profile_image_url.replace('_normal.', '_bigger.'); }
        if(t.thirdPartyUserData.profile_background_color){  profile.background = '#'+t.thirdPartyUserData.profile_background_color; }
        if(t.thirdPartyUserData.profile_background_image_url_https){  profile.backgroundCover = t.thirdPartyUserData.profile_background_image_url_https; }
      }
    }
    return profile;
  }

  function _facebookProfile(f){
    var profile = {};
    if(f){
      if(f.displayName){ profile.name = f.displayName; }
      if(f.thirdPartyUserData){
        if(f.thirdPartyUserData.email){      profile.email = f.thirdPartyUserData.email; }
        if(f.thirdPartyUserData.first_name){ profile.firstName = f.thirdPartyUserData.first_name; }
        if(f.thirdPartyUserData.last_name){  profile.lastName = f.thirdPartyUserData.last_name; }
        if(f.thirdPartyUserData.picture && f.thirdPartyUserData.picture.data && f.thirdPartyUserData.picture.data.url){
          profile.avatar = f.thirdPartyUserData.picture.data.url.replace('p50x50', 'p100x100');
        }
      }
    }
    return profile;
  }

  function _googleProfile(g){
    var profile = {};
    if(g){
      if(g.displayName){ profile.name = g.displayName; }
      if(g.email){ profile.email = g.email; }
      if(g.thirdPartyUserData){
        if(g.thirdPartyUserData.given_name){  profile.firstName = g.thirdPartyUserData.given_name; }
        if(g.thirdPartyUserData.family_name){ profile.lastName = g.thirdPartyUserData.family_name; }
        if(g.thirdPartyUserData.picture){     profile.avatar = g.thirdPartyUserData.picture; }
      }
    }
    return profile;
  }

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

.factory('GamificationSrv', function($localStorage){
  'use strict';
  var sScore = $localStorage.user ? $localStorage.user.score : null;
  var service = {
    evalLevel: evalLevel,
    sendEvent: sendEvent
  };

  var levels = [
    {score: 0, html: '<i class="fa fa-eye"></i> Explorateur'},
    {score: 10, html: '<i class="fa fa-thumbs-o-up"></i> Testeur'},
    {score: 30, html: '<i class="fa fa-graduation-cap"></i> Cuisinier'},
    {score: 80, html: '<i class="fa fa-university"></i> Chef'},
    {score: 150, html: '<i class="fa fa-trophy"></i> Grand chef'}
  ];

  function evalLevel(){
    if(!sScore){sScore = $localStorage.user.score;}
    _setUserLevel();
  }

  function sendEvent(event, params){
    if(event === 'add-recipe-to-cart'){       _addScore(1, event, params);  }
    if(event === 'remove-recipe-from-cart'){  _addScore(-1, event, params); }
    if(event === 'add-item-to-cart'){         _addScore(1, event, params);  }
    if(event === 'remove-item-from-cart'){    _addScore(-1, event, params); }
    if(event === 'archive-cart'){             _addScore(3, event, params);  }
    if(event === 'state' && params.to === 'app.feedback' && _.find(sScore.events, {event:event, params:{to:params.to}}) === undefined){
      _addScore(2, event, params);
    }
  }

  function _addScore(value, event, params){
    sScore.events.push({
      time: Date.now(),
      event: event,
      params: params
    });
    sScore.value += value;
    if(sScore.value > sScore.level.next){
      _setUserLevel();
    }
  }

  function _setUserLevel(){
    var index = _getLevelIndex(sScore.value);
    sScore.level = {
      index: index,
      score: levels[index].score,
      html: levels[index].html,
      next: index < levels.length-1 ? levels[index+1].score : levels[index].score
    };
  }

  function _getLevelIndex(score){
    var i = 0;
    while(levels[i].score < score && i < levels.length){
      i++;
    }
    return i > 0 ? i-1 : 0;
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