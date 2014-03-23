angular.module('ionicApp.utils', [])


.factory('ModalService', function($ionicModal){
    var service = {
        recipe: {
            addIngredientsToList: function(scope, callback){ createModal('app/add-recipe-ingredients.modal.html', scope, callback); }
        },
        shoppinglist: {
            editCart: function(scope, callback){ createModal('app/shoppinglist/edit-cart.modal.html', scope, callback); },
            itemDetails: function(scope, callback){ createModal('app/shoppinglist/item-details.modal.html', scope, callback); }
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
        mapTree: mapTree,
        filterTree: filterTree,
        findTree: findTree,
        findParentsTree: findParentsTree,
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