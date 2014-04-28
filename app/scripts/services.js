angular.module('ionicApp.services', [])


.factory('IngredientService', function(DataArrayService){
    'use strict';
    var dataUrl = 'data/ingredients.json';
    var service = {
        getAsync: function(id){return DataArrayService.getAsync(dataUrl, id);}
    };

    return service;
})


.factory('CategoryService', function(DataArrayService){
    'use strict';
    var dataUrl = 'data/ingredient_categories.json';
    var service = {
        getAsync: function(id){return DataArrayService.getAsync(dataUrl, id);}
    };

    return service;
})


.factory('ShoppinglistService', function($localStorage, IngredientService, CategoryService){
    if(!$localStorage.shoppingLists){$localStorage.shoppingLists = createLists();}
    var shoppingLists = $localStorage.shoppingLists;
    var service = {
        getAllLists: function(){return shoppingLists.lists;},
        getCurrentList: getCurrentList,
        newList: function(){return createList();},
        addList: addList,
        removeCurrentList: removeCurrentList,
        clearCurrentList: clearCurrentList,
        setCurrentList: setCurrentList,
        getCurrentListItem: getCurrentListItem,
        existInCurrentList: existInCurrentList,
        addToCurrentList: addIngredientToCurrentList
    };

    function getCurrentList(){
        return shoppingLists.current !== null ? shoppingLists.lists[shoppingLists.current] : null;
    }
    function addList(list){
        shoppingLists.lists.unshift(list);
        shoppingLists.current = 0;
        return getCurrentList();
    }
    function removeCurrentList(){
        if(shoppingLists.current !== null){
            shoppingLists.lists.splice(shoppingLists.current, 1);
            if(shoppingLists.lists.length > 0){
                shoppingLists.current = 0;
            } else {
                shoppingLists.current = null;
            }
        }
        return getCurrentList();
    }
    function clearCurrentList(){
        var list = getCurrentList();
        if(list !== null){
            list.categories = [];
            list.boughtItems = [];
        }
    }
    function setCurrentList(list){
        // TODO test if list is an int (=> index) or an object (=> list)
        var index = shoppingLists.lists.indexOf(list);
        if(index !== -1){
            shoppingLists.current = index;
        }
        return getCurrentList();
    }
    function getCurrentListItem(ingredient){
        var list = getCurrentList();
        for(var i in list.categories){
            for(var j in list.categories[i]){
                if(list.categories[i][j].ingredient.id === ingredient.id){
                    return list.categories[i][j];
                }
            }
        }
        for(var i in list.boughtItems){
            if(list.boughtItems[i].ingredient.id === ingredient.id){
                return list.boughtItems[i];
            }
        }
    }
    function existInCurrentList(ingredient){
        return getCurrentListItem(ingredient) !== undefined;
    }
    function addIngredientToCurrentList(ingredient, notes, quantity, quantityUnit){
        var list = getCurrentList();
        if(list !== null){
            if(typeof ingredient === 'string'){
                IngredientService.getAsync(ingredient).then(function(ingredient){
                    addToCurrentList(ingredient, notes, quantity, quantityUnit);
                });
            } else if(ingredient && !existInCurrentList(ingredient)){
                var item = createItem(ingredient, notes, quantity, quantityUnit);
                addItemToList(list, item);
            }
        }
    }
    function addItemToList(list, item){
        CategoryService.getAsync(item.ingredient.category).then(function(category){
            if(category) {
                var listCategory = getListCategory(list, category);
                if(!listCategory){listCategory = addCategoryToList(list, category);}
                listCategory.items.push(item);
            }
        });
    }
    function getListCategory(list, ingredientCategory){
        return _.find(list.categories, function(category){
            return category.id === ingredientCategory.id; 
        });
    }
    function addCategoryToList(list, category){
        var listCategory = createCategory(category);
        list.categories.push(listCategory);
        list.categories.sort(function(a, b){
            return a.order - b.order;
        });
        return listCategory;
    }

    function createItem(ingredient, notes, quantity, quantityUnit){
        return {
            added: moment().valueOf(),
            bought: false,
            ingredient: ingredient,
            notes: notes,
            quantity: quantity,
            quantityUnit: quantityUnit
        };
    }
    function createCategory(category){
        return {
            id: category.id,
            name: category.name,
            plural: category.plural,
            img: category.img,
            order: category.order,
            items: []
        };
    }
    function createList(){
        return {
            // TODO : generate id
            created: moment().valueOf(),
            name: "Liste du "+moment().format('LL'),
            categories: [],
            boughtItems: []
        };
    }
    function createLists(){
        return {
            current: null,
            lists: []
        };
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


.factory('ModalService', function($ionicModal){
    var service = {
        shoppinglist: {
            editList: function(scope, callback){ createModal('views/shoppinglist/modal/edit-list.html', scope, callback); },
            switchList: function(scope, callback){ createModal('views/shoppinglist/modal/switch-list.html', scope, callback); },
            itemDetails: function(scope, callback){ createModal('views/shoppinglist/modal/edit-item.html', scope, callback); }
        }
    };

    function createModal(url, scope, callback){
        $ionicModal.fromTemplateUrl(url, callback, {
            scope: scope,
            animation: 'slide-in-up'
        });
    }

    return service;
})


.factory('DataArrayService', function($http, Log){
    'use strict';
    var arrayPromise = [];
    var service = {
        getAsync: getAsync
    };

    function getAsync(dataUrl, id){
        if(id === undefined){
            return loadAsync(dataUrl);
        } else if(typeof id === 'string'){
            return loadAsync(dataUrl).then(function(elts){
                return _.find(elts, function(elt){
                    return elt.id === id; 
                });
            });
        } else {
            throw 'Can\'t load getAsync for '+dataUrl+' with id <'+id+'>';
        }
    }

    function loadAsync(dataUrl){
        if(!arrayPromise[dataUrl]){
            arrayPromise[dataUrl] = $http.get(dataUrl).then(function(result) {
                Log.log('DataArrayService.loadAsync('+dataUrl+')', result);
                return result.data;
            }).then(null, function(error){
                Log.error('DataArrayService.loadAsync('+dataUrl+')', error);
            });
        }
        return arrayPromise[dataUrl];
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