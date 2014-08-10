angular.module('app')

.controller('AppCtrl', function($scope, $interval, $ionicSideMenuDelegate, RecipeSrv, UserSrv){
  'use strict';
  $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
  $scope.imageCover = $scope.defaultCovers[0];
  $scope.user = UserSrv.get();
  var recipesHistory = RecipeSrv.getHistory();

  $interval(function(){
    var historyLength = recipesHistory ? recipesHistory.length : 0;
    if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
      $scope.imageCover = recipesHistory[Math.floor(Math.random() * historyLength)].images.landing;
    } else {
      $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
    }
  }, 10000);
})

.controller('HomeCtrl', function($scope, $timeout, GlobalMessageSrv, CartSrv, RecipeSrv, WeekrecipeSrv, LogSrv){
  'use strict';
  $scope.recipesInCart = CartSrv.recipesFromOpenedCarts();
  $scope.itemsInCart = CartSrv.itemsFromOpenedCarts();
  $scope.recipesHistory = RecipeSrv.getHistory();
  $scope.recipesOfWeek = [];
  $scope.standardMessage = null;
  $scope.stickyMessages = [];

  WeekrecipeSrv.getCurrent().then(function(recipesOfWeek){
    $scope.recipesOfWeek = recipesOfWeek;
  });

  GlobalMessageSrv.getStandardMessageToDisplay().then(function(message){
    $scope.standardMessage = message;
  });
  GlobalMessageSrv.getStickyMessages().then(function(messages){
    $scope.stickyMessages = messages;
  });
  GlobalMessageSrv.execMessages();

  $scope.hideStandardMessage = function(){
    LogSrv.trackHideMessage($scope.standardMessage.id);
    $scope.standardMessage.hide = true;
    $scope.standardMessage = null;
    // wait 3 sec before show new message
    $timeout(function(){
      GlobalMessageSrv.getStandardMessageToDisplay().then(function(message){
        $scope.standardMessage = message;
      });
    }, 3000);
  };
});
