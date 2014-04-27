angular.module('ionicApp.services', [])


.factory('IngredientService', function($http, Log){
    'use strict';
    var ingredientsPromise;
    var service = {
        getAsync: getIngredientAsync
    };

    function getIngredientAsync(id){
        if(id === undefined){
            return loadIngredientsAsync();
        } else {
            throw 'Can\'t load getIngredientAsync with id <'+id+'>';
        }
    }

    function loadIngredientsAsync(){
        if(!ingredientsPromise){
            ingredientsPromise = $http.get('data/ingredients.json').then(function(result) {
                Log.log('IngredientService.loadIngredientsAsync', result);
                var ingredients = result.data;
                return ingredients;
            }).then(null, function(error){
                Log.error('IngredientService.loadIngredientsAsync', error);
            });
        }
        return ingredientsPromise;
    }

    return service;
})


.factory('UserService', function($localStorage){
    'use strict';
    if(!$localStorage.user){$localStorage.user = {};}
    if(!$localStorage.user.logs){$localStorage.user.logs = [];}
    var _user = $localStorage.user;
    var service = {
        makeScan: function(barcode, from, duration){
            var time = moment().valueOf();
            navigator.geolocation.getCurrentPosition(function(position) {
                logEvent('scan', 'make', barcode, time, {
                    from: from,
                    position: position.coords,
                    duration: duration
                });
            }, function(error) {
                logEvent('scan', 'make', barcode, time, {
                    from: from,
                    duration: duration,
                    position: error
                });
            });
        },
        seeRecipe: function(recipe){logEvent('recipe', 'see', recipe.id, moment().valueOf());},
        boughtRecipe: function(recipe){logEvent('recipe', 'bought', recipe.id, moment().valueOf());},
        seeProduct: function(product){logEvent('product', 'see', product.barcode, moment().valueOf());},
        boughtProduct: function(product){logEvent('product', 'bought', product.barcode, moment().valueOf());},
        getSeenRecipes: function(max){return findInLogs('recipe', 'see', max);},
        getBoughtRecipes: function(max){return findInLogs('recipe', 'bought', max);},
        getScannedProducts: function(max){return findInLogs('product', 'see', max);},
        getBoughtProducts: function(max){return findInLogs('product', 'bought', max);},
        getLogHistory: function(){return _user.logs;}
    };

    function logEvent(elt, action, id, time, data){
        _user.logs.unshift({
            elt: elt,
            action: action,
            id: id,
            time: time,
            data: data
        });
    }

    function findInLogs(elt, action, max){
        var res = [];
        var logs = _user.logs;
        var matchId = function(r){ return r.id === logs[i].id; };
        for(var i=0; i<logs.length; i++){
            if(logs[i].elt === elt && (!action || logs[i].action === action)){
                var exist = _.find(res, matchId);
                if(!exist){
                    res.push(logs[i]);
                }
            }
            if(max && res.length >= max){
                return res;
            }
        }
        return res;
    }

    return service;
})


.factory('Util', function(){
    'use strict';
    var service = {
        isDevice: function(){
            return window.ionic.Platform.isCordova();
        }
    };

    return service;
})


.factory('Log', function(Util){
    'use strict';
    var logLevel = Util.isDevice() ? 3 : 0;
    var service = {
        alert: function(msg, obj){window.alert(msg+'\n'+JSON.stringify(obj));},
        debug: function(msg, obj){write(0, msg, obj);},
        log: function(msg, obj){write(1, msg, obj);},
        info: function(msg, obj){write(2, msg, obj);},
        warn: function(msg, obj){write(3, msg, obj);},
        error: function(msg, obj){write(4, msg, obj);},
        setLevel: function(level){
            logLevel = level;
        }
    };

    function write(level, msg, obj){
        if(level >= logLevel){
            switch(level){
                case 0:
                    if(Util.isDevice()){service.alert('DEBUG :\n'+msg, obj);}
                    else {console.log(msg, obj);}
                    break;
                case 1:
                    if(Util.isDevice()){service.alert('LOG :\n'+msg, obj);}
                    else {console.log(msg, obj);}
                    break;
                case 2:
                    if(Util.isDevice()){service.alert('INFO :\n'+msg, obj);}
                    else {console.info(msg, obj);}
                    break;
                case 3:
                    if(Util.isDevice()){service.alert('WARN :\n'+msg, obj);}
                    else {console.warn(msg, obj);}
                    break;
                case 4:
                    if(Util.isDevice()){service.alert('ERROR :\n'+msg, obj);}
                    else {console.error(msg, obj);}
                    break;
                default:
                    service.alert('ERROR: unknow log level <'+level+'>');
            }
        }
    }

    return service;
});