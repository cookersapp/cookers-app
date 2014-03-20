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
        get: getProduct
    };

    function getProduct(barcode){
        return loadProducts().then(function(products){
            return _.find(products, function(product){
                return product.barcode === barcode; 
            });
        });
    }
    function loadProducts(){
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

.factory('IngredientService', function(){
    // if has field "products" it's a category
    var service = {
        get: function(id){console.log('TODO: getSeenRecipes');}
    };

    return service;
})

.factory('RecipeService', function($http){
    var recipesPromise;
    var service = {
        getAll: getAllRecipes,
        get: getRecipe
    };

    function getAllRecipes(ids){
        return loadRecipes().then(function(recipes){
            return _.filter(recipes, function(recipe){
                return !ids || _.contains(ids, recipe.id);
            });
        });
    }
    function getRecipe(id){
        return loadRecipes().then(function(recipes){
            return _.find(recipes, function(recipe){
                return recipe.id === id; 
            });
        });
    }
    function loadRecipes(){
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
