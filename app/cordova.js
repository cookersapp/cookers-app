if(!window.plugins){window.plugins = {};}


// for plugin https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
window.plugins.toast = {
  show: function(message, duration, position, successCallback, errorCallback){
    // durations : short, long
    // positions : top, center, bottom
    // default: short bottom
    alert('Toast: '+message);
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
  keepAwake: function(){console.log('insomnia.keepAwake()');},
  allowSleepAgain: function(){console.log('insomnia.allowSleepAgain()');}
};


// for plugin org.apache.cordova.media
window.Media = function(src, mediaSuccess, mediaError, mediaStatus){
  // src: A URI containing the audio content. (DOMString)
  // mediaSuccess: (Optional) The callback that executes after a Media object has completed the current play, record, or stop action. (Function)
  // mediaError: (Optional) The callback that executes if an error occurs. (Function)
  // mediaStatus: (Optional) The callback that executes to indicate status changes. (Function)

  if (typeof Audio !== "function" && typeof Audio !== "object") {
    console.warn("HTML5 Audio is not supported in this browser");
  }
  var sound = new Audio();
  sound.src = src;
  sound.addEventListener("ended", mediaSuccess, false);
  sound.load();

  return {
    // Returns the current position within an audio file (in seconds).
    getCurrentPosition: function(mediaSuccess, mediaError){ mediaSuccess(sound.currentTime); }, // ok
    // Returns the duration of an audio file (in seconds) or -1.
    getDuration: function(){ return isNaN(sound.duration) ? -1 : sound.duration; }, // ok
    // Start or resume playing an audio file.
    play: function(){ console.log('media play', src); sound.play(); }, // ok
    // Pause playback of an audio file.
    pause: function(){ console.log('media pause', src); sound.pause(); }, // ok
    // Releases the underlying operating system's audio resources. Should be called on a ressource when it's no longer needed !
    release: function(){},
    // Moves the position within the audio file.
    seekTo: function(milliseconds){},
    // Set the volume for audio playback (between 0.0 and 1.0).
    setVolume: function(volume){ sound.volume = volume; }, // ok
    // Start recording an audio file.
    startRecord: function(){},
    // Stop recording an audio file.
    stopRecord: function(){},
    // Stop playing an audio file.
    stop: function(){ console.log('media stop', src); sound.pause(); if(mediaSuccess){mediaSuccess();} } // TODO : correct
  };
};
// constants for mediaStatus
window.Media.MEDIA_NONE = 0;
window.Media.MEDIA_STARTING = 1;
window.Media.MEDIA_RUNNING = 2;
window.Media.MEDIA_PAUSED = 3;
window.Media.MEDIA_STOPPED = 4;
