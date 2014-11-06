angular.module('app')

.factory('CollectionUtils', function(){
  'use strict';
  var service = {
    clear: clear,
    copy: copy,
    replaceElt: replaceElt,
    replaceEltById: replaceEltById,
    toMap: toMap,
    toArray: toArray,
    size: size,
    isEmpty: isEmpty,
    isNotEmpty: function(col){return !isEmpty(col);}
  };

  function clear(col){
    if(Array.isArray(col)){
      while(col.length > 0) { col.pop(); }
    } else {
      for(var i in col){
        delete col[i];
      }
    }
  }

  function copy(src, dest){
    if(Array.isArray(dest)){
      clear(dest);
      for(var i in src){
        dest.push(src[i]);
      }
    }
  }

  function replaceElt(collection, matcher, elt){
    var foundElt = _.find(collection, matcher);
    if(foundElt){
      var replacedElt = angular.copy(foundElt);
      angular.copy(elt, foundElt);
      return replacedElt;
    }
  }

  function replaceEltById(collection, elt){
    return replaceElt(collection, {id: elt.id}, elt);
  }

  function toMap(arr){
    var map = {};
    if(Array.isArray(arr)){
      for(var i in arr){
        map[arr[i].id] = arr[i];
      }
    }
    return map;
  }

  function toArray(map, addTo){
    var arr = addTo ? addTo : [];
    for(var i in map){
      map[i].id = i;
      arr.push(map[i]);
    }
    return arr;
  }

  function size(col){
    if(Array.isArray(col)){
      return col.length;
    } else if(typeof col === 'object'){
      return Object.keys(col).length;
    } else {
      return 0;
    }
  }

  function isEmpty(col){
    return size(col) === 0;
  }

  return service;
});
