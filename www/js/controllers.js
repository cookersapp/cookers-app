angular.module('ionicApp.controllers', [])


.controller('TutorialCtrl', function($scope, $state, $localStorage){
  $scope.$storage = $localStorage;

  function startApp(){
    $state.go('sidemenu.home');
    $scope.$storage.didTutorial = true;
  }

  // Move to the next slide
  $scope.next = function() {
    $scope.$broadcast('slideBox.nextSlide');
  };

  // Our initial right buttons
  var rightButtons = [
    {
      content: 'Next',
      type: 'button-positive button-clear',
      tap: function(e) {
        // Go to the next slide on tap
        $scope.next();
      }
    }
  ];

  // Our initial left buttons
  var leftButtons = [
    {
      content: 'Skip',
      type: 'button-positive button-clear',
      tap: function(e) {
        // Start the app on tap
        startApp();
      }
    }
  ];

  // Bind the left and right buttons to the scope
  $scope.leftButtons = leftButtons;
  $scope.rightButtons = rightButtons;


  // Called each time the slide changes
  $scope.slideChanged = function(index) {
    // Check if we should update the left buttons
    if(index > 0) {
      // If this is not the first slide, give it a back button
      $scope.leftButtons = [
        {
          content: 'Back',
          type: 'button-positive button-clear',
          tap: function(e) {
            // Move to the previous slide
            $scope.$broadcast('slideBox.prevSlide');
          }
        }
      ];
    } else {
      // This is the first slide, use the default left buttons
      $scope.leftButtons = leftButtons;
    }

    // If this is the last slide, set the right button to
    // move to the app
    if(index == 2) {
      $scope.rightButtons = [
        {
          content: 'Start using MyApp',
          type: 'button-positive button-clear',
          tap: function(e) {
            startApp();
          }
        }
      ];
    } else {
      // Otherwise, use the default buttons
      $scope.rightButtons = rightButtons;
    }
  };
})


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
})


.controller('HomeCtrl', function($scope){

})


.controller('ProductCtrl', function($scope, $stateParams, ProductService){
  var barcode = $stateParams.barcode;
  var from = $stateParams.from;

  $scope.product = {
    barcode: barcode
  };
  
  ProductService.get(barcode).then(function(product){
    $scope.product = product;
  });
})


.controller('IngredientCtrl', function($scope, $stateParams){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.ingredient = {
    id: id
  };
})


.controller('RecipeCtrl', function($scope, $stateParams){
  var id = $stateParams.id;
  var from = $stateParams.from;

  $scope.recipe = {
    id: id
  };
})


.controller('FeedbackCtrl', function($scope){

})


.controller('FaqCtrl', function($scope){

})


.controller('InformationsCtrl', function($scope){
  $scope.app = {
    version: "0.0.1"
  };
})


.controller('DeviceCtrl', function($scope, $localStorage){
  $scope.$storage = $localStorage;

  ionic.Platform.ready(function(){
    $scope.device = ionic.Platform.device();
  });

  $scope.resetApp = function(){
    $scope.$storage.$reset();
    alert('Application réinitialisée !');
    ionic.Platform.exitApp();
  };
});
