angular.module('ionicApp.services', [])


.factory('UserService', function(){
    var service = {
        getSeenRecipes: function(){console.log('TODO: getSeenRecipes');},
        getBoughtRecipes: function(){console.log('TODO: getBoughtRecipes');},
        getScannedProducts: function(){console.log('TODO: getScannedProducts');},
        getBoughtProducts: function(){console.log('TODO: getBoughtProducts');}
    };

    return service;
})


.factory('ProductService', function($http){
    var productsPromise;
    var service = {
        getAsync: getProductAsync
    };

    function getProductAsync(barcode){
        return loadProductsAsync().then(function(products){
            return _.find(products, function(product){
                return product.barcode === barcode; 
            });
        });
    }
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


.factory('IngredientService', function($http, UtilService){
    // if has field "products" it's a category
    var ingredientsPromise;
    var service = {
        getAsync: getIngredientAsync,
        getParentAsync: getParentIngredientAsync
    };

    function getIngredientAsync(ids){
        if(ids === undefined){
            return loadIngredients();
        } else if(Array.isArray(ids)){
            return loadIngredientsAsync().then(function(ingredients){
                return UtilService.filterTree(ingredients, getIngredientChildren, function(ingredient){
                    return _.contains(ids, ingredient.id);
                });
            });
        } else if(typeof ids === 'string'){
            var id = ids;
            return loadIngredientsAsync().then(function(ingredients){
                return UtilService.findTree(ingredients, getIngredientChildren, function(ingredient){
                    return ingredient.id === id; 
                });
            });
        }
    }
    function isCategory(ingredient){
        return ingredient.products !== undefined;
    }
    function getParentIngredientAsync(id){
        return loadIngredientsAsync().then(function(ingredients){
            return UtilService.findParentTree(ingredients, getIngredientChildren, function(ingredient){
                return ingredient.id === id; 
            });
        });
    }
    function getIngredientChildren(ingredient){
        return [].concat(
            ingredient.products ? ingredient.products : [],
            ingredient.subproducts ? ingredient.subproducts : []);
    }
    function loadIngredientsAsync(){
        if(!ingredientsPromise){
            ingredientsPromise = $http.get('data/ingredients.json').then(function(result) {
                console.log('IngredientService.loadIngredients', result);
                var ingredientTree = result.data;
                UtilService.mapTree(ingredientTree, getIngredientChildren, function(ingredient){
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


.factory('RecipeService', function($http){
    var recipesPromise;
    var service = {
        getAllAsync: getAllRecipesAsync,
        getAsync: getRecipeAsync
    };

    function getAllRecipesAsync(ids){
        return loadRecipesAsync().then(function(recipes){
            return _.filter(recipes, function(recipe){
                return !ids || _.contains(ids, recipe.id);
            });
        });
    }
    function getRecipeAsync(id){
        return loadRecipesAsync().then(function(recipes){
            return _.find(recipes, function(recipe){
                return recipe.id === id; 
            });
        });
    }
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


.factory('ShoppinglistService', function($localStorage, IngredientService){
    if(!$localStorage.currentCart){$localStorage.currentCart = createCart();}
    var currentCart = $localStorage.currentCart;
    var service = {
        getCurrentCart: function(){return currentCart;},
        getCurrentCartItem: function(ingredient){return getItem(currentCart, ingredient);},
        addToCurrentCart: function(ingredient){addItem(currentCart, ingredient);}
    };

    function addItem(cart, ingredient){
        var item = createItem(ingredient);
        IngredientService.getParentAsync(ingredient.id).then(function(parent){
            var cartCategory = getCategory(cart, parent);
            if(!cartCategory){cartCategory = addCategory(cart, parent);}
            cartCategory.items.push(item);
        });
    }
    function exist(cart, ingredient){
        return getItem(cart, ingredient) !== undefined;
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
    function createItem(ingredient){
        return {
            added: moment().valueOf(),
            bought: false,
            ingredient: ingredient,
            note: "",
            quantity: "",
            quantityUnit: ""
        };
    }

    return service;
})


.factory('UtilService', function(){
    var service = {
        mapTree: mapTree,
        filterTree: filterTree,
        findTree: findTree,
        findParentTree: findParentTree,
        toRows: toRows
    };

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
    function findParentTree(tree, getChildren, test){
        var children = getChildren(tree);
        if(test(tree)){
            return 'root';
        } else if(children){
            for(var i in children){
                var res = findParentTree(children[i], getChildren, test);
                if(res === 'root'){ return tree; }
                else if(res){ return res; }
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
});
