angular.module('ionicApp.services', [])


.factory('IngredientService', function($http, Log){
    var ingredientsPromise;
    var service = {
        getAsync: getIngredientAsync
    };

    function getIngredientAsync(id){
        if(id === undefined){
            return loadIngredientsAsync();
        } else {
            throw "Can't load getIngredientAsync with id <"+id+">";
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
        for(var i=0; i<logs.length; i++){
            if(logs[i].elt === elt && (!action || logs[i].action === action)){
                var exist = _.find(res, function(r){
                    return r.id === logs[i].id;
                });
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
    var service = {
        isDevice: function(){
            return ionic.Platform.isCordova();
        }
    };

    return service;
})


.factory('Log', function(Util){
    var logLevel = Util.isDevice() ? 3 : 0;
    var service = {
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
                    if(Util.isDevice()){alert("DEBUG :\n"+msg+"\n"+JSON.stringify(obj));}
                    else {console.log(msg, obj);}
                    break;
                case 1:
                    if(Util.isDevice()){alert("LOG :\n"+msg+"\n"+JSON.stringify(obj));}
                    else {console.log(msg, obj);}
                    break;
                case 2:
                    if(Util.isDevice()){alert("INFO :\n"+msg+"\n"+JSON.stringify(obj));}
                    else {console.info(msg, obj);}
                    break;
                case 3:
                    if(Util.isDevice()){alert("WARN :\n"+msg+"\n"+JSON.stringify(obj));}
                    else {console.warn(msg, obj);}
                    break;
                case 4:
                    if(Util.isDevice()){alert("ERROR :\n"+msg+"\n"+JSON.stringify(obj));}
                    else {console.error(msg, obj);}
                    break;
                default:
                    alert('ERROR: unknow log level <'+level+'>');
            }
        }
    }

    return service;
});