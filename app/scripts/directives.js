angular.module('app')

.directive('debounce', function($timeout){
  'use strict';
  return {
    restrict: 'A',
    require: 'ngModel',
    priority: 99,
    link: function(scope, element, attr, ngModelCtrl){
      if(attr.type === 'radio' || attr.type === 'checkbox'){ return; }

      var debounce;
      element.unbind('input');
      element.bind('input', function(){
        $timeout.cancel(debounce);
        debounce = $timeout(function(){
          scope.$apply(function(){
            ngModelCtrl.$setViewValue(element.val());
          });
        }, attr.ngDebounce || 1000);
      });
      element.bind('blur', function(){
        scope.$apply(function(){
          ngModelCtrl.$setViewValue(element.val());
        });
      });
    }
  };
})

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
      color: '@',
      top: '@'
    },
    template: '<div class="spinner" ng-style="spinnerStyle"><div class="dot1" ng-style="dotStyle"></div><div class="dot2" ng-style="dotStyle"></div></div>',
    link: function(scope, element, attrs){
      scope.dotStyle = {};
      if(scope.color){ scope.dotStyle['background-color'] = scope.color; }
      scope.spinnerStyle = {};
      if(scope.top){ scope.spinnerStyle['margin-top'] = scope.top; }
    }
  };
});
