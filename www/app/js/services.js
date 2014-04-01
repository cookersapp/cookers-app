angular.module('ionicApp.services', [])


.factory('ModalService', function($ionicModal){
    var service = {
        recipe: {
            addIngredientsToList: function(scope, callback){ createModal('app/views/recipes/modal/add-ingredients.html', scope, callback); }
        },
        shoppinglist: {
            editCart: function(scope, callback){ createModal('app/views/shoppinglist/modal/edit-cart.html', scope, callback); },
            itemDetails: function(scope, callback){ createModal('app/views/shoppinglist/modal/edit-item.html', scope, callback); }
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


.factory('UtilsService', function(){
    var service = {
        cleverFilter: cleverFilter,
        cleverTreeFilter: cleverTreeFilter,
        mapTree: mapTree,
        filterTree: filterTree,
        findTree: findTree,
        findParentsTree: findParentsTree,
        toRows: toRows
    };

    function cleverFilter(allPromise, ids, getId){
        if(ids === undefined){
            return allPromise;
        } else if(typeof ids === 'string'){
            var id = ids;
            return allPromise.then(function(elts){
                return _.find(elts, function(elt){
                    return getId(elt) === id; 
                });
            });
        } else if(Array.isArray(ids)){
            return allPromise.then(function(elts){
                return _.filter(elts, function(elt){
                    return _.contains(ids, getId(elt));
                });
            });
        }
    }
    function cleverTreeFilter(allPromise, getChildren, ids, getId){
        if(ids === undefined){
            return allPromise;
        } else if(typeof ids === 'string'){
            var id = ids;
            return allPromise.then(function(elts){
                return findTree(elts, getChildren, function(elt){
                    return getId(elt) === id; 
                });
            });
        } else if(Array.isArray(ids)){
            return allPromise.then(function(elts){
                return filterTree(elts, getChildren, function(elt){
                    return _.contains(ids, getId(elt));
                });
            });
        }
    }
    function mapTree(tree, getChildren, apply){
        apply(tree);
        var children = getChildren(tree);
        if(children){
            for(var i in children){
                mapTree(children[i], getChildren, apply);
            }
        }
    }
    function filterTree(tree, getChildren, test){
        var ret = [];
        if(test(tree)){
            ret.push(tree);
        }
        var children = getChildren(tree);
        if(children){
            for(var i in children){
                ret = ret.concat(filterTree(children[i], getChildren, test));
            }
        }
        return ret;
    }
    function findTree(tree, getChildren, test){
        var children = getChildren(tree);
        if(test(tree)){
            return tree;
        } else if(children){
            for(var i in children){
                var res = findTree(children[i], getChildren, test);
                if(res){ return res; }
            }
        }
    }
    function findParentsTree(tree, getChildren, test){
        var children = getChildren(tree);
        if(test(tree)){
            return [tree];
        } else if(children){
            for(var i in children){
                var res = findParentsTree(children[i], getChildren, test);
                if(res){return [tree].concat(res);}
            }
        }
    }
    function toRows(data, cols){
        return _.map(_.groupBy(data, function(v, i) {
            return Math.floor(i / cols);
        }), function(v) {
            return v;
        });
    }

    return service;
})


.factory('ProductService', function($http, UtilsService){
    var productsPromise;
    var service = {
        getAsync: function(barcodes){
            return UtilsService.cleverFilter(loadProductsAsync(), barcodes, function(product){
                return product.barcode;
            });
        }
    };

    function loadProductsAsync(){
        if(!productsPromise){
            productsPromise = $http.get('data/products.json').then(function(result) {
                console.log('ProductService.loadProducts', result);
                return result.data;
            }).then(null, function(error){
                console.error('ProductService.loadProducts', error);
            });
        }
        return productsPromise;
    }

    return service;
})


.factory('IngredientService', function($http, UtilsService){
    // if has field "products" it's a category
    var ingredientsPromise;
    var service = {
        getAsync: getIngredientAsync,
        getParentsAsync: getParentsIngredientAsync
    };

    function getIngredientAsync(ids){
        return UtilsService.cleverTreeFilter(loadIngredientsAsync(), getChildren, ids, function(ingredient){
            return ingredient.id;
        });
    }
    function isCategory(ingredient){
        return ingredient.products !== undefined;
    }
    function getParentsIngredientAsync(id){
        return loadIngredientsAsync().then(function(ingredients){
            return UtilsService.findParentsTree(ingredients, getChildren, function(ingredient){
                return ingredient.id === id; 
            });
        });
    }
    function getChildren(ingredient){
        return [].concat(
            ingredient.products ? ingredient.products : [],
            ingredient.subproducts ? ingredient.subproducts : []);
    }
    function loadIngredientsAsync(){
        if(!ingredientsPromise){
            ingredientsPromise = $http.get('data/ingredients.json').then(function(result) {
                console.log('IngredientService.loadIngredients', result);
                var ingredientTree = result.data;
                UtilsService.mapTree(ingredientTree, getChildren, function(ingredient){
                    ingredient.isCategory = isCategory(ingredient);
                });
                return ingredientTree;
            }).then(null, function(error){
                console.error('IngredientService.loadIngredients', error);
            });
        }
        return ingredientsPromise;
    }

    return service;
})


.factory('RecipeService', function($http, UtilsService){
    var recipesPromise;
    var service = {
        getAsync: function(ids){
            return UtilsService.cleverFilter(loadRecipesAsync(), ids, function(recipe){
                return recipe.id;
            });
        }
    };

    function loadRecipesAsync(){
        if(!recipesPromise){
            recipesPromise = $http.get('data/recipes.json').then(function(result) {
                console.log('RecipeService.loadRecipes', result);
                return result.data;
            }).then(null, function(error){
                console.error('RecipeService.loadRecipes', error);
            });
        }
        return recipesPromise;
    }

    return service;
})


.factory('UserService', function($localStorage){
    if(!$localStorage.user){$localStorage.user = [];}
    var user = $localStorage.user;
    var service = {
        seeRecipe: function(recipe){addEvent('recipe', recipe.id, 'see');},
        boughtRecipe: function(recipe){addEvent('recipe', recipe.id, 'bought');},
        seeProduct: function(product){addEvent('product', product.barcode, 'see');},
        boughtProduct: function(product){addEvent('product', product.barcode, 'bought');},
        getSeenRecipes: function(max){return find('recipe', 'see', max);},
        getBoughtRecipes: function(max){return find('recipe', 'bought', max);},
        getScannedProducts: function(max){return find('product', 'see', max);},
        getBoughtProducts: function(max){return find('product', 'bought', max);}
    };

    function addEvent(elt, id, action){
        user.unshift({
            elt: elt,
            id: id,
            action: action,
            time: moment().valueOf()
        });
    }

    function find(elt, action, max){
        var res = [];
        for(var i=0; i<user.length; i++){
            if(user[i].elt === elt && (!action || user[i].action === action)){
                var exist = _.find(res, function(r){
                    return r.id === user[i].id;
                });
                if(!exist){
                    res.push(user[i]);
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


.factory('ShoppinglistService', function($localStorage, IngredientService){
    if(!$localStorage.currentCart){$localStorage.currentCart = createCart();}
    var currentCart = $localStorage.currentCart;
    var service = {
        getCurrentCart: function(){return currentCart;},
        getCurrentCartItem: function(ingredient){return getItem(currentCart, ingredient);},
        addToCurrentCart: function(ingredient, notes, quantity, quantityUnit){addItem(currentCart, ingredient, notes, quantity, quantityUnit);},
        deleteFromCurrentCart: function(item){deleteItem(currentCart, item);},
        clearCurrentCart: function(){clearCart(currentCart);}
    };

    function clearCart(cart){
        cart.categories = [];
    }
    function deleteItem(cart, item){
        if(cart && cart.categories){
            for(var i in cart.categories){
                var category = cart.categories[i];
                for(var j in category.items){
                    if(category.items[j].ingredient.id === item.ingredient.id){
                        category.items.splice(j, 1);
                        if(category.items.length === 0){
                            cart.categories.splice(i, 1);
                        }
                    }
                }
            }
        }
    }
    function addItem(cart, ingredient, notes, quantity, quantityUnit){
        if(typeof ingredient === 'string'){
            IngredientService.getAsync(ingredient).then(function(ingredient){
                addItem(cart, ingredient, notes, quantity, quantityUnit);
            });
        } else if(ingredient){
            var item = createItem(ingredient, notes, quantity, quantityUnit);
            IngredientService.getParentsAsync(ingredient.id).then(function(parents){
                if(parents && parents.length > 1) {
                    // parents[0]: root, parents[1]: top category, parents[length-1]: elt
                    var cartCategory = getCategory(cart, parents[1]);
                    if(!cartCategory){cartCategory = addCategory(cart, parents[1]);}
                    cartCategory.items.push(item);
                }
            });
        }
    }
    function getItem(cart, ingredient){
        if(cart && cart.categories){
            for(var i in cart.categories){
                var category = cart.categories[i];
                for(var j in category.items){
                    if(category.items[j].ingredient.id === ingredient.id){
                        return category.items[j];
                    }
                }
            }
        }
    }
    function getCategory(cart, categoryIngredient){
        return _.find(cart.categories, function(category){
            return category.id === categoryIngredient.id; 
        });
    }
    function addCategory(cart, categoryIngredient){
        var category = createCategory(categoryIngredient);
        cart.categories.push(category);
        cart.categories.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });
        return category;
    }
    function createCart(){
        return {
            name: "Liste du "+moment().format('LL'),
            categories: []
        };
    }
    function createCategory(categoryIngredient){
        return {
            id: categoryIngredient.id,
            name: categoryIngredient.name,
            shortname: categoryIngredient.shortname,
            image: categoryIngredient.image,
            grid: categoryIngredient.grid,
            items: []
        };
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

    return service;
});
