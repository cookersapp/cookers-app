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
            for(var i in products){
                if(products[i].barcode == barcode){
                    return products[i];
                }
            }
            return null;
        });
    }
    function loadProducts(){
        if(!productsPromise){
            productsPromise = $http.get('data/products.json').then(function(result) {
                console.log('ProductService.loadProducts', result);
                var products = [];
                angular.forEach(result.data, function(product) {
                    products.push(product);
                });
                return products;
            }).then(null, function(error){
                console.error('ProductService.loadProducts', error);
            });
        }
        return productsPromise;
    }

    return service;
})

.factory('IngredientService', function(){
    var service = {
        get: function(id){console.log('TODO: getSeenRecipes');}
    };

    return service;
})

.factory('RecipeService', function(){
    var service = {

    };

    return service;
});
