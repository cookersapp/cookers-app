angular.module('app')

.factory('BackendUserSrv', function($http, Config){
  'use strict';
  var service = {
    findUser: findUser,
    updateUserSetting: updateUserSetting,
    setUserDevice: setUserDevice
  };

  function findUser(email){
    return $http.get(Config.backendUrl+'/api/v1/users/find?email='+email).then(function(res){
      if(res && res.data){
        if(res.data.data){ return res.data.data; }
        else { return res.data; }
      }
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

.factory('CompatibilitySrv', function(){
  'use strict';
  var service = {
    setFoodCategoryToObj: setFoodCategoryToObj
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
    {id: 14, order: 14, name: 'Surgelés'},
    {id: 15, order: 15, name: 'Autres'}
  ];
  for(var i in foodCategories){
    foodCategories[i].slug = getSlug(foodCategories[i].name);
  }

  function setFoodCategoryToObj(food){
    if(food && food.category && typeof food.category === 'string'){
      var cat = _.find(foodCategories, {name: food.category});
      if(cat){
        food.category = angular.copy(cat);
      } else {
        food.category = {
          id: 16,
          order: 16,
          name: food.category,
          slug: getSlug(food.category)
        };
      }
    }
  }

  return service;
})

.factory('BackendSrv', function($q, $http, StorageSrv, CollectionUtils, CompatibilitySrv, firebaseUrl){
  'use strict';
  var service = {
    getRecipe: getRecipe,
    getFood: getFood,
    getFoods: getFoods,
    getSelection: getSelection
  };

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
            CompatibilitySrv.setFoodCategoryToObj(ing.food);
          }
        }
        StorageSrv.addRecipe(recipe);
        return recipe;
      });
    }
  }

  function getFood(id){
    var food = StorageSrv.getFood(id);
    if(food){
      return $q.when(food);
    } else {
      return $http.get(firebaseUrl+'/foods/'+id+'.json').then(function(result){
        var food = result.data;
        CompatibilitySrv.setFoodCategoryToObj(food);
        StorageSrv.addFood(food);
        return food;
      });
    }
  }

  function getFoods(){
    var foods = StorageSrv.getFoods();
    var promise = $http.get(firebaseUrl+'/foods.json').then(function(result){
      angular.copy(result.data, foods);
      for(var i in foods){
        CompatibilitySrv.setFoodCategoryToObj(foods[i]);
      }
      StorageSrv.setFoods(foods);
      return foods;
    });

    if(CollectionUtils.size(foods) === 0){
      return promise;
    } else {
      return $q.when(foods);
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

  return service;
})

.factory('ProductSrv', function($http, Config){
  'use strict';
  var service = {
    getAll        : function(barcode)         { return _get('/api/v1/products/'+barcode);                   },
    getWithStore  : function(store, barcode)  { return _get('/api/v1/stores/'+store+'/products/'+barcode);  },
    setFoodId     : function(barcode, foodId) { return _put('/api/v1/products/'+barcode+'?foodId='+foodId); }
  };

  function _get(url){
    return $http.get(Config.backendUrl+url).then(function(res){
      if(res && res.data && res.data.data){
        return res.data.data;
      }
    });
  }

  function _put(url){
    return $http.put(Config.backendUrl+url).then(function(res){
      if(res && res.data && res.data.data){
        return res.data.data;
      }
    });
  }

  return service;
})

.factory('StoreSrv', function($http, Config){
  'use strict';
  var service = {
    getAll: function(){ return _get('/api/v1/stores'); }
  };

  function _get(url){
    return $http.get(Config.backendUrl+url).then(function(res){
      if(res && res.data && res.data.data){
        return res.data.data;
      }
    });
  }

  return service;
});
