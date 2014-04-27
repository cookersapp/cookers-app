angular.module('ionicApp.services', [])

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
})

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
});