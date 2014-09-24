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

.controller('ProfileCtrl', function($scope, $window, StorageSrv, LogSrv){
  'use strict';
  var user = StorageSrv.getUser();

  $scope.clearCache = function(){
    if($window.confirm('Vider le cache ?')){
      LogSrv.trackClearCache(user.id);
      StorageSrv.clearCache();
    }
  };
  $scope.resetApp = function(){
    if($window.confirm('Réinitialiser complètement l\'application ?')){
      LogSrv.trackClearApp(user.id);
      StorageSrv.clear();
      if(navigator.app){
        navigator.app.exitApp();
      } else if(navigator.device){
        navigator.device.exitApp();
      }
    }
  };

  $scope.$watch('ctx.settings.showPrices', function(newValue, oldValue){
    if(newValue !== oldValue){
      StorageSrv.saveUserSetting('showPrices', newValue);
      LogSrv.trackChangeSetting('showPrices', newValue);
      LogSrv.registerUser();
    }
  });
  $scope.$watch('ctx.settings.bigImages', function(newValue, oldValue){
    if(newValue !== oldValue){
      StorageSrv.saveUserSetting('bigImages', newValue);
      LogSrv.trackChangeSetting('bigImages', newValue);
      LogSrv.registerUser();
    }
  });
})

.controller('FeedbackCtrl', function($scope, $stateParams, $window, StorageSrv, EmailSrv, LogSrv, supportTeamEmail){
  'use strict';
  var app = StorageSrv.getApp();
  var user = StorageSrv.getUser();
  $scope.feedback = {
    email: user.email,
    content: '',
    sending: false,
    sent: false
  };

  if($stateParams.source){
    if($stateParams.source === 'recipes-rating-1'){$scope.feedback.content = 'Bof bof bof... Tiens quelques conseils !\n\nJe serais plus fan de ...';}
    else if($stateParams.source === 'recipes-rating-2'){$scope.feedback.content = 'Plutôt cool tes recettes !\n\nJe verrais bien un peu plus ... ou un peu moins de ...';}
    else if($stateParams.source === 'recipes-rating-3'){$scope.feedback.content = 'Wahou c\'est top !\n\nEt ça serait encore mieux si tu pouvais ...';}
  }

  $scope.sendFeedback = function(){
    $scope.feedback.sending = true;
    LogSrv.trackSendFeedback($scope.feedback.email);
    EmailSrv.sendFeedback($scope.feedback.email, $scope.feedback.content).then(function(sent){
      $scope.feedback.sending = false;
      if(sent){
        $scope.feedback.sent = true;
      } else {
        $window.alert('Echec de l\'envoi du email :(\nContactez '+supportTeamEmail+' si vous le souhaitez !');
      }
    });
    if(user.email !== $scope.feedback.email){
      LogSrv.trackSetEmail($scope.feedback.email);
      user.email = $scope.feedback.email;
      StorageSrv.saveUser(user);
      LogSrv.registerUser();
    }
  };
  $scope.openUservoice = function(){
    LogSrv.trackOpenUservoice();
  };

  // UserVoice widget
  UserVoice.push(['set', {
    accent_color: '#f62',
    trigger_color: 'white',
    trigger_background_color: '#f62'
  }]);
  var identity = {};
  if(user && user.id)                         { identity.id         = user.id;              }
  if(user && user.email)                      { identity.email      = user.email;           }
  if(user && user.name)                       { identity.name       = user.name;            }
  if(app && app.firstLaunch)                  { identity.created_at = app.firstLaunch/1000; }
  UserVoice.push(['identify', identity]);
  UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
  UserVoice.push(['autoprompt', {}]);
});
