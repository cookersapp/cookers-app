angular.module('ionicApp')

.factory('WeekrecipeSrv', function($http, $q, $localStorage, firebaseUrl, RecipeSrv){
  'use strict';
  var service = {
    getCurrent: function(){ return getRecipesOfWeek(moment().week()); },
    get: getRecipesOfWeek,
    store: storeRecipesOfWeek
  };

  function getRecipesOfWeek(week){
    var weekrecipe = _.find($localStorage.weekrecipes, {id: week.toString()});
    if(weekrecipe){
      return $q.when(weekrecipe);
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

  function storeRecipesOfWeek(weekrecipe){
    $localStorage.weekrecipes.push(weekrecipe);
  }

  return service;
})

.factory('RecipeSrv', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var service = {
    get: getRecipe,
    store: storeRecipe
  };

  function getRecipe(recipeId){
    var recipe = _.find($localStorage.recipes, {id: recipeId});
    if(recipe){
      return $q.when(recipe);
    } else {
      return downloadRecipe(recipeId);
    }
  }

  function downloadRecipe(recipeId){
    return $http.get(firebaseUrl+'/recipes/'+recipeId+'.json').then(function(result){
      storeRecipe(result.data);
      return result.data;
    });
  }

  function storeRecipe(recipe){
    $localStorage.recipes.push(recipe);
  }

  return service;
})

.factory('FoodSrv', function($http, $q, $localStorage, firebaseUrl){
  'use strict';
  var foods = $localStorage.foods;
  var service = {
    getAll: getAll
  };

  function getAll(){
    if(!foods || foods.length === 0){
      return downloadFoods();
    } else {
      downloadFoods();
      return $q.when(foods);
    }
  }

  function downloadFoods(){
    return $http.get(firebaseUrl+'/foods.json').then(function(result){
      // problem : don't remove deleted food...
      for(var i in result.data){
        storeFood(result.data[i]);
      }
      return foods;
    });
  }

  function storeFood(food){
    var index = _.findIndex(foods, {id: food.id});
    if(index > -1){
      angular.copy(food, foods[index]);
    } else {
      foods.push(food);
    }
  }

  return service;
})

.factory('CartSrv', function($localStorage, UserSrv){
  'use strict';
  var service = {
    hasCarts: function(){return hasCarts();},
    getAllCarts: function(){return $localStorage.carts.contents;},
    getCurrentCart: function(){return getCurrentCart();},
    createCart: function(){return createCart();},
    changeCart: function(index){return changeCart(index);},
    removeCart: function(){return removeCart($localStorage.carts.current);},
    cartHasRecipe: function(recipe){return cartHasRecipe(getCurrentCart(), recipe);},
    addRecipeToCart: function(recipe){addRecipeToCart(getActiveCart(), recipe);},
    removeRecipeFromCart: function(recipe){removeRecipeFromCart(getCurrentCart(), recipe);},
    addCustomItemToCart: function(item){addCustomItemToCart(getActiveCart(), item);},
    removeCustomItemFromCart: function(item){removeCustomItemFromCart(getCurrentCart(), item);},
    buyCartItem: function(item){buyCartItem(item, getCurrentCart(), true);},
    buyCartItemSource: function(source, item){buyCartItemSource(source, item, getCurrentCart(), true);},
    unbuyCartItem: function(item){buyCartItem(item, getCurrentCart(), false);},
    getCurrentCartItems: function(){return getCurrentCartItems(false);},
    getCurrentCartBoughtItems: function(){return getCurrentCartItems(true);},
    archiveCart: function(){return archiveCart(getCurrentCart());}
  };

  function hasCarts(){
    return $localStorage.carts && $localStorage.carts.contents && $localStorage.carts.contents.length > 0;
  }
  function getCurrentCart(){
    return hasCarts() ? $localStorage.carts.contents[$localStorage.carts.current] : null;
  }
  function getActiveCart(){
    var cart = getCurrentCart();
    if(cart === null || cart.archived){
      return createCart();
    } else {
      return cart;
    }
  }
  function createCart(){
    var cart = buildCart();
    $localStorage.carts.contents.unshift(cart);
    $localStorage.carts.current = 0;
    return getCurrentCart();
  }
  function archiveCart(cart){
    if(cart){
      cart.archived = Date.now();
    }
  }
  function changeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < $localStorage.carts.contents.length){
      $localStorage.carts.current = index;
    }
    return getCurrentCart();
  }
  function removeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < $localStorage.carts.contents.length){
      $localStorage.carts.contents.splice(index, 1);
      if($localStorage.carts.contents.length === 0){
        $localStorage.carts.current = null;
      } else if($localStorage.carts.current === index){
        $localStorage.carts.current = 0;
      }
    }
    return getCurrentCart();
  }

  function cartHasRecipe(cart, recipe){
    return cart && !cart.archived && cart.recipes && recipe && recipe.id && _.findIndex(cart.recipes, {id: recipe.id}) > -1;
  }
  function addRecipeToCart(cart, recipe){
    if(cart){
      cart.recipes.push(buildCartRecipe(recipe));
    }
  }
  function removeRecipeFromCart(cart, recipe){
    if(cart){
      _removeFromArrayWithFinder(cart.recipes, {id: recipe.id});
    }
  }
  function addCustomItemToCart(cart, item){
    if(cart){
      cart.items.push(buildCartCustomItem(item));
    }
  }
  function removeCustomItemFromCart(cart, item){
    if(cart){
      _removeFromArrayWithFinder(cart.items, {id: item.ingredient.id, added: item.ingredient.added});
    }
  }
  function _removeFromArrayWithFinder(array, finder){
    var index = _.findIndex(array, finder);
    if(index > -1){
      array.splice(index, 1);
    }
  }
  function buyCartItem(item, cart, bought){
    for(var i in item.sources){
      buyCartItemSource(item.sources[i], item, cart, bought);
    }
  }
  function buyCartItemSource(source, item, cart, bought){
    if(source && source.recipe && source.recipe.id){
      var recipe = _.find(cart.recipes, {id: source.recipe.id});
      if(recipe){
        var ingredient = _.find(recipe.data.ingredients, {food: {id: source.ingredient.food.id}});
        buyIngredient(ingredient, recipe, bought);
      }
    } else if(source && source.ingredient && source.ingredient.food && source.ingredient.food.id){
      var cartItem = _.find(cart.items, {id: source.ingredient.id, added: source.ingredient.added});
      buyIngredient(cartItem, null, bought);
    }
  }
  function buyIngredient(ingredient, recipe, bought){
    if(ingredient){
      if(bought) {
        ingredient.bought = true;
        navigator.geolocation.getCurrentPosition(function(position){
          ingredient.bought = position;
        }, function(error){
          error.timestamp = Date.now();
          ingredient.bought = error;
        });
      } else {
        ingredient.bought = false;
      }
    }
  }
  function getCurrentCartItems(bought){
    var items = [];
    foreachIngredientInCart(getCurrentCart(), function(ingredient, recipeItem){
      if(bought === !!ingredient.bought){
        var item = _.find(items, {food: {id: ingredient.food.id}});
        if(item){
          item.sources.push(buildCartItemSource(ingredient, recipeItem, bought));
          item.quantity = computeCartItemQuantity(item);
        } else {
          items.push(buildCartItem(ingredient, recipeItem, bought));
        }
      }
    });
    items.sort(function(a, b){
      if(a.food.category > b.food.category){return 1;}
      else if(a.food.category < b.food.category){return -1;}
      else if(a.name > b.name){return 1;}
      else if(a.name < b.name){return -1;}
      else {return 0;}
    });
    return items;
  }
  function computeCartItemQuantity(item){
    var quantity = null;
    for(var i in item.sources){
      var source = item.sources[i];
      if(quantity === null){
        quantity = source.quantity;
      } else {
        quantity = addQuantities(quantity, source.quantity);
      }
    }
    return quantity;
  }
  function addQuantities(q1, q2){
    var q = angular.copy(q1);
    if(q1.unit === q2.unit){
      q.value += q2.value;
    } else {
      // TODO
      window.alert('Should convert <'+q2.unit+'> to <'+q1.unit+'> !!!');
    }
    return q;
  }
  function getQuantityForServings(quantity, initialServings, finalServings){
    var q = angular.copy(quantity);
    q.value = q.value * finalServings.value / initialServings.value;
    return q;
  }

  function foreachIngredientInCart(cart, callback){
    if(cart && cart.recipes){
      for(var i in cart.recipes){
        var recipeItem = cart.recipes[i];
        for(var j in recipeItem.data.ingredients){
          callback(recipeItem.data.ingredients[j], recipeItem, cart);
        }
      }
    }
    if(cart && cart.items){
      for(var k in cart.items){
        callback(cart.items[k], null, cart);
      }
    }
  }

  function buildCartItemSource(ingredient, recipeItem, bought){
    if(recipeItem){
      return {
        bought: bought,
        quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
        ingredient: ingredient,
        recipe: recipeItem
      };
    } else {
      return {
        bought: bought,
        quantity: angular.copy(ingredient.quantity),
        ingredient: ingredient
      };
    }
  }
  function buildCartItem(ingredient, recipeItem, bought){
    if(recipeItem){
      return {
        quantity: getQuantityForServings(ingredient.quantity, recipeItem.data.servings, recipeItem.servings),
        food: ingredient.food,
        bought: bought,
        sources: [buildCartItemSource(ingredient, recipeItem, bought)]
      };
    } else {
      return {
        quantity: ingredient.quantity,
        food: ingredient.food,
        bought: bought,
        sources: [buildCartItemSource(ingredient, recipeItem, bought)]
      };
    }
  }
  function buildCartCustomItem(item){
    return {
      added: Date.now(),
      id: item.product.id,
      quantity: {
        value: item.quantity,
        unit: item.unit
      },
      food: angular.copy(item.product)
    };
  }
  function buildCartRecipe(recipe){
    return {
      added: Date.now(),
      id: recipe.id,
      servings: {
        value: UserSrv.getProfile().defaultServings,
        unit: recipe.servings.unit
      },
      data: recipe
    };
  }
  function buildCart(){
    return {
      created: Date.now(),
      archived: false,
      name: 'Liste du '+moment().format('LL'),
      recipes: [],
      items: []
    };
  }

  return service;
})

.factory('UserSrv', function($localStorage, $ionicPlatform, $http, GamificationSrv, LogSrv, firebaseUrl, md5){
  'use strict';
  var currentUser = $localStorage.user;
  var service = {
    get: function(){return $localStorage.user;},
    getProfile: function(){return $localStorage.user.profile;},
    setMail: setMail,
    setDefaultServings: setDefaultServings,
    isFirstLaunch: function(){return !(currentUser && currentUser.device && currentUser.device.uuid);},
    firstLaunch: firstLaunch,
    launch: launch
  };

  function firstLaunch(){
    if(!currentUser){currentUser = $localStorage.user;}
    GamificationSrv.initScore();
    $ionicPlatform.ready(function(){
      currentUser.device = actualDevice();
      launch();
    });
  }

  function launch(){
    LogSrv.identify(currentUser.device.uuid);
    function addLaunch(user, launch){
      user.launchs.unshift(launch);
      var firebaseRef = new Firebase(firebaseUrl+'/connected');
      var userRef = firebaseRef.push(user);
      userRef.onDisconnect().remove();
    }

    navigator.geolocation.getCurrentPosition(function(position){
      addLaunch(currentUser, position);
    }, function(error){
      error.timestamp = Date.now();
      addLaunch(currentUser, error);
    });
  }

  function setMail(mail, callback){
    currentUser.profile.mail = mail;
    currentUser.profile.name = 'Anonymous';
    currentUser.profile.avatar = 'images/user.jpg';
    if(mail){
      $http.jsonp('http://www.gravatar.com/'+md5.createHash(mail)+'.json?callback=JSON_CALLBACK').then(function(result){
        currentUser.gravatar = result.data;
        if(currentUser && currentUser.gravatar && currentUser.gravatar.entry && currentUser.gravatar.entry.length > 0){
          if(currentUser.gravatar.entry[0].thumbnailUrl){ currentUser.profile.avatar = currentUser.gravatar.entry[0].thumbnailUrl; }
          if(currentUser.gravatar.entry[0].displayName) { currentUser.profile.name = currentUser.gravatar.entry[0].displayName; }
        }
        if(callback){callback();}
      });
    }
  }

  function setDefaultServings(defaultServings){
    currentUser.profile.defaultServings = defaultServings;
  }

  function actualDevice(){
    var device = angular.copy(ionic.Platform.device());
    delete device.getInfo;
    device.environment = getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    if(!device.uuid){
      device.uuid = createUuid();
    }
    return device;
  }

  function getEnvironment(){
    if(ionic.Platform.isWebView()){return 'WebView';}
    else if(ionic.Platform.isIPad()){return 'IPad';}
    else if(ionic.Platform.isIOS()){return 'IOS';}
    else if(ionic.Platform.isAndroid()){return 'Android';}
    else if(ionic.Platform.isWindowsPhone()){return 'WindowsPhone';}
    else {return 'Unknown';}
  }

  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  return service;
})

// TODO : rename this service more explicitly (and localstorage value and mixpanel event and firebase endpoint...)
.factory('UserInfoSrv', function($q, $http, $localStorage, firebaseUrl, debug){
  'use strict';
  var userinfo = $localStorage.userinfo;
  var service = {
    messageToDisplay: messageToDisplay
  };

  function messageToDisplay(){
    var message = messageQueued();
    if(message){
      fetchMessages();
      return $q.when(message);
    } else {
      return fetchMessages().then(function(){
        return messageQueued();
      });
    }
  }

  function messageQueued(){
    return _.find(userinfo.messages, function(msg){
      return !msg.hide;
    });
  }

  function fetchMessages(){
    return $http.get(firebaseUrl+'/userinfos.json').then(function(result){
      var messages = _.filter(result.data, function(msg){
        return msg && (msg.isProd || debug) && !isMessageQueued(msg);
      });
      userinfo.messages = userinfo.messages.concat(messages);
      // sort chronogically
      userinfo.messages.sort(function(a,b){
        return a.added - b.added;
      });
    });
  }

  function isMessageQueued(message){
    return message && message.added && _.findIndex(userinfo.messages, {added: message.added}) > -1;
  }

  return service;
})

.factory('MailSrv', function($http, $q, mandrillUrl, mandrillKey, supportTeamMail){
  'use strict';
  var service = {
    sendFeedback: sendFeedback
  };

  function sendFeedback(mail, feedback){
    return $http.post(mandrillUrl+'/messages/send.json', {
      'key': mandrillKey,
      'message': {
        'subject': '[Cookers] Feedback from app',
        'text': feedback,
        //'html': '<p>'+feedback+'</p>',
        'from_email': mail,
        'to': [
          {'email': supportTeamMail, 'name': 'Cookers team'}
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

.factory('GamificationSrv', function($localStorage){
  'use strict';
  var userScore = $localStorage.user ? $localStorage.user.profile.score : null;
  var service = {
    initScore: initScore,
    sendEvent: sendEvent
  };

  var levels = [
    {score: 0, html: '<i class="fa fa-eye"></i> Explorateur'},
    {score: 10, html: '<i class="fa fa-thumbs-o-up"></i> Testeur'},
    {score: 30, html: '<i class="fa fa-graduation-cap"></i> Cuisinier'},
    {score: 80, html: '<i class="fa fa-university"></i> Chef'},
    {score: 150, html: '<i class="fa fa-trophy"></i> Grand chef'}
  ];

  function initScore(){
    if(!userScore){userScore = $localStorage.user.profile.score;}
    userScore.value = 0;
    userScore.events = [];
    _setUserLevel();
  }

  function sendEvent(event, params){
    if(event === 'add-recipe-to-cart'){       _addScore(1, event, params);  }
    if(event === 'remove-recipe-from-cart'){  _addScore(-1, event, params); }
    if(event === 'add-item-to-cart'){         _addScore(1, event, params);  }
    if(event === 'remove-item-from-cart'){    _addScore(-1, event, params); }
    if(event === 'archive-cart'){             _addScore(3, event, params);  }
    if(event === 'state' && params.to === 'app.feedback' && _.find(userScore.events, {event:event, params:{to:params.to}}) === undefined){
      _addScore(2, event, params);
    }
  }
  
  function _addScore(value, event, params){
    userScore.events.push({
      time: Date.now(),
      event: event,
      params: params
    });
    userScore.value += value;
    if(userScore.value > userScore.nextLevel){
      _setUserLevel();
    }
  }
  
  function _setUserLevel(){
    var index = _getLevelIndex(userScore.value);
    userScore.level = index;
    userScore.levelScore = levels[index].score;
    userScore.levelHtml = levels[index].html;
    userScore.nextLevel = index < levels.length-1 ? levels[index+1].score : levels[index].score;
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

.factory('LogSrv', function($rootScope, $localStorage, $state, GamificationSrv, firebaseUrl, appVersion, debug){
  'use strict';
  var buyLogsRef = new Firebase(firebaseUrl+'/logs/buy');
  var currentUser = $localStorage.user;
  var service = {
    identify: identify,
    registerUser: registerUser,
    trackLaunch: function(user){track('launch', {user: user});},
    trackIntroChangeSlide: function(from, to){track('intro-change-slide', {from: from, to: to});},
    trackState: function(params){track('state', params);},
    trackStateError: function(params){track('state-error', params);},
    trackStateNotFound: function(params){track('state-not-found', params);},
    trackSetMail: function(mail){track('set-mail', {mail: mail});},
    trackToggleMenu: function(action){track('toggle-menu', {action: action});},
    trackCloseMessageInfo: function(message){track('close-message-info', {message: message});},
    // ??? merge trackAddRecipeToCart with trackRemoveRecipeFromCart ??? And with trackAddItemToCart or trackRemoveItemFromCart ???
    trackAddRecipeToCart: function(recipe, index, from){track('add-recipe-to-cart', {recipe: recipe, index: index, from: from});},
    trackRemoveRecipeFromCart: function(recipe, index, from){track('remove-recipe-from-cart', {recipe: recipe, index: index, from: from});},
    trackAddItemToCart: function(item, quantity, unit, missing, search){track('add-item-to-cart', {item: item, quantity: quantity, unit: unit, missing: missing, search: search});},
    trackRemoveItemFromCart: function(item){track('remove-item-from-cart', {item: item});},
    // ??? merge trackCartRecipeDetails with trackCartItemDetails ???
    trackCartRecipeDetails: function(recipe, action){track('cart-recipe-details', {recipe: recipe, action: action});},
    trackCartItemDetails: function(item, action){track('cart-item-details', {item: item, action: action});},
    trackBuyItem: function(item){trackWithPosition('buy-item', {item: item});},
    trackBuyItemSource: function(item, recipe){trackWithPosition('buy-item-source', {item: item, recipe: recipe});},
    trackUnbuyItem: function(item){track('unbuy-item', {item: item});},
    trackArchiveCart: function(){track('archive-cart');},
    trackSendFeedback: function(mail){track('send-feedback', {mail: mail});},
    trackOpenUservoice: function(){track('open-uservoice');},
    trackChangeSetting: function(setting, value){track('change-setting', {setting: setting, value: value});},
    trackStates: trackStates,
  };

  function trackStates(){
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                       {params.fromUrl = $state.href(fromState.name, fromParams);}
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.toUrl = $state.href(toState.name, toParams);}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      service.trackState(params);
    });
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
      var params = {};
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      if(error && !isEmpty(error))                          {params.error = error;}
      service.trackStateError(params);
    });
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                                               {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                                        {params.fromParams = fromParams;}
      if(unfoundState && unfoundState.to)                                           {params.to = unfoundState.to;}
      if(unfoundState && unfoundState.toParams && !isEmpty(unfoundState.toParams))  {params.toParams = unfoundState.toParams;}
      service.trackStateNotFound(params);
    });
  }

  function trackWithPosition(event, params){
    navigator.geolocation.getCurrentPosition(function(position){
      event.position = position.coords;
      event.position.timestamp = position.timestamp;
      if(event === 'buy-item' || event === 'buy-item-source'){buyLogsRef.push(params);}
      track(event, params);
    }, function(error){
      event.position = error;
      event.position.timestamp = Date.now();
      track(event, params);
    });
  }

  function track(event, params){
    if(!params){params = {};}
    params.localtime = Date.now();
    params.appVersion = appVersion;
    if(!params.url && window && window.location && window.location.hash) {params.url = window.location.hash;}
    if(!params.mail && currentUser && currentUser.profile && currentUser.profile.mail){params.mail = currentUser.profile.mail;}
    if(currentUser && currentUser.device){
      if(!params.uuid && currentUser.device.uuid){params.uuid = currentUser.device.uuid;}
      if(!params.device && currentUser.device.model && currentUser.device.platform && currentUser.device.version){
        params.device = {
          model: currentUser.device.model,
          platform: currentUser.device.platform,
          version: currentUser.device.version
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
    service.trackLaunch(id);
  }

  function registerUser(){
    var mixpanelUser = {
      $created: moment(currentUser.profile.firstLaunch).format('LLLL'),
      $email: currentUser.profile.mail,
      fullName: currentUser.profile.name,
      avatar: currentUser.profile.avatar
    };
    if(currentUser && currentUser.gravatar && currentUser.gravatar.entry && currentUser.gravatar.entry.length > 0){
      if(currentUser.gravatar.entry[0].hash)            { mixpanelUser.gravatar = currentUser.gravatar.entry[0].hash; }
      if(currentUser.gravatar.entry[0].aboutMe)         { mixpanelUser.about = currentUser.gravatar.entry[0].aboutMe; }
      if(currentUser.gravatar.entry[0].currentLocation) { mixpanelUser.location = currentUser.gravatar.entry[0].currentLocation; }
      if(currentUser.gravatar.entry[0].name){
        if(currentUser.gravatar.entry[0].name.givenName) { mixpanelUser.$first_name = currentUser.gravatar.entry[0].name.givenName; }
        if(currentUser.gravatar.entry[0].name.familyName){ mixpanelUser.$last_name = currentUser.gravatar.entry[0].name.familyName; }
      }
    }
    for(var i in currentUser.settings){
      mixpanelUser['setting.'+i] = currentUser.settings[i];
    }

    if(debug){
      console.log('register', mixpanelUser);
    } else {
      console.log('register', mixpanelUser);
      mixpanel.people.set(mixpanelUser);
    }
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  return service;
});