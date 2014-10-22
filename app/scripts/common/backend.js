angular.module('app')

.factory('BackendUserSrv', function($q, $http, LogSrv, Config, _LocalStorageSrv){
  'use strict';
  var service = {
    getUser: getUser,
    findUser: findUser,
    updateUserSetting: updateUserSetting,
    setUserDevice: setUserDevice
  };

  function getUser(id){
    return $http.get(Config.backendUrl+'/api/v1/users/'+id).then(function(result){
      return result.data;
    });
  }

  function findUser(email){
    var user = _LocalStorageSrv.getUser();
    var welcomeEmailSent = user && user.data && user.data.welcomeMailSent ? user.data.welcomeMailSent : false;
    var mailSentParam = welcomeEmailSent ? '&welcomeEmailSent='+welcomeEmailSent : '';
    return $http.get(Config.backendUrl+'/api/v1/users/find?email='+email+mailSentParam).then(function(result){
      return result.data;
    });
  }

  function updateUserSetting(userId, setting, value){
    return $http.put(Config.backendUrl+'/api/v1/users/'+userId+'/settings/'+setting, {value: value});
  }

  function setUserDevice(userId, device){
    return $http.put(Config.backendUrl+'/api/v1/users/'+userId+'/device', device);
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
})

.factory('ProductSrv', function($http){
  'use strict';
  var service = {
    get: get
  };

  function get(barcode){
    return $http.get('http://fr.openfoodfacts.org/api/v0/produit/'+barcode+'.json').then(function(res){
      var product = {};
      product.barcode = barcode;
      if(res && res.data){
        product.status            = res.data.status;
        if(res.data.product){
          product.generic_name    = res.data.product.generic_name;
          product.name            = res.data.product.product_name;
          product.image           = res.data.product.image_url;
          product.image_small     = res.data.product.image_small_url;
          product.quantity        = res.data.product.quantity;
          product.serving         = res.data.product.serving_size;
          product.servingQuantity = res.data.product.serving_quantity;
          product.categories      = res.data.product.categories_tags;
          product.ingredients     = res.data.product.ingredients;
          product.ingredientsTags = res.data.product.ingredients_tags;
          product.brands          = res.data.product.brands;
          product.keywords        = res.data.product._keywords;
          product.traces          = res.data.product.traces_tags;
        }
      }
      return product;
    });
  }

  return service;
});
