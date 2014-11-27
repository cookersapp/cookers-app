angular.module('app')

.factory('PopupSrv', function($rootScope, $q, $ionicPopup, $ionicActionSheet, $ionicLoading, CameraSrv, SharingSrv, ToastSrv, Config){
  'use strict';
  var service = {
    forceAskEmail: forceAskEmail,
    changeServings: changeServings,
    recipeCooked: recipeCooked,
    tourCookFeatures: tourCookFeatures,
    tourCartFeatures: tourCartFeatures
  };

  function forceAskEmail(){
    if(Config.defaultEmail){
      return $q.when(Config.defaultEmail);
    } else {
      var $scope = $rootScope.$new(true);
      $scope.data = {email: ''};
      return $ionicPopup.show({
        template: '<input type="email" placeholder="Email" ng-model="data.email">',
        title: 'Restons en contact !<br>Lâche ton email <i class="fa fa-smile-o">',
        subTitle: 'Aucun spam garanti !',
        scope: $scope,
        buttons: [{
          text: '<b>Continuer</b>',
          type: 'button-positive',
          onTap: function(e) {
            if(!$scope.data.email){
              e.preventDefault();
              ToastSrv.show('Please, enter you email !');
            } else {
              return $scope.data.email;
            }
          }
        }]
      });
    }
  }

  function changeServings(defaultServings, title){
    var $scope = $rootScope.$new(true);
    $scope.data = {
      servings: defaultServings ? defaultServings : 2
    };

    return $ionicPopup.show({
      template: ['<div style="text-align: center;">'+
                 (title ? '<h3 class="title" style="font-size: 20px;">'+title+'</h3>' : '')+
                 '<div>Cuisiner pour <b ng-bind="data.servings">??</b> personnes ?</div>'+
                 '</div>'+
                 '<div class="range">'+
                 '<i class="fa fa-user"></i>'+
                 '<input type="range" name="servings" min="1" max="10" ng-model="data.servings">'+
                 '<i class="fa fa-users"></i>'+
                 '</div>'].join(''),
      scope: $scope,
      buttons: [
        { text: 'Annuler' },
        { text: '<b>Ok</b>', type: 'button-positive', onTap: function(e){
          return $scope.data.servings;
        }}
      ]
    });
  }

  function recipeCooked(recipe){
    var defer = $q.defer();
    $ionicActionSheet.show({
      titleText: 'La recette est maintenant terminée, partage une photo de ta création !',
      buttons: [
        { text: 'Partager via Facebook' },
        { text: 'Partager via Twitter' },
        { text: 'Envoyer par email' }
      ],
      buttonClicked: function(index){
        $ionicLoading.show();
        CameraSrv.takePicture().then(function(imageUri){
          var sharePromise;
          if(index == 0){
            sharePromise = SharingSrv.shareViaFacebook(
              'Hey, voilà ma dernière recette ! Tu veux goûter ? :)\n--- Cuisiné avec http://cookers.io ',
              [imageUri, recipe.images.portrait]);
          } else if(index == 1){
            sharePromise = SharingSrv.shareViaTwitter(
              'Hey, voilà ma dernière recette ! Tu veux goûter ? :)\n--- Cuisiné avec @cookersapp',
              imageUri,
              'http://cookers.io');
          } else if(index == 2){
            sharePromise = SharingSrv.shareViaEmail(
              'Hey, voilà ma dernière recette ! Tu veux goûter ? :)\n--- Cuisiné avec http://cookers.io ',
              'A table : ' + recipe.name,
              [imageUri, recipe.images.portrait]);
          }

          sharePromise.then(function(){
            $ionicLoading.hide();
            defer.resolve(true);
          },function(){
            $ionicLoading.hide();
            ToastSrv.show('Le partage a échoué :(');
            defer.resolve(false);
          });
        });
        return true;
      },
      destructiveText: 'Revenir à l\'accueil',
      destructiveButtonClicked: function(){
        defer.resolve(false);
        return true;
      }
    });
    return defer.promise;
  }

  function tourCookFeatures(){
    return $ionicPopup.show({
      title: 'Man vs Time',
      subTitle: 'Respecte le chrono !!!',
      template: ['<ul style="list-style: circle;">'+
                 '<li style="margin: 0px 0 5px 15px;"><i>Ne brûle rien</i>, aide-toi des <b>timers</b></li>'+
                 '<li style="margin: 0px 0 5px 15px;"><i>Ne perds pas ton temps</i> avec le téléphone, <b>l\'écran reste allumé</b></li>'+
                 '<li style="margin: 0px 0 5px 15px;"><i>Valide ton chrono</i> en cliquant sur <b>Finir !</b></li>'+
                 '</ul>'].join(''),
      buttons: [{
        text: '<b>Go !</b>',
        type: 'button-custom'
      }]
    });
  }

  function tourCartFeatures(){
    return $ionicPopup.show({
      title: 'Liste de course',
      template: '<div class="text-align: center;">Fais tes courses pépère,<br>l\'écran ne s\'éteint pas :D</div>',
      buttons: [{
        text: '<b>Ok</b>',
        type: 'button-custom'
      }]
    });
  }

  return service;
});
