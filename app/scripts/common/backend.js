angular.module('app')

.factory('BackendUserSrv', function($q, $http, firebaseUrl){
  'use strict';
  var service = {
    getUserId: getUserId,
    updateUser: updateUser,
    aliasUser: aliasUser
  };

  function getUserId(user){
    var email = encodeURI(user.email).replace(/\./g, '');
    if(email.length > 0){
      return $http.get(firebaseUrl+'/userrefs/'+email+'.json').then(function(result){
        if(result.data !== 'null'){
          return result.data.id;
        }
      });
    } else {
      return $q.when();
    }
  }

  function updateUser(user){
    var userId = user.id;
    if(userId){
      var email = encodeURI(user.email).replace(/\./g, '');

      var emailRefPromise = email.length > 0 ? $http.put(firebaseUrl+'/userrefs/'+email+'.json', {id: userId}) : $q.when();
      var userPromise = $http.put(firebaseUrl+'/users/'+userId+'.json', user);

      return $q.all([emailRefPromise, userPromise]);
    } else {
      return $q.when();
    }
  }

  function aliasUser(user, oldId){
    if(user.id){
      var email = encodeURI(user.email).replace(/\./g, '');

      var addEmailRefPromise = email.length > 0 ? $http.put(firebaseUrl+'/userrefs/'+email+'.json', {id: user.id}) : $q.when();
      var addUserPromise = $http.put(firebaseUrl+'/users/'+user.id+'.json', user);
      var removeUserPromise = user.id !== oldId ? $http.delete(firebaseUrl+'/users/'+oldId+'.json') : $q.when();

      return $q.all([addEmailRefPromise, addUserPromise, removeUserPromise]);
    } else {
      return $q.when();
    }
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
