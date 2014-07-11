angular.module('ionicApp')

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
})

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

.directive('externalContent', function($compile){
  'use strict';
  return {
    restrict: 'A',
    scope: {
      html: '=externalContent'
    },
    link: function(scope, element, attrs){
      scope.$watch('html', function(newVal){
        element.html('');
        element.append($compile('<span>'+scope.html+'</span>')(scope)); 
      });
    }
  };
})

.directive('href', function(){
  'use strict';
  return {
    restrict: 'A',
    scope: {
      url: '@href'
    },
    link: function(scope, element, attrs){
      if(scope.url.indexOf('http://') === 0 || scope.url.indexOf('https://') === 0){
        element.bind('click', function(e){
          e.preventDefault();
          window.open(encodeURI(scope.url), '_system', 'location=yes');
        });
      }
    }
  };
});
