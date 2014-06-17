angular.module('ionicApp')

.factory('PlanningService', function($http, $q, $localStorage){
  'use strict';
  var service = {
    getCurrentPlanning: function(){ return getPlanning(moment().week()); },
    getPlanning: getPlanning
  };

  function getPlanning(week){
    var planning = _.find($localStorage.plannings, {week: week});
    if(planning){
      return $q.when(planning);
    } else {
      return downloadPlanning(week);
    }
  }

  function downloadPlanning(week){
    return $http.get('data/planning.json').then(function(result){
      $localStorage.plannings.push(result.data);
      return result.data;
    });
  }

  return service;
})

.factory('MealService', function(PlanningService){
  'use strict';
  var service = {
    getMeal: getMeal
  };

  function getMeal(mealId){
    return PlanningService.getCurrentPlanning().then(function(planning){
      return _.find(planning.meals, {id: mealId});
    });
  }

  return service;
})

.factory('ShoppinglistService', function($localStorage){
  'use strict';
  var service = {
    hasLists: hasLists,
    getAllLists: function(){return $localStorage.shoppinglists.lists;},
    getList: getList,
    createList: function(){return buildShoppinglist();},
    addList: addList,
    changeList: changeList,
    removeList: removeList,
    listHasMeal: listHasMeal,
    addMealToList: addMealToList,
    removeMealFromList: removeMealFromList,
    buyListItem: buyListItem,
    getListItemsByCategory: getListItemsByCategory
  };

  function hasLists(){
    return $localStorage.shoppinglists.current !== null;
  }
  function getList(){
    return hasLists() ? $localStorage.shoppinglists.lists[$localStorage.shoppinglists.current] : null;
  }
  function addList(list){
    $localStorage.shoppinglists.lists.unshift(list);
    $localStorage.shoppinglists.current = 0;
    return getList();
  }
  function changeList(list){
    var index = null;
    if(typeof list === "number"){ index = list; }
    else { index = $localStorage.shoppinglists.lists.indexOf(list); }

    if(-1 < index && index < $localStorage.shoppinglists.lists.length){
      $localStorage.shoppinglists.current = index;
    }
    return getList();
  }
  function removeList(){
    if(hasLists()){
      $localStorage.shoppinglists.lists.splice($localStorage.shoppinglists.current, 1);
      if($localStorage.shoppinglists.lists.length > 0){
        $localStorage.shoppinglists.current = 0;
      } else {
        $localStorage.shoppinglists.current = null;
      }
    }
    return getList();
  }

  function listHasMeal(meal){
    return meal && meal.id && _.findIndex(getList().meals, {id: meal.id}) > -1;
  }
  function addMealToList(meal){
    var list = getList();
    if(list){
      list.meals.push(buildMealList(meal));
    }
  }
  function removeMealFromList(meal){
    var list = getList();
    if(list){
      var index = _.findIndex(list.meals, {id: meal.id});
      if(index > -1){
        list.meals.splice(index, 1);
      }
    }
  }
  function buyListItem(item){
    // TODO
  }
  function getListItemsByCategory(){
    var list = getList();
    var categories = [];
    if(list && list.meals){
      for(var i in list.meals){
        var meal = list.meals[i].data;
        addCourseIngredientsToCategories(meal.starter, categories);
        addCourseIngredientsToCategories(meal.mainCourse, categories);
        addCourseIngredientsToCategories(meal.desert, categories);
        addCourseIngredientsToCategories(meal.wine, categories);
      }
    }
    return categories;
  }
  function addCourseIngredientsToCategories(course, categories){
    if(course && course.ingredients){
      for(var i in course.ingredients){
        var ingredient = course.ingredients[i];
        var category = _.find(categories, {name: ingredient.food.category});
        if(category){
          var item = _.find(category.items, {name: ingredient.food.name});
          if(item){
            addQuantityToListItem(ingredient.quantity, item);
          } else {
            category.items.push(buildListItem(ingredient));
          }
        } else {
          categories.push({
            name: ingredient.food.category,
            items: [buildListItem(ingredient)]
          });
        }
      }
    }
  }
  function addQuantityToListItem(quantity, item){
    if(quantity.unit === item.quantity.unit){
      item.quantity.value += quantity.value;
    } else {
      // TODO
      alert('Should convert <'+quantity.unit+'> to <'+item.quantity.unit+'> !!!');
    }
  }

  function buildListItem(ingredient){
    return {
      quantity: ingredient.quantity,
      food: ingredient.food
    };
  }
  function buildMealList(meal){
    return {
      added: moment().valueOf(),
      id: meal.id,
      data: meal
    }
  }
  function buildShoppinglist(){
    return {
      // TODO : generate id
      created: moment().valueOf(),
      name: 'Liste du '+moment().format('LL'),
      meals: []
    };
  }

  return service;
})

.factory('ModalService', function($ionicModal){
  'use strict';
  var service = {
    meal: {
      details: function(scope, callback){ createModal('views/modal/meal.html', scope, callback); }
    }
  };

  function createModal(url, scope, callback){
    $ionicModal.fromTemplateUrl(url, callback, {
      scope: scope,
      animation: 'slide-in-up'
    });
  }

  return service;
});