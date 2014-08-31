angular.module('app')

.factory('BackendSrv', function($q, $http, StorageSrv, firebaseUrl){
  'use strict';
  var service = {
    getRecipe: getRecipe,
    getSelection: getSelection,
    getMessages: getMessages
  };

  var foodCategories = [
    {id: 1, order: 1, name: 'Fruits & Légumes'},
    {id: 2, order: 2, name: 'Viandes & Poissons'},
    {id: 3, order: 3, name: 'Frais'},
    {id: 4, order: 4, name: 'Pains & Pâtisseries'},
    {id: 5, order: 5, name: 'Épicerie salée'},
    {id: 6, order: 6, name: 'Épicerie sucrée'},
    {id: 7, order: 7, name: 'Boissons'},
    {id: 8, order: 8, name: 'Bio'},
    {id: 9, order: 9, name: 'Bébé'},
    {id: 10, order: 10, name: 'Hygiène & Beauté'},
    {id: 11, order: 11, name: 'Entretien & Nettoyage'},
    {id: 12, order: 12, name: 'Animalerie'},
    {id: 13, order: 13, name: 'Bazar & Textile'},
    {id: 14, order: 14, name: 'Surgelés'}
  ];
  for(var i in foodCategories){
    foodCategories[i].slug = getSlug(foodCategories[i].name);
  }

  function getRecipe(id){
    var recipe = StorageSrv.getRecipe(id);
    if(recipe){
      return $q.when(recipe);
    } else {
      return $http.get(firebaseUrl+'/recipes/'+id+'.json').then(function(result){
        var recipe = result.data;
        if(recipe && recipe.ingredients){
          for(var i in recipe.ingredients){
            var ing = recipe.ingredients[i];
            if(ing && ing.food && ing.food.category && typeof ing.food.category === 'string'){
              var cat = _.find(foodCategories, {name: ing.food.category});
              if(cat){
                ing.food.category = angular.copy(cat);
              } else {
                ing.food.category = {
                  id: 15,
                  order: 15,
                  name: ing.food.category,
                  slug: getSlug(ing.food.category)
                };
              }
            }
          }
        }
        StorageSrv.addRecipe(recipe);
        return recipe;
      });
    }
  }

  function getSelection(id){
    var selection = StorageSrv.getSelection(id);
    if(selection){
      return $q.when(selection);
    } else {
      return $http.get(firebaseUrl+'/selections/'+id+'.json').then(function(result){
        return loadFullSelection(result.data);
      }).then(function(selection){
        StorageSrv.addSelection(selection);
        return selection;
      });
    }
  }

  function loadFullSelection(selection){
    if(selection && selection.recipes){
      var recipePromises = [];
      for(var i in selection.recipes){
        recipePromises.push(getRecipe(selection.recipes[i].id));
      }
      return $q.all(recipePromises).then(function(recipes){
        selection.recipes = recipes;
        return selection;
      });
    } else {
      return $q.when(selection);
    }
  }

  function getMessages(){
    return $http.get(firebaseUrl+'/globalmessages.json').then(function(result){
      return result.data;
    });
  }

  return service;
})

.factory('LoginSrv', function($rootScope, $q, $timeout, StorageSrv, $firebaseSimpleLogin, UserSrv, firebaseUrl){
  'use strict';
  var service = {
    isLogged: function(){return StorageSrv.getUser().isLogged;},
    register: register,
    login: login,
    facebookConnect: facebookConnect,
    twitterConnect: twitterConnect,
    googleConnect: googleConnect,
    logout: logout
  };

  var firebaseRef = new Firebase(firebaseUrl);
  var firebaseAuth = $firebaseSimpleLogin(firebaseRef);

  var loginDefer, logoutDefer, logoutTimeout, loginMethod;

  function register(credentials){
    loginMethod = 'password';
    loginDefer = $q.defer();

    firebaseAuth.$createUser(credentials.email, credentials.password).then(function(user){
      firebaseAuth.$login(loginMethod, {
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
    var opts = {
      email: credentials.email,
      password: credentials.password
    };
    return connect('password', opts);
  }

  function facebookConnect(){
    var provider = 'facebook';
    var opts = {
      scope: 'email'
    };
    var socialProfile = StorageSrv.getUserProfile(provider);
    if(socialProfile && socialProfile.accessToken){
      opts.access_token = socialProfile.accessToken;
    }
    return connect(provider, opts);
  }

  function twitterConnect(){
    var provider = 'twitter';
    var opts = {};
    var socialProfile = StorageSrv.getUserProfile(provider);
    if(socialProfile && socialProfile.accessToken){
      opts.oauth_token = socialProfile.accessToken;
      opts.oauth_token_secret = socialProfile.accessTokenSecret;
      opts.user_id = socialProfile.id;
    }
    return connect(provider, opts);
  }

  function googleConnect(){
    return connect('google', {});
  }

  function connect(provider, opts){
    loginMethod = provider;
    loginDefer = $q.defer();
    opts.rememberMe = true;
    firebaseAuth.$login(loginMethod, opts);
    return loginDefer.promise;
  }

  function logout(){
    logoutDefer = $q.defer();
    firebaseAuth.$logout();

    // disconnect after 1 sec even if firebase doesn't answer !
    logoutTimeout = $timeout(function(){
      var user = StorageSrv.getUser();
      user.isLogged = false;
      StorageSrv.saveUser(user);
      logoutDefer.resolve();
    }, 1000);

    return logoutDefer.promise;
  }

  $rootScope.$on('$firebaseSimpleLogin:login', function(event, userData){
    if(loginDefer){
      var user = StorageSrv.getUser();
      var userProfiles = StorageSrv.getUserProfiles();
      user.isLogged = true;
      user.loggedWith = loginMethod;
      userProfiles[loginMethod] = userData;
      StorageSrv.saveUserProfiles(userProfiles);
      UserSrv.updateUserProfile(user, userProfiles);
      loginDefer.resolve(user);
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:logout', function(event){
    if(logoutDefer){
      $timeout.cancel(logoutTimeout);
      var user = StorageSrv.getUser();
      user.isLogged = false;
      StorageSrv.saveUser(user);
      logoutDefer.resolve();
    }
  });
  $rootScope.$on('$firebaseSimpleLogin:error', function(event, error){
    var err = { provider: loginMethod };
    if(error.code){err.code = error.code;}
    err.message = error.message ? error.message.replace('FirebaseSimpleLogin: ', '') : 'Unexpected error occur :(';
    if(loginDefer){loginDefer.reject(err);}
    if(logoutDefer){logoutDefer.reject(err);}
  });

  return service;
});
