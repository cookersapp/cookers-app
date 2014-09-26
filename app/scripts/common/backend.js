angular.module('app')

.factory('BackendUserSrv', function($q, $http, firebaseUrl){
  'use strict';
  var service = {
    getUserId: getUserId,
    getUser: getUser,
    saveUser: saveUser
  };

  function getUserId(email){
    var emailUri = _mailUri(email);
    if(emailUri.length > 0){
      return $http.get(firebaseUrl+'/userrefs/'+emailUri+'.json').then(function(result){
        if(result.data !== 'null'){
          return result.data.id;
        }
      });
    } else {
      return $q.when();
    }
  }

  function getUser(id){
    if(id && id.length > 0){
      return $http.get(firebaseUrl+'/users/'+id+'.json').then(function(result){
        if(result.data !== 'null'){
          return result.data;
        }
      });
    } else {
      return $q.when();
    }
  }

  function saveUser(user){
    var userId = user.id;
    if(userId && userId.length > 0){
      var emailUri = _mailUri(user.email);

      var emailRefPromise = emailUri.length > 0 ? $http.put(firebaseUrl+'/userrefs/'+emailUri+'.json', {id: userId}) : $q.when();
      var userPromise = $http.put(firebaseUrl+'/users/'+userId+'.json', user);

      return $q.all([emailRefPromise, userPromise]).then(function(results){});
    } else {
      return $q.when();
    }
  }

  function saveUserEmail(userId, email){
    if(userId && userId.length > 0){
      var emailUri = _mailUri(user.email);

      var emailRefPromise = emailUri.length > 0 ? $http.put(firebaseUrl+'/userrefs/'+emailUri+'.json', {id: userId}) : $q.when();
      var userPromise = $http.put(firebaseUrl+'/users/'+userId+'/email.json', email);

      return $q.all([emailRefPromise, userPromise]);
    } else {
      return $q.when();
    }
  }
  function saveUserSetting(userId, setting, value){
    if(userId && userId.length > 0){
      return $http.put(firebaseUrl+'/users/'+userId+'/settings/'+setting+'.json', value);
    } else {
      return $q.when();
    }
  }
  function saveUserData(userId, data, value){
    if(userId && userId.length > 0){
      return $http.put(firebaseUrl+'/users/'+userId+'/data/'+data+'.json', value);
    } else {
      return $q.when();
    }
  }

  function _mailUri(email){
    return encodeURI(email).replace(/\./g, '');
  }

  return service;
})

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
});
