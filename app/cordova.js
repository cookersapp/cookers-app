if(!window.plugins){window.plugins = {};}
if(!window.navigator){window.navigator = {};}
if(!window.navigator.notification){window.navigator.notification = {};}

// for plugin https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
window.plugins.toast = {
  show: function(message, duration, position, successCallback, errorCallback){
    // durations : short, long
    // positions : top, center, bottom
    // default: short bottom
    console.log('Toast: '+message);
    if(successCallback){window.setTimeout(successCallback('OK'), 0);}
  },
  showShortTop: function(message, successCallback, errorCallback){this.show(message, 'short', 'top', successCallback, errorCallback);},
  showShortCenter: function(message, successCallback, errorCallback){this.show(message, 'short', 'center', successCallback, errorCallback);},
  showShortBottom: function(message, successCallback, errorCallback){this.show(message, 'short', 'bottom', successCallback, errorCallback);},
  showLongTop: function(message, successCallback, errorCallback){this.show(message, 'long', 'top', successCallback, errorCallback);},
  showLongCenter: function(message, successCallback, errorCallback){this.show(message, 'long', 'center', successCallback, errorCallback);},
  showLongBottom: function(message, successCallback, errorCallback){this.show(message, 'long', 'bottom', successCallback, errorCallback);}
};


// for plugin https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git
window.plugins.insomnia = {
  keepAwake: function(){/*console.log('insomnia.keepAwake()');*/},
  allowSleepAgain: function(){/*console.log('insomnia.allowSleepAgain()');*/}
};


// for plugin org.apache.cordova.media
window.Media = function(src, mediaSuccess, mediaError, mediaStatus){
  // src: A URI containing the audio content. (DOMString)
  // mediaSuccess: (Optional) The callback that executes after a Media object has completed the current play, record, or stop action. (Function)
  // mediaError: (Optional) The callback that executes if an error occurs. (Function)
  // mediaStatus: (Optional) The callback that executes to indicate status changes. (Function)

  if (typeof Audio !== 'function' && typeof Audio !== 'object') {
    console.warn('HTML5 Audio is not supported in this browser');
  }
  var sound = new Audio();
  sound.src = src;
  sound.addEventListener('ended', mediaSuccess, false);
  sound.load();

  return {
    // Returns the current position within an audio file (in seconds).
    getCurrentPosition: function(mediaSuccess, mediaError){ mediaSuccess(sound.currentTime); },
    // Returns the duration of an audio file (in seconds) or -1.
    getDuration: function(){ return isNaN(sound.duration) ? -1 : sound.duration; },
    // Start or resume playing an audio file.
    play: function(){ sound.play(); },
    // Pause playback of an audio file.
    pause: function(){ sound.pause(); },
    // Releases the underlying operating system's audio resources. Should be called on a ressource when it's no longer needed !
    release: function(){},
    // Moves the position within the audio file.
    seekTo: function(milliseconds){}, // TODO
    // Set the volume for audio playback (between 0.0 and 1.0).
    setVolume: function(volume){ sound.volume = volume; },
    // Start recording an audio file.
    startRecord: function(){},
    // Stop recording an audio file.
    stopRecord: function(){},
    // Stop playing an audio file.
    stop: function(){ sound.pause(); if(mediaSuccess){mediaSuccess();} } // TODO
  };
};

// for plugin https://github.com/loicknuchel/cordova-device-accounts.git
window.plugins.DeviceAccounts = {
  get: function(onSuccess, onFail){ onSuccess(/*[{type:'com.google', name:'test@example.com'}]*/); },
  getByType: function(type, onSuccess, onFail){ onSuccess(/*[{type:'com.google', name:'test@example.com'}]*/); },
  getEmails: function(onSuccess, onFail){ onSuccess(/*['test@example.com']*/); },
  getEmail: function(onSuccess, onFail){ onSuccess(/*'test@example.com'*/); }
};

// for plugin org.apache.cordova.dialogs
window.navigator.notification = (function(){
  var ctx = new(window.audioContext || window.webkitAudioContext);
  function html5Beep(callback){
    var duration = 200;
    var type = 0;
    if(!callback){callback = function(){};}
    var osc = ctx.createOscillator();
    osc.type = type;
    osc.connect(ctx.destination);
    osc.noteOn(0);
    window.setTimeout(function(){
      osc.noteOff(0);
      callback();
    }, duration);
  }

  function beep(times){
    if(times > 0){
      html5Beep(function(){
        window.setTimeout(function(){beep(times-1);}, 500);
      });
    }
  }

  return {
    alert: function(message, alertCallback, title, buttonName){
      window.alert(message);
      if(alertCallback){alertCallback();}
    },
    confirm: function(message, confirmCallback, title, buttonLabels){
      var c = window.confirm(message);
      if(confirmCallback){confirmCallback(c ? 1 : 2);}
    },
    prompt: function(message, promptCallback, title, buttonLabels, defaultText){
      var text = window.prompt(message, defaultText);
      if(promptCallback){promptCallback({buttonIndex: text ? 1 : 2, input1: text});}
    },
    beep: beep
  };
})();

// add property cordova with a delay because it prevents deviceready to get fired !!!
setTimeout(function(){
  if(!window.cordova){window.cordova = {plugins: {}};}

  window.cordova.plugins.barcodeScanner = {
    Encode: {TEXT_TYPE: 'TEXT_TYPE', EMAIL_TYPE: 'EMAIL_TYPE', PHONE_TYPE: 'PHONE_TYPE', SMS_TYPE: 'SMS_TYPE'},
    scan: function(success, fail){
      var barcode = window.prompt('barcode :');
      var format = 'QR_CODE';
      if((new RegExp('([0-9]{13})', 'i')).test(barcode)){ format = 'EAN_13'; }

      if(barcode == null){
        if(success){success({ text: null, format: format, cancelled: true });}
      } else {
        if(success){success({ text: barcode, format: format, cancelled: false });}
      }
    },
    encode: function (type, data, successCallback, errorCallback, options){

    }
  };
}, 3000);
