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
    },
    data: {
      restrict: 'connected'
    }
  })
  .state('app.feedback', {
    url: '/feedback?source',
    views: {
      'menuContent': {
        templateUrl: 'scripts/user/feedback.html',
        controller: 'FeedbackCtrl'
      }
    },
    data: {
      restrict: 'connected'
    }
  });
})

.controller('ProfileCtrl', function($scope, $state, $window, StorageSrv, UserSrv, LoginSrv, ToastSrv, LogSrv){
  'use strict';
  $scope.user = StorageSrv.getUser();

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
  if(!gravatarCoverIsInCovers($scope.user, covers) && getGravatarCover($scope.user)){ covers.unshift(getGravatarCover($scope.user)); }
  var currentCover = -1;
  $scope.changeCover = function(){
    console.log('changeCover')
    currentCover = (currentCover+1)%covers.length;
    $scope.user.backgroundCover = covers[currentCover];
    StorageSrv.saveUser($scope.user);
    LogSrv.trackChangeSetting('profileCover', $scope.user.backgroundCover);
    LogSrv.registerUser();
  };

  $scope.clearCache = function(){
    if($window.confirm('Vider le cache ?')){
      LogSrv.trackClearCache($scope.user.device.uuid);
      StorageSrv.clearCache();
    }
  };
  $scope.logout = function(){
    LoginSrv.logout().then(function(){
      LogSrv.trackLogout($scope.user.device.uuid);
      $state.go('login');
    }, function(error){
      LogSrv.trackError('logout', error);
      ToastSrv.show(error.message);
    });
  };
  $scope.resetApp = function(){
    if($window.confirm('Réinitialiser complètement l\'application ?')){
      LogSrv.trackClearApp($scope.user.device.uuid);
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

.controller('FeedbackCtrl', function($scope, $stateParams, $window, UserSrv, StorageSrv, EmailSrv, LogSrv){
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
        $window.alert('Echec de l\'envoi du email. Réessayez !');
      }
    });
    if(user.email !== $scope.feedback.email){
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
    accent_color: '#f62',
    trigger_color: 'white',
    trigger_background_color: '#f62'
  }]);
  var identity = {};
  if(user && user.email)                      { identity.email      = user.email;           }
  if(user && user.name)                       { identity.name       = user.name;            }
  if(app && app.firstLaunch)                  { identity.created_at = app.firstLaunch/1000; }
  if(user && user.device && user.device.uuid) { identity.id         = user.device.uuid;     }
  UserVoice.push(['identify', identity]);
  UserVoice.push(['addTrigger', '#uservoice', {mode: 'smartvote'}]);
  UserVoice.push(['autoprompt', {}]);
})

.factory('UserSrv', function($q, StorageSrv, $http, localStorageDefault, md5){
  'use strict';
  var service = {
    hasMail: hasMail,
    setEmail: setEmail,
    updateUserProfile: updateUserProfile
  };

  function hasMail(){
    var user = StorageSrv.getUser();
    return user && user.email && user.email.length > 0;
  }

  function setEmail(email){
    var user = StorageSrv.getUser();
    user.email = email;
    StorageSrv.saveUser(user);
    if(email){
      return _updateGravatar(email).then(function(){
        return updateUserProfile();
      });
    } else {
      return $q.when();
    }
  }

  function updateUserProfile(){
    var user = StorageSrv.getUser();
    var userProfiles = StorageSrv.getUserProfiles();

    var defaultProfile = _defaultProfile();
    var gravatarProfile = _gravatarProfile(userProfiles.gravatar);
    var passwordProfile = _passwordProfile(userProfiles.password);
    var twitterProfile = _twitterProfile(userProfiles.twitter);
    var facebookProfile = _facebookProfile(userProfiles.facebook);
    var googleProfile = _googleProfile(userProfiles.google);

    angular.extend(user, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);
    angular.extend(user.more, defaultProfile.more, gravatarProfile.more, passwordProfile.more, twitterProfile.more, facebookProfile.more, googleProfile.more);

    if(user.email !== gravatarProfile.email){
      return _updateGravatar(user.email).then(function(gravatarData){
        gravatarProfile = _gravatarProfile(gravatarData);
        angular.extend(user, defaultProfile, gravatarProfile, passwordProfile, twitterProfile, facebookProfile, googleProfile);
        angular.extend(user.more, defaultProfile.more, gravatarProfile.more, passwordProfile.more, twitterProfile.more, facebookProfile.more, googleProfile.more);
        StorageSrv.saveUser(user);
      });
    } else {
      StorageSrv.saveUser(user);
      return $q.when(user);
    }
  }

  function _updateGravatar(email){
    if(email && email.length > 0){
      var hash = md5.createHash(email);
      var user = StorageSrv.getUser();
      var defaultGravatarData = {
        entry: [
          {email: email, hash: hash}
        ]
      };

      // remove gravatar because it does not return valid json if user is unknown :(
      // to re-enable it, I should create a proxy server which wraps "not found" string in valid json !
      /*return $http.jsonp('http://www.gravatar.com/'+hash+'.json?callback=JSON_CALLBACK').then(function(result){
        if(result && result.data){
          var g = result.data;
          if(g && g.entry && g.entry.length > 0){
            g.entry[0].email = email;
          }
          return g;
        } else {
          return defaultGravatarData;
        }
      }).then(function(gravatarData){
        var userProfiles = StorageSrv.getUserProfiles();
        userProfiles.gravatar = gravatarData;
        StorageSrv.saveUserProfiles(userProfiles);
        return gravatarData;
      });*/
      
      return $q.when(defaultGravatarData).then(function(gravatarData){
        var userProfiles = StorageSrv.getUserProfiles();
        userProfiles.gravatar = gravatarData;
        StorageSrv.saveUserProfiles(userProfiles);
        return gravatarData;
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
      lastName: localStorageDefault.user.lastName,
      more: {}
    };
  }

  function _gravatarProfile(g){
    var profile = {more:{}};
    if(g && g.entry && g.entry.length > 0){
      var d = g.entry[0];
      if(d.email)                         { profile.email                         = d.email;                    }
      if(d.displayName)                   { profile.name                          = d.displayName;              }
      if(d.thumbnailUrl)                  { profile.avatar                        = d.thumbnailUrl;             }
      if(d.aboutMe)                       { profile.more.gravatarDescription      = d.aboutMe;                  }
      if(d.hash)                          { profile.more.gravatarHash             = d.hash;                     }
      if(d.profileUrl)                    { profile.more.gravatarProfile          = d.profileUrl;               }
      if(d.currentLocation)               { profile.more.gravatarLocation         = d.currentLocation;          }
      if(d.name){
        if(d.name.givenName)              { profile.firstName                     = d.name.givenName;           }
        if(d.name.familyName)             { profile.lastName                      = d.name.familyName;          }
        if(d.name.formatted)              { profile.name                          = d.name.formatted;           }
      }
      if(d.profileBackground){
        if(d.profileBackground.color)     { profile.background                    = d.profileBackground.color;  }
        if(d.profileBackground.url)       { profile.backgroundCover               = d.profileBackground.url;    }
      }
      if(d.accounts && d.accounts.length > 0){
        for(var i in d.accounts){
          var di = d.accounts[i];
          if(di.shortname && di.url)      { profile.more[di.shortname+'Profile']  = di.url;                     }
          if(di.shortname && di.username) { profile.more[di.shortname+'Username'] = di.username;                }
        }
      }
    }
    return profile;
  }

  function _passwordProfile(p){
    var profile = {more:{}};
    if(p){
      if(p.email) { profile.email           = p.email;  }
      if(p.id)    { profile.more.firebaseId = p.id;     }
    }
    return profile;
  }

  function _twitterProfile(t){
    var profile = {more:{}};
    if(t){
      if(t.displayName)                           { profile.name                    = t.displayName;                                        }
      if(t.username)                              { profile.more.twitterUsername    = t.username;                                           }
      if(t.username)                              { profile.more.twitterProfile     = 'https://twitter.com/'+t.username;                    }
      if(t.id)                                    { profile.more.twitterId          = t.id;                                                 }
      if(t.thirdPartyUserData){
        var d = t.thirdPartyUserData;
        if(d.profile_image_url)                   { profile.avatar                  = d.profile_image_url.replace('_normal.', '_bigger.');  }
        if(d.profile_background_color)            { profile.background              = '#'+d.profile_background_color;                       }
        if(d.profile_background_image_url_https)  { profile.backgroundCover         = d.profile_background_image_url_https;                 }
        if(d.description)                         { profile.more.twitterDescription = d.description;                                        }
        if(d.followers_count)                     { profile.more.twitterFollowers   = d.followers_count;                                    }
      }
    }
    return profile;
  }

  function _facebookProfile(f){
    var profile = {more:{}};
    if(f){
      if(f.displayName)           { profile.name                  = f.displayName;                                    }
      if(f.id)                    { profile.more.facebookId       = f.id;                                             }
      if(f.thirdPartyUserData){
        var d = f.thirdPartyUserData;
        if(d.email)               { profile.email                 = d.email;                                          }
        if(d.first_name)          { profile.firstName             = d.first_name;                                     }
        if(d.last_name)           { profile.lastName              = d.last_name;                                      }
        if(d.link)                { profile.more.facebookProfile  = d.link;                                           }
        if(d.gender)              { profile.more.gender           = d.gender;                                         }
        if(d.age_range){
          if(d.age_range.min)     { profile.more.minAge           = d.age_range.min;                                  }
          if(d.age_range.max)     { profile.more.maxAge           = d.age_range.max;                                  }
        }
        if(d.picture && d.picture.data){
          if(d.picture.data.url)  { profile.avatar                = d.picture.data.url;                               }
        }
      }
    }
    return profile;
  }

  function _googleProfile(g){
    var profile = {more:{}};
    if(g){
      if(g.displayName)   { profile.name                = g.displayName;  }
      if(g.email)         { profile.email               = g.email;        }
      if(g.id)            { profile.more.googleId       = g.id;           }
      if(g.thirdPartyUserData){
        var d = g.thirdPartyUserData;
        if(d.given_name)  { profile.firstName           = d.given_name;   }
        if(d.family_name) { profile.lastName            = d.family_name;  }
        if(d.picture)     { profile.avatar              = d.picture;      }
        if(d.gender)      { profile.more.gender         = d.gender;       }
        if(d.link)        { profile.more.googleProfile  = d.link;         }
      }
    }
    return profile;
  }

  return service;
});
