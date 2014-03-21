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


.factory('IngredientService', function($http, UtilsService){
    // if has field "products" it's a category
    var ingredientsPromise;
    var service = {
        getAsync: getIngredientAsync,
        getParentsAsync: getParentsIngredientAsync
    };

    function getIngredientAsync(ids){
        if(ids === undefined){
            return loadIngredients();
        } else if(Array.isArray(ids)){
            return loadIngredientsAsync().then(function(ingredients){
                return UtilsService.filterTree(ingredients, getIngredientChildren, function(ingredient){
                    return _.contains(ids, ingredient.id);
                });
            });
        } else if(typeof ids === 'string'){
            var id = ids;
            return loadIngredientsAsync().then(function(ingredients){
                return UtilsService.findTree(ingredients, getIngredientChildren, function(ingredient){
                    return ingredient.id === id; 
                });
            });
        }
    }
    function isCategory(ingredient){
        return ingredient.products !== undefined;
    }
    function getParentsIngredientAsync(id){
        return loadIngredientsAsync().then(function(ingredients){
            return UtilsService.findParentsTree(ingredients, getIngredientChildren, function(ingredient){
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
                UtilsService.mapTree(ingredientTree, getIngredientChildren, function(ingredient){
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
});
