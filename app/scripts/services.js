angular.module('ionicApp')

.factory('WeekrecipeSrv', function($http, $q, $localStorage, firebaseUrl, RecipeSrv, debug){
  'use strict';
  var sRecipesOfWeek = $localStorage.data.recipesOfWeek;
  var service = {
    // TODO set 1 if debug !
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
  var sRecipesFavorited = $localStorage.user.recipesFavorited;
  var service = {
    get: getRecipe,
    addToHistory: addToHistory,
    getHistory: function(){return sRecipesHistory;},
    addToFavorite: addToFavorite,
    removeFromFavorite: removeFromFavorite,
    isFavorite: isFavorite,
    getFavorites: function(){return sRecipesFavorited;},
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

  function isFavorite(recipe){
    return _.findIndex(sRecipesFavorited, {id: recipe.id}) > -1;
  }

  function addToFavorite(recipe){
    _.remove(sRecipesFavorited, {id: recipe.id});
    sRecipesFavorited.unshift(recipe);
  }

  function removeFromFavorite(recipe){
    _.remove(sRecipesFavorited, {id: recipe.id});
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

.factory('CartSrv', function($localStorage, $window, UserSrv, debug){
  var sCarts = $localStorage.user.carts;
  'use strict';
  var service = {
    hasCarts: function(){return hasCarts();},
    getAllCarts: function(){return sCarts.contents;},
    getCurrentCart: function(){return getCurrentCart();},
    createCart: function(){return createCart();},
    changeCart: function(index){return changeCart(index);},
    removeCart: function(){return removeCart(sCarts.current);},
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
    return sCarts && sCarts.contents && sCarts.contents.length > 0;
  }
  function getCurrentCart(){
    return hasCarts() ? sCarts.contents[sCarts.current] : createCart();
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
    sCarts.contents.unshift(cart);
    sCarts.current = 0;
    return cart;
  }
  function archiveCart(cart){
    if(cart){
      cart.archived = Date.now();
    }
  }
  function changeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < sCarts.contents.length){
      sCarts.current = index;
    }
    return getCurrentCart();
  }
  function removeCart(index){
    if(hasCarts() && typeof index === 'number' && -1 < index && index < sCarts.contents.length){
      sCarts.contents.splice(index, 1);
      if(sCarts.contents.length === 0){
        sCarts.current = null;
      } else if(sCarts.current === index){
        sCarts.current = 0;
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
      if(source.quantity && source.quantity.value && source.quantity.value > 0){
        if(quantity === null){
          quantity = source.quantity;
        } else {
          quantity = addQuantities(quantity, source.quantity, item);
        }
      }
    }
    return quantity;
  }
  function addQuantities(q1, q2, item){
    var q = angular.copy(q1);
    if(q1.unit === q2.unit){
      q.value += q2.value;
    } else {
      // TODO
      if(debug){
        $window.alert('Should convert <'+q2.unit+'> to <'+q1.unit+'> on <'+item.food.name+'> !!!');
        console.log('item', item);
        console.log('quantitiy 1', q1);
        console.log('quantitiy 2', q2);
      }
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
        value: UserSrv.get().settings.defaultServings,
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
      items: [],
      customItems: ''
    };
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

.factory('LoginSrv', function($rootScope, $q, $timeout, $localStorage, $firebaseSimpleLogin, UserSrv, firebaseUrl){
  'use strict';
  var sUser = $localStorage.user;
  var service = {
    isLogged: function(){return sUser.isLogged;},
    register: register,
    login: login,
    facebookConnect: facebookConnect,
    logout: logout,
    getMessage: function(error){
      return error.message.replace('FirebaseSimpleLogin: ', '');
    }
  };

  var firebaseRef = new Firebase(firebaseUrl);
  var firebaseAuth = $firebaseSimpleLogin(firebaseRef);

  var loginDefer, logoutDefer, logoutTimeout, loginMethod;

  function register(credentials){
    loginMethod = 'email';
    loginDefer = $q.defer();

    firebaseAuth.$createUser(credentials.email, credentials.password).then(function(user){
      firebaseAuth.$login('password', {
        email: credentials.email,
        password: credentials.password,
        rememberMe: true
      });
    }, function(error){
      loginDefer.reject(error);
    });

    return loginDefer.promise;
  }

  function login(credentials){
    loginMethod = 'email';
    loginDefer = $q.defer();

    firebaseAuth.$login('password', {
      email: credentials.email,
      password: credentials.password,
      rememberMe: true
    });

    return loginDefer.promise;
  }

  function facebookConnect(){
    loginMethod = 'facebook';
    loginDefer = $q.defer();
    var opts = {
      rememberMe: true,
      scope: 'email'
    };
    if(sUser && sUser.profiles && sUser.profiles[loginMethod] && sUser.profiles[loginMethod].accessToken){
      opts.access_token = sUser.profiles[loginMethod].accessToken;
    }
    firebaseAuth.$login(loginMethod, opts);
    return loginDefer.promise;
  }

  function logout(){
    logoutDefer = $q.defer();
    firebaseAuth.$logout();

    // disconnect after 1 sec even if firebase doesn't answer !
    logoutTimeout = $timeout(function(){
      console.log('logout timeout !');
      sUser.isLogged = false;
      logoutDefer.resolve();
    }, 1000);

    return logoutDefer.promise;
  }

  $rootScope.$on('$firebaseSimpleLogin:login', function(event, user){
    console.log('$firebaseSimpleLogin:login', user);
    if(loginDefer){
      sUser.isLogged = true;
      sUser.profiles[loginMethod] = user;
      UserSrv.updateProfile();
      loginDefer.resolve(user);
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:logout', function(event){
    console.log('$firebaseSimpleLogin:logout');
    if(logoutDefer){
      sUser.isLogged = false;
      clearTimeout(logoutTimeout);
      logoutDefer.resolve();
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:error', function(event, error){
    console.log('$firebaseSimpleLogin:error', error);
    if(loginDefer){loginDefer.reject(error);}
    if(logoutDefer){logoutDefer.reject(error);}
  });

  return service;
})

.factory('UserSrv', function($q, $localStorage, $http, localStorageDefault, md5){
  'use strict';
  var sUser = $localStorage.user;
  var service = {
    get: function(){return sUser;},
    setEmail: setEmail,
    updateProfile: updateProfile
  };

  function setEmail(email){
    sUser.email = email;
    if(email){
      return updateGravatar(email).then(function(){
        updateProfile();
      });
    } else {
      return $q.when();
    }
  }

  function updateProfile(){
    var defaultProfile = _defaultProfile();
    var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
    var emailProfile = _emailProfile(sUser.profiles.email);
    var facebookProfile = _facebookProfile(sUser.profiles.facebook);

    angular.extend(sUser, defaultProfile, gravatarProfile, emailProfile, facebookProfile);

    if(sUser.email !== gravatarProfile.email){
      updateGravatar(sUser.email).then(function(){
        var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
        angular.extend(sUser, defaultProfile, gravatarProfile, emailProfile, facebookProfile);
      });
    }
  }

  function updateGravatar(email){
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
    }
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

  function _emailProfile(e){
    var profile = {};
    if(e){
      if(e.email){ profile.email = e.email; }
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

  return service;
})

.factory('LaunchSrv', function($rootScope, $window, $state, $localStorage, $ionicPlatform, GamificationSrv, LogSrv, firebaseUrl){
  'use strict';
  var service = {
    launch: function(){
      var sUser = $localStorage.user;
      if(sUser && sUser.device && sUser.device.uuid){
        launch();
      } else {
        firstLaunch();
      }
    }
  };

  function firstLaunch(){
    var sUser = $localStorage.user;
    GamificationSrv.evalLevel();
    $ionicPlatform.ready(function(){
      sUser.device = _getDevice();
      LogSrv.identify(sUser.device.uuid);
      LogSrv.registerUser();
      LogSrv.trackInstall(sUser.device.uuid);
      launch();
    });
  }

  function launch(){
    var sUser = $localStorage.user;
    LogSrv.identify(sUser.device.uuid);

    // INIT is defined in top of index.html
    LogSrv.trackLaunch(sUser.device.uuid, Date.now()-INIT);

    // manage user presence in firebase
    var firebaseRef = new Firebase(firebaseUrl+'/connected');
    var userRef = firebaseRef.push(sUser);
    userRef.onDisconnect().remove();

    navigator.geolocation.getCurrentPosition(function(position){
      $localStorage.logs.launchs.unshift(position);
    }, function(error){
      error.timestamp = Date.now();
      $localStorage.logs.launchs.unshift(error);
    });

    // track state changes
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                       {params.fromUrl = $state.href(fromState.name, fromParams);}
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.toUrl = $state.href(toState.name, toParams);}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      LogSrv.trackState(params);
    });
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error){
      var params = {};
      if(fromState && fromState.name)                       {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                {params.fromParams = fromParams;}
      if(toState && toState.name)                           {params.to = toState.name;}
      if(toParams && !isEmpty(toParams))                    {params.toParams = toParams;}
      if(error && !isEmpty(error))                          {params.error = error;}
      LogSrv.trackStateError(params);
    });
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams){
      var params = {};
      if(fromState && fromState.name)                                               {params.from = fromState.name;}
      if(fromParams && !isEmpty(fromParams))                                        {params.fromParams = fromParams;}
      if(unfoundState && unfoundState.to)                                           {params.to = unfoundState.to;}
      if(unfoundState && unfoundState.toParams && !isEmpty(unfoundState.toParams))  {params.toParams = unfoundState.toParams;}
      LogSrv.trackStateNotFound(params);
    });

    // If logged, login state is forbidden !
    // If not logged, all states except intro & login are forbidden !
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
      if($localStorage.user.isLogged){
        if(toState.data && toState.data.restrict && toState.data.restrict === 'notConnected'){
          console.log('Not allowed to go to '+toState.name+' (you are connected !)');
          event.preventDefault();
          if(fromState.name === ''){$state.go('app.home');}
        }
      } else {
        if(toState.data && toState.data.restrict && toState.data.restrict === 'connected'){
          console.log('Not allowed to go to '+toState.name+' (you are not connected !)');
          event.preventDefault();
          if(fromState.name === ''){$state.go('login');}
        }
      }
    });

    // phone will not sleep on states with attribute 'noSleep'
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
      if($window.plugins && $window.plugins.insomnia){
        if(toState && toState.data && toState.data.noSleep){
          $window.plugins.insomnia.keepAwake();
        } else {
          $window.plugins.insomnia.allowSleepAgain();
        }
      }
    });
  }

  function _getDevice(){
    var device = angular.copy(ionic.Platform.device());
    delete device.getInfo;
    device.environment = _getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    if(!device.uuid){
      device.uuid = _createUuid();
    }
    return device;
  }

  function _getEnvironment(){
    if(ionic.Platform.isWebView()){return 'WebView';}
    else if(ionic.Platform.isIPad()){return 'IPad';}
    else if(ionic.Platform.isIOS()){return 'IOS';}
    else if(ionic.Platform.isAndroid()){return 'Android';}
    else if(ionic.Platform.isWindowsPhone()){return 'WindowsPhone';}
    else {return 'Unknown';}
  }

  function _createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
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

.factory('LogSrv', function($rootScope, $window, $localStorage, $state, GamificationSrv, firebaseUrl, appVersion, debug){
  'use strict';
  var buyLogsRef = new Firebase(firebaseUrl+'/logs/buy');
  var sApp = $localStorage.app;
  var sUser = $localStorage.user;
  var service = {
    identify: identify,
    registerUser: registerUser,
    trackInstall: function(user){track('install', {user: user});},
    trackLaunch: function(user, launchTime){track('launch', {user: user, launchTime: launchTime});},
    trackIntroChangeSlide: function(from, to){track('intro-change-slide', {from: from, to: to});},
    trackState: function(params){track('state', params);},
    trackStateError: function(params){track('state-error', params);},
    trackStateNotFound: function(params){track('state-not-found', params);},
    trackSetEmail: function(email){track('set-email', {email: email});},
    trackHideMessage: function(message){track('hide-message', {message: message});},
    // ??? merge trackAddRecipeToCart with trackRemoveRecipeFromCart ??? And with trackAddItemToCart or trackRemoveItemFromCart ???
    trackAddRecipeToCart: function(recipe, index, from){trackWithPosition('add-recipe-to-cart', {recipe: recipe, index: index, from: from});},
    trackRemoveRecipeFromCart: function(recipe, index, from){trackWithPosition('remove-recipe-from-cart', {recipe: recipe, index: index, from: from});},
    trackAddItemToCart: function(item, quantity, unit, missing, search){trackWithPosition('add-item-to-cart', {item: item, quantity: quantity, unit: unit, missing: missing, search: search});},
    trackRemoveItemFromCart: function(item){trackWithPosition('remove-item-from-cart', {item: item});},
    trackEditCartCustomItems: function(customItems){trackWithPosition('edit-cart-custom-items', {customItems: customItems});},
    trackAddRecipeToFavorite: function(recipe, index, from){trackWithPosition('add-recipe-to-favorite', {recipe: recipe, index: index, from: from});},
    trackRemoveRecipeFromFavorite: function(recipe, index, from){trackWithPosition('remove-recipe-from-favorite', {recipe: recipe, index: index, from: from});},
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
    trackClearApp: function(user){track('clear-app', {user: user});},
    trackError: function(id, error){track('error', {id: id, error: error});}
  };

  function trackWithPosition(event, params){
    navigator.geolocation.getCurrentPosition(function(position){
      params.position = position.coords;
      params.position.timestamp = position.timestamp;
      if(event === 'buy-item' || event === 'buy-item-source'){buyLogsRef.push(params);}
      track(event, params);
    }, function(error){
      params.position = error;
      params.position.timestamp = Date.now();
      track(event, params);
    });
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