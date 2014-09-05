angular.module('app')

.directive('blurOnKeyboardOut', function($window){
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      // require cordova plugin https://github.com/driftyco/ionic-plugins-keyboard
      $window.addEventListener('native.keyboardhide', function(e){
        element[0].blur();
        scope.safeApply(function() {
          scope.$eval(attrs.blurOnKeyboardOut);
        });
      });
    }
  };
})

// keep focus on input while keyboard is open
.directive('focusOnKeyboardOpen', function($window){
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, element, attrs){
      var keyboardOpen = false;
      // require cordova plugin https://github.com/driftyco/ionic-plugins-keyboard
      $window.addEventListener('native.keyboardshow', function(e){
        keyboardOpen = true;
        element[0].focus();
      });
      $window.addEventListener('native.keyboardhide', function(e){
        keyboardOpen = false;
        element[0].blur();
      });

      element[0].addEventListener('blur', function(e){
        if(keyboardOpen){
          element[0].focus();
        }
      }, true);
    }
  };
})

// render external html keeping directives actives
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

// open external links (starting with http:// or https://) outside the app
.directive('href', function($window){
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
          // require cordova plugin org.apache.cordova.inappbrowser
          $window.open(encodeURI(scope.url), '_system', 'location=yes');
        });
      }
    }
  };
})

// from http://tobiasahlin.com/spinkit/
.directive('loading', function (){
  'use strict';
  return {
    restrict: 'E',
    scope: {
      color: '@'
    },
    template: '<div class="spinner"><div class="dot1" ng-style="style"></div><div class="dot2" ng-style="style"></div></div>',
    link: function(scope, element, attrs){
      if(scope.color){
        scope.style = {
          'background-color': scope.color
        };
      } else {
        scope.style = {};
      }
    }
  };
});
