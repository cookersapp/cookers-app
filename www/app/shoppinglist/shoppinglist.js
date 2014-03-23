angular.module('ionicApp.shoppinglist', [])


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
})


.controller('ShoppinglistCtrl', function($scope, ShoppinglistService, ModalService){
    $scope.rightButtons = [];
    $scope.current = {
        cart: ShoppinglistService.getCurrentCart()
    };

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
        console.log('TODO : changeCart');
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
        // TODO
        $scope.itemModal.open(item);
        console.log('click on item', item);
    };

    $scope.$on('$destroy', function() {
        $scope.cartModal.modal.remove();
    });
})


.controller('ShoppinglistCartCtrl', function($scope){

})


.controller('ShoppinglistProductsCtrl', function($scope, $state, $stateParams, IngredientService, ShoppinglistService, UtilsService){
    var category = $stateParams.category ? $stateParams.category : 'root';

    $scope.ingredient = {};
    $scope.rowIngredients = [];
    IngredientService.getAsync(category).then(function(ingredient){
        $scope.ingredient = ingredient;
        if($scope.ingredient.products){
            $scope.rowIngredients = UtilsService.toRows(_.filter($scope.ingredient.products, function(product){
                return product.grid;
            }), 4);
        }
    });

    $scope.ingredientClick = function(ingredient){
        if(ingredient.isCategory){
            $state.go('sidemenu.shoppinglist.products', {category: ingredient.id});
        } else {
            var cartItem = ShoppinglistService.getCurrentCartItem(ingredient);
            if(cartItem){
                console.log('TODO: show cart item details !');
                $scope.cartItemClick(cartItem);
            } else {
                ShoppinglistService.addToCurrentCart(ingredient);
            }
        }
    };
})


.controller('ShoppinglistRecipesCtrl', function($scope, RecipeService){
    $scope.suggestedRecipes = [];

    RecipeService.getAllAsync().then(function(recipes){
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