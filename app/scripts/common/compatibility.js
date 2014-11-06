angular.module('app')

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
});
