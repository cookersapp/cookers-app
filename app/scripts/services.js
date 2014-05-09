angular.module('ionicApp.services', [])


.factory('RecipeService', function(DataArrayService){
    'use strict';
    var dataUrl = 'data/recipes.json';
    var service = {
        getAsync: function(id){return DataArrayService.getAsync(dataUrl, id);}
    };

    return service;
})


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


.factory('IngredientGridService', function($q, CategoryService, IngredientService, ShoppinglistService, DataTreeService){
    'use strict';
    var dataUrl = 'data/ingredient_grid.json';
    var getChildren = function(tree){return tree.ingredients;};
    var dataPromise;
    var service = {
        getAsync: getAsync,
        getPathAsync: getPathAsync
    };

    function getAsync(id){
        if(id === 'custom'){
            return getMostPopular();
        } else {
            return DataTreeService.getAsync(dataUrl, getChildren, id).then(function(tree){
                if(typeof id === 'string' && tree && tree.ingredients){
                    // if not enough data, don't show Custom category
                    if(ShoppinglistService.getAllLists().length < 2){
                        var index = _.findIndex(tree.ingredients, {'id': 'custom'});
                        if(index !== -1){
                            tree.ingredients.splice(index, 1);
                        }
                    }

                    // don't show categories with no ingredient inside
                    var max = tree.ingredients.length;
                    for(var i=0; i<max; i++){
                        if(tree.ingredients[i].id !== 'custom' && tree.ingredients[i].type === 'category' && tree.ingredients[i].ingredients.length === 0){
                            tree.ingredients.splice(i, 1);
                            i--;
                            max--;
                        }
                    }

                    // get ingredients data and return them
                    return fetchDataFor(tree.ingredients);
                } else {
                    return tree;
                }
            });
        }
    }

    function getPathAsync(id){
        return DataTreeService.getPathAsync(dataUrl, getChildren, id).then(function(path){
            return fetchDataFor(path);
        });
    }

    function fetchDataFor(ingredients){
        var ingredientPromises = [];
        for(var i in ingredients){
            var ingredient = ingredients[i];
            if(ingredient.type === 'category'){
                ingredientPromises.push(CategoryService.getAsync(ingredient.id));
            } else if(ingredient.type === 'ingredient'){
                ingredientPromises.push(IngredientService.getAsync(ingredient.id));
            } else {
                Log.error('Unknown type of ingredient grid: <'+ingredient.type+'>');
            }
        }
        return $q.all(ingredientPromises).then(function(results){
            // remove not found elts
            var max = results.length;
            for(var i=0; i<max; i++){
                if(results[i] === undefined){
                    results.splice(i, 1);
                    i--;
                    max--;
                }
            }
            return results;
        });
    }

    function getMostPopular(){
        return $q.when([]);
    }

    return service;
})


.factory('ShoppinglistService', function($localStorage, IngredientService, CategoryService, Log){
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
        createIngredient: createIngredient,
        createItem: createItem,
        addToCurrentList: addToCurrentList,
        removeFromCurrentList: removeFromCurrentList,
        buyFromCurrentList: buyFromCurrentList,
        unbuyFromCurrentList: unbuyFromCurrentList
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
    function getCurrentListItem(item){
        var list = getCurrentList();
        for(var i in list.categories){
            for(var j in list.categories[i].items){
                if(list.categories[i].items[j].id === item.id){
                    return list.categories[i].items[j];
                }
            }
        }
        for(var i in list.boughtItems){
            if(list.boughtItems[i].id === item.id){
                return list.boughtItems[i];
            }
        }
    }
    function existInCurrentList(item){
        return getCurrentListItem(item) !== undefined;
    }
    function addToCurrentList(item){
        var list = getCurrentList();
        if(list !== null && item){
            if(typeof item.ingredient === 'string'){
                IngredientService.getAsync(item.id).then(function(ingredient){
                    item.ingredient = ingredient;
                    addToCurrentList(item);
                });
            } else {
                if(!existInCurrentList(item)){
                    addToList(list, item);
                } else {
                    // TODO : sum quantities (item should get a list of source)
                }
            }
        }
    }
    function removeFromCurrentList(item){
        var list = getCurrentList();
        for(var i in list.categories){
            for(var j in list.categories[i].items){
                if(list.categories[i].items[j].id === item.id){
                    list.categories[i].items.splice(j, 1);
                    if(list.categories[i].items.length === 0){
                        list.categories.splice(i, 1);
                    }
                    return true;
                }
            }
        }
        for(var i in list.boughtItems){
            if(list.boughtItems[i].id === item.id){
                list.boughtItems.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    function buyFromCurrentList(item){
        var list = getCurrentList();
        for(var i in list.categories){
            for(var j in list.categories[i].items){
                if(list.categories[i].items[j].id === item.id){
                    var tmp = list.categories[i].items.splice(j, 1)[0];
                    tmp.bought = true;
                    if(list.categories[i].items.length === 0){
                        list.categories.splice(i, 1);
                    }
                    list.boughtItems.unshift(tmp);
                    return true;
                }
            }
        }
        return false;
    }
    function unbuyFromCurrentList(item){
        var list = getCurrentList();
        for(var i in list.boughtItems){
            if(list.boughtItems[i].id === item.id){
                var tmp = list.boughtItems.splice(i, 1)[0];
                tmp.bought = false;
                addToList(list, tmp);
                return true;
            }
        }
        return false;
    }


    function addToList(list, item){
        CategoryService.getAsync(item.ingredient.category).then(function(category){
            if(category){
                var listCategory = getListCategory(list, category);
                if(!listCategory){listCategory = addCategoryToList(list, category);}
                listCategory.items.push(item);
            } else {
                Log.error('Unknown category <'+item.ingredient.category+'>');
            }
        });
    }
    function getListCategory(list, category){
        return _.find(list.categories, function(elt){
            return elt.id === category.id; 
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

    function createIngredient(name){
        return {
            id: name,
            name: name,
            plural: name,
            img: "unknown.png",
            category: "autre",
            type: "usual"
        };
    }
    function createItem(ingredient, notes, quantity, quantityUnit){
        return {
            id: ingredient.id ? ingredient.id : ingredient,
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
            itemDetails: function(scope, callback){ createModal('views/shoppinglist/modal/item-details.html', scope, callback); }
        },
        recipe: {
            ingredientsToShoppinglist: function(scope, callback){ createModal('views/recipes/modal/add-ingredients.html', scope, callback); }
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


.factory('ShoppingParserService', function(Log){
    var service = {
        parse: parse
    };

    function parse(str){

        var ret = {
            quantity: "",
            quantityUnit: "",
            value: str
        };
        return ret;
    }

    var matcher = {
        quantity: /\d+ /
    };

    var tests = [
        "1 kg de pomme de terre"
    ];

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
                Log.log('asyncArray('+dataUrl+')', result);
                return result.data;
            }).then(null, function(error){
                Log.error('asyncArray('+dataUrl+')', error);
            });
        }
        return arrayPromise[dataUrl];
    }

    return service;
})


.factory('DataTreeService', function($http, Log){
    'use strict';
    var arrayPromise = [];
    var service = {
        getAsync: getAsync,
        getPathAsync: getPathAsync
    };

    function getAsync(dataUrl, getChildren, id){
        if(id === undefined){
            return loadAsync(dataUrl);
        } else if(typeof id === 'string'){
            return loadAsync(dataUrl).then(function(tree){
                return findTree(tree, getChildren, function(elt){
                    return elt.id === id; 
                });
            });
        } else {
            throw 'Can\'t load getAsync for '+dataUrl+' with id <'+id+'>';
        }
    }

    function getPathAsync(dataUrl, getChildren, id){
        if(id === undefined){
            return loadAsync(dataUrl).then(function(root){
                return [root];
            });
        } else if(typeof id === 'string'){
            return loadAsync(dataUrl).then(function(tree){
                return findTreePath(tree, getChildren, function(elt){
                    return elt.id === id; 
                });
            });
        } else {
            throw 'Can\'t load getAsync for '+dataUrl+' with id <'+id+'>';
        }
    }

    function findTree(tree, getChildren, test){
        var children = getChildren(tree);
        if(test(tree)){
            return tree;
        } else if(children){
            for(var i in children){
                var res = findTree(children[i], getChildren, test);
                if(res && res !== -1){ return res; }
            }
        }
        return -1;
    }
    function findTreePath(tree, getChildren, test){
        var children = getChildren(tree);
        if(test(tree)){
            return [tree];
        } else if(children){
            for(var i in children){
                var res = findTreePath(children[i], getChildren, test);
                if(res){return [tree].concat(res);}
            }
        }
    }

    function loadAsync(dataUrl){
        if(!arrayPromise[dataUrl]){
            arrayPromise[dataUrl] = $http.get(dataUrl).then(function(result) {
                Log.log('asyncTree('+dataUrl+')', result);
                return result.data;
            }).then(null, function(error){
                Log.error('asyncTree('+dataUrl+')', error);
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
            return window.ionic.Platform.isWebView();
        },
        toRows: toRows
    };

    function toRows(data, cols){
        return _.map(_.groupBy(data, function(v, i) {
            return Math.floor(i / cols);
        }), function(v) {
            return v;
        });
    }

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