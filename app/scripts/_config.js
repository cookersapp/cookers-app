var Config = (function(){
  'use strict';
  var mixpanelDebugToken = '077c04989e06fd2e89eea5e22960f73e';
  var mixpanelProdToken = '41df619f80b556df0ac508e39860dd1d';
  return {
    appVersion: '~',
    debug: true,
    getMixpanelToken: function(){
      if(Config.debug){return mixpanelDebugToken;}
      else {return mixpanelProdToken;}
    }
  };
})();
