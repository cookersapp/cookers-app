angular.module('app')

.controller('AppCtrl', function($scope, $interval, $ionicPlatform, $ionicSideMenuDelegate, StorageSrv){
  'use strict';
  $ionicPlatform.ready(function(){
    $scope.defaultCovers = ['images/sidemenu-covers/cover1.jpg','images/sidemenu-covers/cover2.jpg','images/sidemenu-covers/cover3.jpg','images/sidemenu-covers/cover4.png','images/sidemenu-covers/cover5.jpg','images/sidemenu-covers/cover6.jpg'];
    $scope.imageCover = $scope.defaultCovers[0];
    $scope.user = StorageSrv.getUser();

    $interval(function(){
      var recipesHistory = StorageSrv.getRecipeHistory();
      var historyLength = recipesHistory ? recipesHistory.length : 0;
      if(historyLength > 0 && Math.random() > (historyLength/$scope.defaultCovers.length)){
        $scope.imageCover = recipesHistory[Math.floor(Math.random() * historyLength)].images.landing;
      } else {
        $scope.imageCover = $scope.defaultCovers[Math.floor(Math.random() * $scope.defaultCovers.length)];
      }
    }, 10000);
  });
})

.controller('HomeCtrl', function($scope, $timeout, GlobalMessageSrv, LogSrv){
  'use strict';
  $scope.standardMessage = null;
  $scope.stickyMessages = [];

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
