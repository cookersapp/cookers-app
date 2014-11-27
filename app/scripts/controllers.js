angular.module('app')

.controller('AppCtrl', function($scope, $interval, StorageSrv, imagesPlaceholders){
  'use strict';
  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];

  $interval(function(){
    StorageSrv.getRecipeHistory().then(function(recipesHistory){
      var historyLength = recipesHistory ? recipesHistory.length : 0;
      if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
        var images = recipesHistory[Math.floor(Math.random() * historyLength)].images;
        $scope.imageCover = images ? images.landing : imagesPlaceholders.recipe.landing;
      } else {
        $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
      }
    });
  }, 10000);
});
