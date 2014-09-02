angular.module('app')

.factory('Utils', function($window, $interval){
  'use strict';
  var service = {
    createUuid: createUuid,
    extendDeep: extendDeep,
    isEmail: isEmail,
    endsWith: endsWith,
    clock: addClock,
    cancelClock: removeClock,
    getDevice: getDevice
  };

  function createUuid(){
    function S4(){ return (((1+Math.random())*0x10000)|0).toString(16).substring(1); }
    return (S4() + S4() + '-' + S4() + '-4' + S4().substr(0,3) + '-' + S4() + '-' + S4() + S4() + S4()).toLowerCase();
  }

  function extendDeep(dest){
    angular.forEach(arguments, function(arg){
      if(arg !== dest){
        angular.forEach(arg, function(value, key){
          if(dest[key] && typeof dest[key] === 'object'){
            extendDeep(dest[key], value);
          } else {
            dest[key] = angular.copy(value);
          }
        });
      }
    });
    return dest;
  }

  function isEmail(str){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(str);
  }

  function endsWith(str, suffix){
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  var clockElts = [];
  var clockTimer = null;
  var clockCpt = 0;
  function addClock(fn){
    var elt = {
      id: clockCpt++,
      fn: fn
    };
    clockElts.push(elt);
    if(clockElts.length === 1){ startClock(); }
    return elt.id;
  }
  function removeClock(id){
    for(var i in clockElts){
      if(clockElts[i].id === id){
        clockElts.splice(i, 1);
      }
    }
    if(clockElts.length === 0){ stopClock(); }
  }
  function startClock(){
    if(clockTimer === null){
      clockTimer = $interval(function(){
        for(var i in clockElts){
          clockElts[i].fn();
        }
      }, 1000);
    }
  }
  function stopClock(){
    if(clockTimer !== null){
      $interval.cancel(clockTimer);
      clockTimer = null;
    }
  }

  function getDevice(){
    var device = angular.copy(ionic.Platform.device());
    delete device.getInfo;
    device.environment = _getEnvironment();
    device.grade = ionic.Platform.grade;
    device.platforms = ionic.Platform.platforms;
    if(!device.uuid){
      device.uuid = createUuid();
    }
    return device;
  }

  function _getEnvironment(){
    if(ionic.Platform.isWebView()){return 'WebView';}
    else if(ionic.Platform.isIPad()){return 'IPad';}
    else if(ionic.Platform.isIOS()){return 'IOS';}
    else if(ionic.Platform.isAndroid()){return 'Android';}
    else if(ionic.Platform.isWindowsPhone()){return 'WindowsPhone';}
    else {return 'Unknown';}
  }

  return service;
})

// for media plugin : http://plugins.cordova.io/#/package/org.apache.cordova.media
.factory('MediaSrv', function($q, $ionicPlatform, $window, LogSrv){
  'use strict';
  var service = {
    loadMedia: loadMedia,
    getStatusMessage: getStatusMessage,
    getErrorMessage: getErrorMessage,

    loadTimerAlarm: function(onStop, onError, onStatus){ return loadMedia('sounds/timerEnds.mp3', onStop, onError, onStatus); }
  };

  function loadMedia(src, onStop, onError, onStatus){
    var defer = $q.defer();
    $ionicPlatform.ready(function(){
      var mediaSuccess = function(){
        if(onStop){onStop();}
      };
      var mediaError = function(err){
        _logError(src, err);
        if(onError){onError(err);}
      };
      var mediaStatus = function(status){
        if(onStatus){onStatus(status);}
      };

      if($ionicPlatform.is('android')){src = '/android_asset/www/' + src;}
      defer.resolve(new $window.Media(src, mediaSuccess, mediaError, mediaStatus));
    });
    return defer.promise;
  }

  function _logError(src, err){
    LogSrv.trackError('media', {
      src: src,
      code: err.code,
      message: getErrorMessage(err.code)
    });
  }

  function getStatusMessage(status){
    if(status === 0){return 'Media.MEDIA_NONE';}
    else if(status === 1){return 'Media.MEDIA_STARTING';}
    else if(status === 2){return 'Media.MEDIA_RUNNING';}
    else if(status === 3){return 'Media.MEDIA_PAUSED';}
    else if(status === 4){return 'Media.MEDIA_STOPPED';}
    else {return 'Unknown status <'+status+'>';}
  }

  function getErrorMessage(code){
    if(code === 1){return 'MediaError.MEDIA_ERR_ABORTED';}
    else if(code === 2){return 'MediaError.MEDIA_ERR_NETWORK';}
    else if(code === 3){return 'MediaError.MEDIA_ERR_DECODE';}
    else if(code === 4){return 'MediaError.MEDIA_ERR_NONE_SUPPORTED';}
    else {return 'Unknown code <'+code+'>';}
  }

  return service;
})

.factory('PopupSrv', function($rootScope, $q, $ionicPopup, $ionicActionSheet, $window){
  'use strict';
  var service = {
    askMail: askMail,
    changeServings: changeServings,
    recipeCooked: recipeCooked,
    tourCookFeatures: tourCookFeatures,
    tourCartFeatures: tourCartFeatures
  };

  function askMail(){
    var $scope = $rootScope.$new(true);
    $scope.data = {
      email: '',
      shouldInsist: true
    };

    return $ionicPopup.show({
      title: '<i class="fa fa-smile-o"></i> Lâche ton mail &nbsp;<i class="fa fa-smile-o"></i>',
      subTitle: '!! No spam guaranteed !!',
      template: '<input type="email" placeholder="ex: nom@example.com" ng-model="data.email" required>',
      scope: $scope,
      buttons: [
        { text: 'Non !', onTap: function(e){
          if($scope.data.shouldInsist){
            $window.plugins.toast.show('S\'il-te-plaît ...');
            $scope.data.shouldInsist = false;
            e.preventDefault();
          } else {
            return '';
          }
        }},
        { text: '<b>Voilà !</b>', type: 'button-positive', onTap: function(e){
          if($scope.data.email){
            $window.plugins.toast.show('Merci :D');
            return $scope.data.email;
          } else {
            e.preventDefault();
          }
        }}
      ]
    });
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

  function recipeCooked(){
    /*return $ionicPopup.show({
      title: 'La recette est maintenant terminée !',
      subTitle: 'Que veux-tu faire ?',
      buttons: [{
        text: 'Revenir à l\'accueil',
        onTap: function(e){
          return false;
        }
      }, {
        text: '<b>Quitter l\'application</b>',
        type: 'button-positive',
        onTap: function(e){
          return true;
        }
      }]
    });*/
    var defer = $q.defer();
    $ionicActionSheet.show({
      titleText: 'La recette est maintenant terminée ! Que faire ?',
      destructiveText: 'Quitter l\'application',
      destructiveButtonClicked: function() {
        defer.resolve(true);
      },
      cancelText: 'Revenir à l\'accueil',
      cancel: function() {
        defer.resolve(false);
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
