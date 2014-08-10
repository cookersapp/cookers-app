angular.module('app.user', ['ui.router'])

.config(function($stateProvider){
  'use strict';

  $stateProvider
  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent' :{
        templateUrl: 'scripts/user/profile.html',
        controller: 'ProfileCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.feedback', {
    url: '/feedback?source',
    views: {
      'menuContent' :{
        templateUrl: 'scripts/user/feedback.html',
        controller: 'FeedbackCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  });
})

.controller('ProfileCtrl', function($scope, $state, $window, StorageSrv, UserSrv, LoginSrv, LogSrv){
  'use strict';
  var sUser = UserSrv.get();

  var covers = [
    'images/profile-covers/cover01.jpg',
    'images/profile-covers/cover02.jpg',
    'images/profile-covers/cover03.jpg',
    'images/profile-covers/cover04.jpg',
    'images/profile-covers/cover05.jpg',
    'images/profile-covers/cover06.jpg',
    'images/profile-covers/cover07.jpg',
    'images/profile-covers/cover08.jpg',
    'images/profile-covers/cover09.jpg',
    'images/profile-covers/cover10.jpg',
    'images/profile-covers/cover11.jpg',
    'images/profile-covers/cover12.jpg',
    'images/profile-covers/cover13.jpg',
    'images/profile-covers/cover14.jpg',
    'images/profile-covers/cover15.jpg',
    'images/profile-covers/cover16.jpg',
    'images/profile-covers/cover17.jpg',
    'images/profile-covers/cover18.jpg',
    'images/profile-covers/cover19.jpg',
    'images/profile-covers/cover20.jpg',
    'images/profile-covers/cover21.jpg',
    'images/profile-covers/cover22.jpg',
    'images/profile-covers/cover23.jpg',
    'images/profile-covers/cover24.jpg'
  ];
  if(!gravatarCoverIsInCovers(sUser, covers) && getGravatarCover(sUser)){ covers.unshift(getGravatarCover(sUser)); }
  var currentCover = -1;
  $scope.changeCover = function(){
    currentCover = (currentCover+1)%covers.length;
    sUser.backgroundCover = covers[currentCover];
    LogSrv.trackChangeSetting('profileCover', sUser.backgroundCover);
    LogSrv.registerUser();
  };

  $scope.clearCache = function(){
    if($window.confirm('Vider le cache ?')){
      LogSrv.trackClearCache(sUser.device.uuid);
      StorageSrv.clearCache();
    }
  };
  $scope.logout = function(){
    LoginSrv.logout().then(function(){
      LogSrv.trackLogout(sUser.device.uuid);
      $state.go('login');
    });
  };
  $scope.resetApp = function(){
    if($window.confirm('Réinitialiser complètement l\'application ?')){
      LogSrv.trackClearApp(sUser.device.uuid);
      StorageSrv.clear();
      if(navigator.app){
        navigator.app.exitApp();
      } else if(navigator.device){
        navigator.device.exitApp();
      }
    }
  };

  $scope.$watch('settings.showPrices', function(newValue, oldValue){
    if(newValue !== oldValue){
      LogSrv.trackChangeSetting('showPrices', newValue);
      LogSrv.registerUser();
    }
  });
  $scope.$watch('settings.bigImages', function(newValue, oldValue){
    if(newValue !== oldValue){
      LogSrv.trackChangeSetting('bigImages', newValue);
      LogSrv.registerUser();
    }
  });

  function gravatarCoverIsInCovers(user, covers){
    var gravatarCover = getGravatarCover(user);
    if(gravatarCover && _.find(covers, function(cover){return cover === gravatarCover;}) !== undefined){
      return true;
    }
    return false;
  }
  function getGravatarCover(user){
    if(user &&
       user.profiles &&
       user.profiles.gravatar &&
       user.profiles.gravatar.entry &&
       user.profiles.gravatar.entry.length > 0 &&
       user.profiles.gravatar.entry[0].profileBackground &&
       user.profiles.gravatar.entry[0].profileBackground.url){
      return user.profiles.gravatar.entry[0].profileBackground.url;
    }
  }
})

.controller('FeedbackCtrl', function($scope, $stateParams, $window, AppSrv, UserSrv, EmailSrv, LogSrv){
  'use strict';
  var sApp = AppSrv.get();
  var sUser = UserSrv.get();
  $scope.feedback = {
    email: sUser.email,
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
        $window.alert('Echec de l\'envoi du email. Réessayez !');
      }
    });
    if(sUser.email !== $scope.feedback.email){
      LogSrv.trackSetEmail($scope.feedback.email);
      UserSrv.setEmail($scope.feedback.email).then(function(){
        LogSrv.registerUser();
      });
    }
  };
  $scope.openUservoice = function(){
    LogSrv.trackOpenUservoice();
  };

  // UserVoice widget
  UserVoice.push(['set', {
    accent_color: '#e2753a',
    trigger_color: 'white',
    trigger_background_color: '#e2753a'
  }]);
  var identity = {};
  if(sUser && sUser.email){identity.email = sUser.email;}
  if(sUser && sUser.name){identity.name = sUser.name;}
  if(sApp && sApp.firstLaunch){identity.created_at = sApp.firstLaunch/1000;}
  if(sUser && sUser.device && sUser.device.uuid){identity.id = sUser.device.uuid;}
  UserVoice.push(['identify', identity]);
  UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
  UserVoice.push(['autoprompt', {}]);
})

.factory('UserSrv', function($q, $localStorage, $http, localStorageDefault, md5){
  'use strict';
  var sUser = $localStorage.user;
  var service = {
    get: function(){return sUser;},
    hasMail: hasMail,
    setEmail: setEmail,
    updateProfile: updateProfile
  };

  function hasMail(){
    return sUser && sUser.email && sUser.email.length > 0;
  }

  function setEmail(email){
    sUser.email = email;
    if(email){
      return _updateGravatar(email).then(function(){
        updateProfile();
      });
    } else {
      return $q.when();
    }
  }

  function updateProfile(){
    var defaultProfile = _defaultProfile();
    var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
    var passwordProfile = _passwordProfile(sUser.profiles.password);
    var twitterProfile = _twitterProfile(sUser.profiles.twitter);
    var facebookProfile = _facebookProfile(sUser.profiles.facebook);
    var googleProfile = _googleProfile(sUser.profiles.google);

    angular.extend(sUser, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);

    if(sUser.email !== gravatarProfile.email){
      _updateGravatar(sUser.email).then(function(){
        var gravatarProfile = _gravatarProfile(sUser.profiles.gravatar);
        angular.extend(sUser, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);
      });
    }
  }

  function _updateGravatar(email){
    if(email && email.length > 0){
      var hash = md5.createHash(email);
      return $http.jsonp('http://www.gravatar.com/'+hash+'.json?callback=JSON_CALLBACK').then(function(result){
        var g = result.data;
        if(g && g.entry && g.entry.length > 0){
          g.entry[0].email = email;
        }
        sUser.profiles.gravatar = g;
      }, function(error){
        sUser.profiles.gravatar = {
          entry: [
            {email: email, hash: hash}
          ]
        };
      });
    } else {
      return $q.when();
    }
  }

  function _defaultProfile(){
    return {
      email: localStorageDefault.user.email,
      name: localStorageDefault.user.name,
      avatar: localStorageDefault.user.avatar,
      background: localStorageDefault.user.background,
      backgroundCover: localStorageDefault.user.backgroundCover,
      firstName: localStorageDefault.user.firstName,
      lastName: localStorageDefault.user.lastName
    };
  }

  function _gravatarProfile(g){
    var profile = {};
    if(g && g.entry && g.entry.length > 0){
      if(g.entry[0].email){        profile.email = g.entry[0].email; }
      if(g.entry[0].displayName) { profile.name = g.entry[0].displayName; }
      if(g.entry[0].thumbnailUrl){ profile.avatar = g.entry[0].thumbnailUrl; }
      if(g.entry[0].name){
        if(g.entry[0].name.givenName){  profile.firstName = g.entry[0].name.givenName; }
        if(g.entry[0].name.familyName){ profile.lastName = g.entry[0].name.familyName; }
        // override displayName
        if(g.entry[0].name.formatted){profile.name = g.entry[0].name.formatted;}
      }
      if(g.entry[0].profileBackground){
        if(g.entry[0].profileBackground.color) { profile.background = g.entry[0].profileBackground.color; }
        if(g.entry[0].profileBackground.url)   { profile.backgroundCover = g.entry[0].profileBackground.url; }
      }
    }
    return profile;
  }

  function _passwordProfile(p){
    var profile = {};
    if(p){
      if(p.email){ profile.email = p.email; }
    }
    return profile;
  }

  function _twitterProfile(t){
    var profile = {};
    if(t){
      if(t.displayName){ profile.name = t.displayName; }
      if(t.thirdPartyUserData){
        if(t.thirdPartyUserData.profile_image_url){  profile.avatar = t.thirdPartyUserData.profile_image_url.replace('_normal.', '_bigger.'); }
        if(t.thirdPartyUserData.profile_background_color){  profile.background = '#'+t.thirdPartyUserData.profile_background_color; }
        if(t.thirdPartyUserData.profile_background_image_url_https){  profile.backgroundCover = t.thirdPartyUserData.profile_background_image_url_https; }
      }
    }
    return profile;
  }

  function _facebookProfile(f){
    var profile = {};
    if(f){
      if(f.displayName){ profile.name = f.displayName; }
      if(f.thirdPartyUserData){
        if(f.thirdPartyUserData.email){      profile.email = f.thirdPartyUserData.email; }
        if(f.thirdPartyUserData.first_name){ profile.firstName = f.thirdPartyUserData.first_name; }
        if(f.thirdPartyUserData.last_name){  profile.lastName = f.thirdPartyUserData.last_name; }
        if(f.thirdPartyUserData.picture && f.thirdPartyUserData.picture.data && f.thirdPartyUserData.picture.data.url){
          profile.avatar = f.thirdPartyUserData.picture.data.url.replace('p50x50', 'p100x100');
        }
      }
    }
    return profile;
  }

  function _googleProfile(g){
    var profile = {};
    if(g){
      if(g.displayName){ profile.name = g.displayName; }
      if(g.email){ profile.email = g.email; }
      if(g.thirdPartyUserData){
        if(g.thirdPartyUserData.given_name){  profile.firstName = g.thirdPartyUserData.given_name; }
        if(g.thirdPartyUserData.family_name){ profile.lastName = g.thirdPartyUserData.family_name; }
        if(g.thirdPartyUserData.picture){     profile.avatar = g.thirdPartyUserData.picture; }
      }
    }
    return profile;
  }

  return service;
})

.factory('GamificationSrv', function($localStorage){
  'use strict';
  var sScore = $localStorage.user ? $localStorage.user.score : null;
  var service = {
    evalLevel: evalLevel,
    sendEvent: sendEvent
  };

  var levels = [
    {score: 0, html: '<i class="fa fa-eye"></i> Explorateur'},
    {score: 10, html: '<i class="fa fa-thumbs-o-up"></i> Testeur'},
    {score: 30, html: '<i class="fa fa-graduation-cap"></i> Cuisinier'},
    {score: 80, html: '<i class="fa fa-university"></i> Chef'},
    {score: 150, html: '<i class="fa fa-trophy"></i> Grand chef'}
  ];

  function evalLevel(){
    if(!sScore){sScore = $localStorage.user.score;}
    _setUserLevel();
  }

  function sendEvent(event, params){
    if(event === 'add-recipe-to-cart'){       _addScore(1, event, params);  }
    if(event === 'remove-recipe-from-cart'){  _addScore(-1, event, params); }
    if(event === 'add-item-to-cart'){         _addScore(1, event, params);  }
    if(event === 'remove-item-from-cart'){    _addScore(-1, event, params); }
    if(event === 'archive-cart'){             _addScore(3, event, params);  }
    if(event === 'state' && params.to === 'app.feedback' && _.find(sScore.events, {event:event, params:{to:params.to}}) === undefined){
      _addScore(2, event, params);
    }
  }

  function _addScore(value, event, params){
    sScore.events.push({
      time: Date.now(),
      event: event,
      params: params
    });
    sScore.value += value;
    if(sScore.value > sScore.level.next){
      _setUserLevel();
    }
  }

  function _setUserLevel(){
    var index = _getLevelIndex(sScore.value);
    sScore.level = {
      index: index,
      score: levels[index].score,
      html: levels[index].html,
      next: index < levels.length-1 ? levels[index+1].score : levels[index].score
    };
  }

  function _getLevelIndex(score){
    var i = 0;
    while(levels[i].score < score && i < levels.length){
      i++;
    }
    return i > 0 ? i-1 : 0;
  }

  return service;
});
