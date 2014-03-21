angular.module('ionicApp.sidemenu', [])

.controller('SideMenuCtrl', function($scope, $state, $localStorage){
  $scope.$storage = $localStorage;

  // Check if the user already did the tutorial and play it if not
  if(!$scope.$storage.didTutorial) {
    $state.go('tutorial');
  }

  $scope.sideMenuClick = function(path, args){
    if(path === 'scan'){
      $scope.sideMenuController.close();
      $scope.makeScan();
    } else {
      $state.go(path, args);
      $scope.sideMenuController.close();
    }
  };

  $scope.leftButtons = [{
    type: 'button-icon button-clear ion-navicon',
    tap: function(e) {
      $scope.sideMenuController.toggleLeft();
    }
  }];

  $scope.makeScan = function(from) {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        if(!result.cancelled){
          $state.go('sidemenu.product', {barcode: result.text, from: from});
        }
      }, 
      function (error) {
        alert("Scanning failed: " + error);
      }
    );
  };
});