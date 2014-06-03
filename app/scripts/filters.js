angular.module('ionicApp.filters', [])

.filter('date', function(){
  'use strict';
  return function(date) {
    if (date && typeof(date.format) !== 'function') {
      date = moment(date);
    }
    return date ? date.format('DD/MM/YYYY') : ' - ';
  };
})

.filter('time', function(){
  'use strict';
  return function(date) {
    if (date && typeof(date.format) !== 'function') {
      date = moment(date);
    }
    return date ? date.format('HH:mm:ss') : ' - ';
  };
})

.filter('datetime', function(){
  'use strict';
  return function(date) {
    if (date && typeof(date.format) !== 'function') {
      date = moment(date);
    }
    return date ? date.format('YYYY-MM-DD HH:mm:ss') : ' - ';
  };
})

.filter('duration', function(){
  'use strict';
  return function(duration) {
    if (duration && typeof(duration.format) !== 'function') {
      duration = moment.duration(duration);
    }
    return duration ? duration.humanize() : ' - ';
  };
})

.filter('seconds', function(){
  'use strict';
  return function(duration) {
    if (duration && typeof(duration.format) !== 'function') {
      duration = moment.duration(duration);
    }
    return duration ? duration.asSeconds() : ' - ';
  };
})


.filter('notIn', function () {
  'use strict';
  return function (baseArray, lookupArray) {
    if (!angular.isUndefined(baseArray) && !angular.isUndefined(lookupArray)) {
      var tempArray = [];
      angular.forEach(baseArray, function (elt) {
        if(_.findIndex(lookupArray, function(e){return e.id === elt.id;}) === -1){
          tempArray.push(elt);
        }
      });
      return tempArray;
    } else {
      return baseArray;
    }
  };
})


.filter('max', function () {
  'use strict';
  return function (baseArray, maxLength) {
    if (!angular.isUndefined(baseArray) && !angular.isUndefined(maxLength)) {
      var tempArray = [];
      for(var i=0; i<baseArray.length; i++){
        if(i<maxLength){
          tempArray.push(baseArray[i]);
        } else {
          break;
        }
      }
      return tempArray;
    } else {
      return baseArray;
    }
  };
})


.filter('not', function () {
  'use strict';
  return function (baseArray, test) {
    if (!angular.isUndefined(baseArray) && !angular.isUndefined(test)) {
      var tempArray = [];
      angular.forEach(baseArray, function (elt) {
        if(test){
          tempArray.push(elt);
        }
      });
      return tempArray;
    } else {
      return baseArray;
    }
  };
});