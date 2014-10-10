var Config = (function(){
  'use strict';
  var cfg = {
    appVersion: '~',
    verbose: true,
    debug: true,
    track: true
  };
  var localBackendUrl = 'http://localhost:9000';
  var devBackendUrl = 'http://dev-cookers.herokuapp.com';
  var prodBackendUrl = 'http://cookers.herokuapp.com';
  cfg.backendUrl = cfg.debug ? devBackendUrl : prodBackendUrl;

  return cfg;
})();
