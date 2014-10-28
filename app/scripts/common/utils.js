angular.module('app')

.factory('Utils', function($interval){
  'use strict';
  var service = {
    createUuid: createUuid,
    extendDeep: extendDeep,
    isEmail: isEmail,
    endsWith: endsWith,
    randInt: randInt,
    clock: addClock,
    cancelClock: removeClock,
    getDevice: getDevice,
    exitApp: exitApp
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

  function randInt(min, max){
    return Math.floor(Math.random()*(max - min + 1)) - min;
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

  function exitApp(){
    if(navigator.app){
      navigator.app.exitApp();
    } else if(navigator.device){
      navigator.device.exitApp();
    }
  }

  return service;
})

.factory('CollectionUtils', function(){
  'use strict';
  var service = {
    clear: clear,
    copy: copy,
    replaceElt: replaceElt,
    replaceEltById: replaceEltById,
    toMap: toMap,
    toArray: toArray,
    size: size,
    isEmpty: isEmpty
  };

  function clear(col){
    if(Array.isArray(col)){
      while(col.length > 0) { col.pop(); }
    } else {
      for(var i in col){
        delete col[i];
      }
    }
  }

  function copy(src, dest){
    if(Array.isArray(dest)){
      clear(dest);
      for(var i in src){
        dest.push(src[i]);
      }
    }
  }

  function replaceElt(collection, matcher, elt){
    var foundElt = _.find(collection, matcher);
    if(foundElt){
      var replacedElt = angular.copy(foundElt);
      angular.copy(elt, foundElt);
      return replacedElt;
    }
  }

  function replaceEltById(collection, elt){
    return replaceElt(collection, {id: elt.id}, elt);
  }

  function toMap(arr){
    var map = {};
    if(Array.isArray(arr)){
      for(var i in arr){
        map[arr[i].id] = arr[i];
      }
    }
    return map;
  }

  function toArray(map, addTo){
    var arr = addTo ? addTo : [];
    for(var i in map){
      map[i].id = i;
      arr.push(map[i]);
    }
    return arr;
  }

  function size(col){
    if(Array.isArray(col)){
      return col.length;
    } else if(typeof col === 'object'){
      return Object.keys(col).length;
    } else {
      return 0;
    }
  }

  function isEmpty(col){
    return size(col) === 0;
  }

  return service;
})

.factory('PopupSrv', function($rootScope, $q, $ionicPopup, $ionicActionSheet, ToastSrv, Config){
  'use strict';
  var service = {
    forceAskEmail: forceAskEmail,
    changeServings: changeServings,
    recipeCooked: recipeCooked,
    tourCookFeatures: tourCookFeatures,
    tourCartFeatures: tourCartFeatures
  };

  function forceAskEmail(){
    if(Config.defaultEmail){
      return $q.when(Config.defaultEmail);
    } else {
      var $scope = $rootScope.$new(true);
      $scope.data = {email: ''};
      return $ionicPopup.show({
        template: '<input type="email" placeholder="Email" ng-model="data.email">',
        title: 'Restons en contact !<br>Lâche ton email <i class="fa fa-smile-o">',
        subTitle: 'Aucun spam garanti !',
        scope: $scope,
        buttons: [{
          text: '<b>Continuer</b>',
          type: 'button-positive',
          onTap: function(e) {
            if(!$scope.data.email){
              e.preventDefault();
              ToastSrv.show('Please, enter you email !');
            } else {
              return $scope.data.email;
            }
          }
        }]
      });
    }
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
