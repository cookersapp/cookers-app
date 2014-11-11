angular.module('app')

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        templateUrl: 'scripts/user/profile.html',
        controller: 'ProfileCtrl'
      }
    }
  })
  .state('app.feedback', {
    url: '/feedback?source',
    views: {
      'menuContent': {
        templateUrl: 'scripts/user/feedback.html',
        controller: 'FeedbackCtrl'
      }
    }
  });
})

.controller('ProfileCtrl', function($scope, StorageSrv, BackendUtils, ToastSrv, DialogSrv, LogSrv, Utils){
  'use strict';
  $scope.clearCache = function(){
    DialogSrv.confirm('Vider le cache ?').then(function(result){
      if(result){
        LogSrv.trackClearCache();
        BackendUtils.clearCache().then(function(){
          ToastSrv.show('Cache vidé !');
        });
      }
    });
  };
  $scope.resetApp = function(){
    DialogSrv.confirm('Réinitialiser complètement l\'application ?').then(function(result){
      if(result){
        LogSrv.trackClearApp();
        StorageSrv.clear().then(function(){
          Utils.exitApp();
        });
      }
    });
  };

  $scope.$watch('ctx.settings.showPrices', function(newValue, oldValue){
    if(newValue !== oldValue){
      StorageSrv.setUserSetting('showPrices', newValue);
    }
  });
  $scope.$watch('ctx.settings.bigImages', function(newValue, oldValue){
    if(newValue !== oldValue){
      StorageSrv.setUserSetting('bigImages', newValue);
    }
  });
})

.controller('FeedbackCtrl', function($scope, $stateParams, $window, StorageSrv, EmailSrv, DialogSrv, LogSrv, supportTeamEmail){
  'use strict';
  var userPromise = StorageSrv.getUser();
  userPromise.then(function(user){
    $scope.feedback = {
      placeholder: 'Un p\'tit compliment ? Quelle est ta fonctionnalité préférée ?',
      email: user.email,
      content: '',
      sending: false,
      sent: false
    };
  });

  if($stateParams.source){
    if($stateParams.source === 'recipes-rating-1'){$scope.feedback.placeholder = 'Bof bof bof... Tiens quelques conseils ! Je serais plus fan de ...';}
    else if($stateParams.source === 'recipes-rating-2'){$scope.feedback.placeholder = 'Plutôt cool tes recettes ! Je verrais bien un peu plus ... ou un peu moins de ...';}
    else if($stateParams.source === 'recipes-rating-3'){$scope.feedback.placeholder = 'Wahou c\'est top ! Et ça serait encore mieux si tu pouvais ...';}
  }

  $scope.sendFeedback = function(){
    $scope.feedback.sending = true;
    EmailSrv.sendFeedback($scope.feedback.email, $scope.feedback.content).then(function(sent){
      $scope.feedback.sending = false;
      if(sent){
        $scope.feedback.sent = true;
      } else {
        DialogSrv.alert('Echec de l\'envoi du email :(\nContactez '+supportTeamEmail+' si vous le souhaitez !');
      }
    });
  };
  $scope.openUservoice = function(){
    LogSrv.trackOpenUservoice();
  };

  // UserVoice widget
  userPromise.then(function(user){
    UserVoice.push(['set', {
      accent_color: '#f62',
      trigger_color: 'white',
      trigger_background_color: '#f62'
    }]);
    var identity = {};
    if(user && user.id)                         { identity.id         = user.id;              }
    if(user && user.email)                      { identity.email      = user.email;           }
    if(user && user.name)                       { identity.name       = user.name;            }
    UserVoice.push(['identify', identity]);
    UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
    UserVoice.push(['autoprompt', {}]);
  });
});
