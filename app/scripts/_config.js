var Config = (function(){
  'use strict';
  return {
    appVersion: '~',
    debug: true,
    mixpanelDebugToken: '077c04989e06fd2e89eea5e22960f73e',
    mixpanelProdToken: '41df619f80b556df0ac508e39860dd1d',
    getMixpanelToken: function(){
      if(Config.debug){return Config.mixpanelDebugToken;}
      else {return Config.mixpanelProdToken;}
    }
  };
})();
