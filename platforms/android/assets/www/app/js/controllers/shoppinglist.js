angular.module('ionicApp.shoppinglist', [])


.controller('ShoppinglistCtrl', function($scope, ShoppinglistService, ModalService, DataService){
    $scope.rightButtons = [];
    $scope.current = {
        cart: ShoppinglistService.getCurrentCart()
    };
    $scope.data = {
        units: []
    }
    
    DataService.getUnitsAsync().then(function(units){
        $scope.data.units = units;
    });

    $scope.isInCart = function(ingredient){
        return ShoppinglistService.getCurrentCartItem(ingredient)!== undefined;
    };

    $scope.rightButtons = [
        {
            type: 'button-icon button-clear ion-compose',
            tap: function(e) {
                $scope.cartModal.open();
            }
        },
        {
            type: 'button-icon button-clear ion-shuffle',
            tap: function(e) {
                $scope.changeCart();
            }
        }
    ];

    $scope.changeCart = function(){
        alert('Change cart : not implemented yet !');
    };

    // edit cart modal
    $scope.cartModal = {};
    ModalService.shoppinglist.editCart($scope, function(modal) {
        $scope.cartModal.modal = modal;
    });
    $scope.cartModal.open = function(){
        $scope.cartModal.title = "Informations liste";
        $scope.cartModal.data = {
            name: $scope.current.cart.name
        };
        $scope.cartModal.modal.show();
    };
    $scope.cartModal.close = function(){
        $scope.cartModal.modal.hide();
    };
    $scope.cartModal.deleteCart = function(){
        // TODO delete cart !!!
        ShoppinglistService.clearCurrentCart();
        $scope.cartModal.modal.hide();
    };
    $scope.cartModal.save = function(){
        $scope.current.cart.name = $scope.cartModal.data.name;
        $scope.cartModal.modal.hide();
    };

    // item details modal
    $scope.itemModal = {};
    ModalService.shoppinglist.itemDetails($scope, function(modal) {
        $scope.itemModal.modal = modal;
    });
    $scope.itemModal.open = function(item){
        $scope.itemModal.item = item;
        $scope.itemModal.data = {
            notes: item.notes,
            quantity: item.quantity,
            quantityUnit: item.quantityUnit
        };
        $scope.itemModal.modal.show();
    };
    $scope.itemModal.close = function(){
        $scope.itemModal.modal.hide();
    };
    $scope.itemModal.delete = function(){
        ShoppinglistService.deleteFromCurrentCart($scope.itemModal.item);
        $scope.itemModal.modal.hide();
    };
    $scope.itemModal.save = function(){
        $scope.itemModal.item.notes = $scope.itemModal.data.notes;
        $scope.itemModal.item.quantity = $scope.itemModal.data.quantity;
        $scope.itemModal.item.quantityUnit = $scope.itemModal.data.quantityUnit;
        $scope.itemModal.modal.hide();
    };
    
    $scope.cartItemClick = function(item){
        $scope.itemModal.open(item);
    };

    $scope.$on('$destroy', function() {
        $scope.cartModal.modal.remove();
    });
})


.controller('ShoppinglistCartCtrl', function($scope, ShoppinglistService){
    $scope.buyItem = function(item){
        ShoppinglistService.buyFromCurrentCart(item);
    };
    $scope.unbuyItem = function(item){
        ShoppinglistService.unbuyFromCurrentCart(item);
    };
})


.controller('ShoppinglistProductsCtrl', function($scope, $state, $stateParams, IngredientService, ShoppinglistService, UtilsService){
    var category = $stateParams.category ? $stateParams.category : 'root';

    $scope.ingredient = {};
    $scope.rowIngredients = [];
    $scope.parents = [];
    
    IngredientService.getAsync(category).then(function(ingredient){
        $scope.ingredient = ingredient;
        if($scope.ingredient.products){
            $scope.rowIngredients = UtilsService.toRows(_.filter($scope.ingredient.products, function(product){
                return product.grid;
            }), 4);
        }
    });
    IngredientService.getParentsAsync(category).then(function(parents){
        $scope.parents = parents;
    });

    $scope.ingredientClick = function(ingredient){
        if(ingredient.isCategory){
            $state.go('sidemenu.shoppinglist.products', {category: ingredient.id});
        } else {
            var cartItem = ShoppinglistService.getCurrentCartItem(ingredient);
            if(cartItem){
                $scope.cartItemClick(cartItem);
            } else {
                ShoppinglistService.addToCurrentCart(ingredient);
            }
        }
    };
})


.controller('ShoppinglistRecipesCtrl', function($scope, RecipeService){
    $scope.suggestedRecipes = [];

    RecipeService.getAsync().then(function(recipes){
        $scope.suggestedRecipes = getSuggestedRecipes($scope.current.cart, recipes);
    });

    function getSuggestedRecipes(cart, recipes){
        function getCartIngredients(cart){
            var ret = [];
            if(cart && cart.categories){
                for(var i in cart.categories){
                    var category = cart.categories[i];
                    for(var j in category.items){
                        ret.push(category.items[j].ingredient);
                    }
                }
            }
            if(cart && cart.bought){
                for(var i in cart.bought){
                    ret.push(cart.bought[i]);
                }
            }
            return ret;
        }
        function recipeRating(recipe, ingredients){
            var a = _.filter(ingredients, function(ingredient){
                for(var i in recipe.ingredients){
                    if(recipe.ingredients[i].id === ingredient.id){
                        return true;
                    }
                }
                return false;
            });
            return a.length;
        }
        var ret = [];
        var cartIngredients = getCartIngredients(cart);
        for(var i in recipes){
            ret.push({
                rating: recipeRating(recipes[i], cartIngredients),
                recipe: recipes[i]
            });
        }
        ret.sort(function(a, b){
           return - (a.rating - b.rating); 
        });
        return _.filter(ret, function(suggested){
            return suggested.rating > 0;
        });
    }
});