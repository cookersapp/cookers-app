angular.module('ionicApp')

.controller('AppCtrl', function($scope) {
  'use strict';

})

.controller('HomeCtrl', function($scope) {
  'use strict';

})

.controller('PlanningCtrl', function($scope) {
  'use strict';
  var imgFormat = '16-9';
  var burgerMeal = {
    name: 'Burger poulet bacon avocats',
    image: 'images/courses/'+imgFormat+'/burger.jpg',
    starter: {},
    mainCourse: {
      name: 'Burger poulet bacon avocat',
      image: 'images/courses/'+imgFormat+'/burger.jpg',
      source: 'http://www.cotemaison.fr/recettes-de-cuisine/burger-poulet-bacon-avocat_14501.html'
    },
    desert: {
      name: 'Crumble fraise',
      image: 'images/courses/'+imgFormat+'/crumble-fraise.jpg',
      source: 'http://www.pinterest.com/pin/293578469432883031/'
    },
    wine: {}
  };
  var saumonMeal = {
    name: 'Tartare saumon',
    image: 'images/courses/'+imgFormat+'/tartare-saumon.jpg',
    starter: {},
    mainCourse: {
      name: 'Tartare saumon',
      image: 'images/courses/'+imgFormat+'/tartare-saumon.jpg',
      source: 'http://www.epicurious.com/recipes/food/views/Salmon-Tartare-365150'
    },
    desert: {},
    wine: {}
  };

  $scope.planning = [
    {name: 'Lundi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Mardi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Mercredi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Jeudi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Vendredi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Samedi', lunch: {index: null}, dinner: {index: null}},
    {name: 'Dimanche', lunch: {index: null}, dinner: {index: null}}
  ];
  $scope.meals = [burgerMeal, saumonMeal];

  $scope.changeMeal = function(meal, index){
    console.log('controller.changeMeal('+index+') for ', meal);
    meal.index = index;
  };
});
