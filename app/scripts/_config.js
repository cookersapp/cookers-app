var Config = (function(){
  'use strict';
  var cfg = {
    appVersion: '~',
    verbose: true,
    track: true,
    debug: true
  };
  var devBackendUrl = 'http://dev-cookers.herokuapp.com/';
  var prodBackendUrl = 'http://cookers.herokuapp.com/';
  cfg.backendUrl = cfg.debug ? devBackendUrl : prodBackendUrl;

  return cfg;
})();
