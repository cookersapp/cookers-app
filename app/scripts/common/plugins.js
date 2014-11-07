angular.module('app')

// for BarcodeScanner plugin : https://github.com/wildabeast/BarcodeScanner.git
.factory('BarcodeSrv', function($window, $ionicPlatform, LogSrv){
  'use strict';
  var service = {
    scan: scan,
    encode: encode
  };

  function scan(success, error){
    pluginReady(function(){
      $window.cordova.plugins.barcodeScanner.scan(success, error);
    });
  }

  function encode(){
    // Not Working !!!
    pluginReady(function(){
      $window.cordova.plugins.barcodeScanner.encode(
        'TEXT_TYPE', // TEXT_TYPE, EMAIL_TYPE, PHONE_TYPE, SMS_TYPE
        'http://www.nytimes.com',
        function(success){
          console.log('encode success: ', success);
        },
        function(fail){
          console.log('encoding failed: ', fail);
        });
    });
  }

  function pluginReady(fn){
    $ionicPlatform.ready(function(){
      if($window.cordova && $window.cordova.plugins && $window.cordova.plugins.barcodeScanner){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:BarcodeScanner');
      }
    });
  }

  return service;
})

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

// for Dialogs plugin : org.apache.cordova.dialogs
.factory('DialogSrv', function($window, $ionicPlatform, $q, LogSrv){
  'use strict';
  /*
   * Button indexes :
   *    - 0 : cancel with backdrop
   *    - 1 : Ok
   *    - 2 : Annuler
   * Or, your index in buttonLabels array but one based !!! (0 is still cancel)
   */
  var service = {
    alert: pluginAlert,
    confirm: function(message, _title){
      return pluginConfirm(message, _title).then(function(buttonIndex){
        return _isConfirm(buttonIndex);
      });
    },
    confirmMulti: pluginConfirm,
    prompt: function(message, _title, _defaultText){
      return pluginPrompt(message, _title, null, _defaultText).then(function(result){
        result.confirm = _isConfirm(result.buttonIndex);
        return result;
      });
    },
    promptMulti: pluginPrompt,
    beep: pluginBeep
  };

  function pluginAlert(message, _title, _buttonName){
    var defer = $q.defer();
    pluginReady(function(){
      $window.navigator.notification.alert(message, function(){ defer.resolve(); }, _title, _buttonName);
    }, function(){
      $window.alert(message);
      defer.resolve();
    });
    return defer.promise;
  }

  function pluginConfirm(message, _title, _buttonLabels){
    var defer = $q.defer();
    pluginReady(function(){
      $window.navigator.notification.confirm(message, function(buttonIndex){ defer.resolve(buttonIndex); }, _title, _buttonLabels);
    }, function(){ defer.resolve(_toButtonIndex($window.confirm(message))); });
    return defer.promise;
  }

  function pluginPrompt(message, _title, _buttonLabels, _defaultText){
    var defer = $q.defer();
    pluginReady(function(){
      $window.navigator.notification.prompt(message, function(result){ defer.resolve(result); }, _title, _buttonLabels, _defaultText);
    }, function(){
      var text = $window.prompt(message, _defaultText);
      defer.resolve({buttonIndex: _toButtonIndex(text), input1: text});
    });
    return defer.promise;
  }

  function pluginBeep(times){
    pluginReady(function(){
      $window.navigator.notification.beep(times);
    }, function(){
      if(beepFallback){beepFallback(times);}
    });
  }
  
  function _isConfirm(buttonIndex){
    return buttonIndex === 1 ? true : false;
  }
  function _toButtonIndex(value){
    return value ? 1 : 2;
  }

  if(window.audioContext || window.webkitAudioContext){
    var ctx = new(window.audioContext || window.webkitAudioContext);
    var html5Beep = function(callback){
      var duration = 200;
      var type = 0;
      if(!callback){callback = function(){};}
      var osc = ctx.createOscillator();
      osc.type = type;
      osc.connect(ctx.destination);
      osc.noteOn(0);
      $window.setTimeout(function(){
        osc.noteOff(0);
        callback();
      }, duration);
    };
    var beepFallback = function(times){
      if(times > 0){
        html5Beep(function(){
          $window.setTimeout(function(){beepFallback(times-1);}, 500);
        });
      }
    };
  }

  function pluginReady(fn, fnErr){
    $ionicPlatform.ready(function(){
      if($window.navigator && $window.navigator.notification){
        fn();
      } else {
        LogSrv.trackError('pluginNotFound:Dialogs');
        fnErr();
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

// for Accounts plugin : https://github.com/loicknuchel/cordova-device-accounts
.factory('AccountsSrv', function($q, $window, $ionicPlatform, PopupSrv, LogSrv){
  'use strict';
  var service = {
    getAccounts: getAccounts,
    getEmail: getEmail,
    getEmailOrAsk: getEmailOrAsk
  };

  function getAccounts(){
    var defer = $q.defer();
    pluginReady(function(){
      $window.plugins.DeviceAccounts.get(function(accounts){
        defer.resolve(accounts);
      }, function(error){
        defer.reject(error);
      });
    });
    return defer.promise;
  }

  function getEmail(){
    var defer = $q.defer();
    pluginReady(function(){
      $window.plugins.DeviceAccounts.getEmail(function(email){
        defer.resolve(email);
      }, function(error){
        defer.reject(error);
      });
    });
    return defer.promise;
  }

  // TODO
  function getEmailOrAsk(){
    var defer = $q.defer();
    pluginReady(function(){
      $window.plugins.DeviceAccounts.getEmail(function(email){
        if(email){
          defer.resolve(email);
        } else {
          PopupSrv.forceAskEmail().then(function(email){
            defer.resolve(email);
          });
        }
      }, function(error){
        PopupSrv.forceAskEmail().then(function(email){
          defer.resolve(email);
        });
      });
    });
    return defer.promise;
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
