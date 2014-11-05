angular.module('app')

.controller('AppCtrl', function($scope, $interval, StorageSrv, imagesPlaceholders){
  'use strict';
  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];

  $interval(function(){
    var recipesHistory = StorageSrv.getRecipeHistory();
    var historyLength = recipesHistory ? recipesHistory.length : 0;
    if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
      var images = recipesHistory[Math.floor(Math.random() * historyLength)].images;
      $scope.imageCover = images ? images.landing : imagesPlaceholders.recipe.landing;
    } else {
      $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
    }
  }, 10000);
})

.controller('HomeCtrl', function($scope, $timeout, GlobalMessageSrv, SelectionSrv){
  'use strict';
  // preload selection
  SelectionSrv.getCurrent();

  $scope.standardMessage = null;
  $scope.stickyMessages = [];

  GlobalMessageSrv.getMessage().then(function(message){
    $scope.standardMessage = message;
  });
  GlobalMessageSrv.getStickyMessages().then(function(messages){
    $scope.stickyMessages = messages;
  });

  $scope.hideMessage = function(message){
    GlobalMessageSrv.hideMessage(message);
    $scope.standardMessage = null;
    // wait 3 sec before show new message
    $timeout(function(){
      GlobalMessageSrv.getMessage().then(function(message){
        $scope.standardMessage = message;
      });
    }, 3000);
  };
});
