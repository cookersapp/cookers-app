angular.module('ionicApp')

.directive('focusOnKeyboardOpen', function(){
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      scope.isOpen = false;
      window.addEventListener('native.keyboardshow', function(e){
        scope.isOpen = true;
        element[0].focus();
      });
      window.addEventListener('native.keyboardhide', function(e){
        scope.isOpen = false;
        element[0].blur();
      });

      element[0].addEventListener('blur', function(e){
        if(scope.isOpen){
          element[0].focus();
        }
      }, true);
    }
  };
})

.directive('blurOnKeyboardOut', function(){
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      window.addEventListener('native.keyboardhide', function(e){
        element[0].blur();
      });
    }
  };
});
