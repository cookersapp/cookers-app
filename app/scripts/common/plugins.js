angular.module('app')

// for Toast plugin : https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin
.factory('ToastSrv', function($window, $ionicPlatform, LogSrv){
  'use strict';
  var service = {
    show: show,
    showShortTop    : function(message, successCb, errorCb){ show(message, 'short', 'top', successCb, errorCb);     },
    showShortCenter : function(message, successCb, errorCb){ show(message, 'short', 'center', successCb, errorCb);  },
    showShortBottom : function(message, successCb, errorCb){ show(message, 'short', 'bottom', successCb, errorCb);  },
    showLongTop     : function(message, successCb, errorCb){ show(message, 'long', 'top', successCb, errorCb);      },
    showLongCenter  : function(message, successCb, errorCb){ show(message, 'long', 'center', successCb, errorCb);   },
    showLongBottom  : function(message, successCb, errorCb){ show(message, 'long', 'bottom', successCb, errorCb);   }
  };

  function show(message, duration, position, successCb, errorCb){
    if(!duration)   { duration  = 'short';            } // possible values : 'short', 'long'
    if(!position)   { position  = 'bottom';           } // possible values : 'top', 'center', 'bottom'
    if(!successCb)  { successCb = function(status){}; }
    if(!errorCb)    { errorCb   = function(error){};  }
    pluginReady(function(){
      $window.plugins.toast.show(message, duration, position, successCb, errorCb);
    });
  }

  function pluginReady(fn){
    $ionicPlatform.ready(function(){
      if($window.plugins && $window.plugins.toast){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:Toast');
      }
    });
  }

  return service;
})

// for Media plugin : http://plugins.cordova.io/#/package/org.apache.cordova.media
.factory('MediaSrv', function($q, $window, $ionicPlatform, LogSrv){
  'use strict';
  var service = {
    loadMedia: loadMedia,
    getStatusMessage: getStatusMessage,
    getErrorMessage: getErrorMessage,

    loadTimerAlarm: function(onStop, onError, onStatus){ return loadMedia('sounds/timerEnds.mp3', onStop, onError, onStatus); }
  };

  function loadMedia(src, onStop, onError, onStatus){
    var defer = $q.defer();
    pluginReady(function(){
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
    }, defer);
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

  function pluginReady(fn, defer){
    $ionicPlatform.ready(function(){
      if($window.Media){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:Media');
        defer.reject('pluginNotFound:Media');
      }
    });
  }

  return service;
})

// for Insomnia plugin : https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin
.factory('InsomniaSrv', function($window, $ionicPlatform, LogSrv){
  'use strict';
  var service = {
    keepAwake: keepAwake,
    allowSleepAgain: allowSleepAgain
  };

  function keepAwake(){
    pluginReady(function(){
      $window.plugins.insomnia.keepAwake();
    });
  }

  function allowSleepAgain(){
    pluginReady(function(){
      $window.plugins.insomnia.allowSleepAgain();
    });
  }

  function pluginReady(fn){
    $ionicPlatform.ready(function(){
      if($window.plugins && $window.plugins.insomnia){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:Insomnia');
      }
    });
  }

  return service;
})

// for Accounts plugin : hhttps://github.com/loicknuchel/cordova-device-accounts
.factory('AccountsSrv', function($window, $ionicPlatform, LogSrv){
  'use strict';
  var service = {
    getAccounts: getAccounts,
    getEmail: getEmail
  };

  function getAccounts(onSuccess, onFail){
    pluginReady(function(){
      $window.plugins.DeviceAccounts.get(onSuccess, onFail);
    });
  }

  function getEmail(onSuccess, onFail){
    pluginReady(function(){
      $window.plugins.DeviceAccounts.getEmail(onSuccess, onFail);
    });
  }

  function pluginReady(fn){
    $ionicPlatform.ready(function(){
      if($window.plugins && $window.plugins.DeviceAccounts){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:DeviceAccounts');
      }
    });
  }

  return service;
});
