(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 *
 * app.js
 * Including vendor libraries & template scripting functions
 *
 **/
/*==================================
=            APP CONFIG            =
==================================*/
'use strict';

// Create app settings and routing
var app = angular.module("pantoum", ['ui.router', 'satellizer', 'permission']);
app.config(function($stateProvider, $urlRouterProvider, $authProvider, $interpolateProvider) {
    
    // Set up route fallback and authorized API
    $authProvider.loginUrl = 'http://pantoum.dev/api/v1/authenticate';
    $urlRouterProvider.otherwise('/auth');

    // Set up custom expressions for binding to avoid conflicts with Handlebars 
    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');

    // Configure routing state
    $stateProvider.state('auth', {
        url: '/auth',
        data: {
            permissions: {
                except: ['isLoggedIn'],
                redirectTo: 'blogs'
            }
        },
        views: {
            'blogsContent': {
                templateUrl: 'views/auth.html',
                controller: 'authController as auth'
            }
        }
    }).state('blogs', {
        url: '/blogs',
        data: {
            permissions: {
                except: ['anonymous'],
                redirectTo: 'auth'
            }
        },
        views: {
            'blogsContent': {
                templateUrl: 'views/blogs.html',
                controller: 'blogsController as blogs'
            }
        }
    });
});

// Execute logout logics and permission settings
app.run(function($rootScope, $state, $auth, PermissionStore) {
    $rootScope.logout = function() {
        $auth.logout().then(function() {
            localStorage.removeItem('user');
            $rootScope.currentUser = null;
            $state.go('auth');
        });
    }
    $rootScope.currentUser = JSON.parse(localStorage.getItem('user'));
    PermissionStore.definePermission('isLoggedIn', function(stateParams) {
        // If the returned value is *truthy* then the user has the role, otherwise they don't
        if ($auth.isAuthenticated()) {
            return true;
        }
        return false;
    });
    PermissionStore.definePermission('anonymous', function(stateParams) {
        if (!$auth.isAuthenticated()) {
            return true;
        }
        return false;
    });
});

// Require other components to be bundled together
require('./controllers');
require('./directives');
require('./services');

},{"./controllers":4,"./directives":5,"./services":10}],2:[function(require,module,exports){
'use strict';
module.exports = function($scope, $auth, $state, $http) {
    var vm = this;
    vm.loginError = false;
    vm.loginErrorText;
    vm.login = function() {
        var credentials = {
            email: vm.email,
            password: vm.password
        };

        $auth.login(credentials).then(function() {
            $http.get('http://pantoum.dev/api/v1/authenticate/user')
                .success(function(response) {
                    var user = JSON.stringify(response.user);
                    localStorage.setItem('user', user);
                    $scope.currentUser = response.user;
                    $state.go('blogs');
                })
                .error(function(error) {
                    vm.loginError = true;
                    vm.loginErrorText = error.data.error;
                    console.log(vm.loginErrorText);
                })
        });
    }
}
},{}],3:[function(require,module,exports){
'use strict';
module.exports = function($scope, $auth, $q, $http, $state, $rootScope) {
    var vm = this;
    vm.blogs = [];
    vm.error;
    vm.blog;
    vm.lastPage = 1;

    vm.init = function() {
        vm.lastPage = 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastPage }
        }).success(function(blogs, status, headers, config) {
            vm.blogs = blogs.data;
            vm.currentPage = blogs.current_page;
        });
    };

    vm.init();

    vm.getUserProfile = function() {
        return JSON.parse(localStorage.user).profile_image;
    }

    vm.loadMoreContent = function() {
        vm.lastPage += 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastPage }
        }).success(function(blogs, status, headers, config) {
            vm.blogs = vm.blogs.concat(blogs.data);
        });
    };
}

},{}],4:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.controller('authController', require('./authController'));
app.controller('blogsController', require('./blogsController'));
},{"./authController":2,"./blogsController":3}],5:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.directive('timeAgo', require('./timeAgo'));
app.directive('timeRead', require('./timeRead'));
app.directive('loadMoreContent', require('./loadMoreContent'));


},{"./loadMoreContent":6,"./timeAgo":7,"./timeRead":8}],6:[function(require,module,exports){
'use strict';
module.exports = function($document) {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            var shouldLoad = false;
            $(window).scroll(function() {
                if (!shouldLoad && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
                    shouldLoad = true;
                    console.log("Should load more contents");
                    shouldLoad = false;
                }
            });
        }
    }
}

},{}],7:[function(require,module,exports){
'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'createTime': '='
        },
        link: function(scope, elem, attrs) {
        	var result = $.timeago(scope.createTime);
        	$(elem).html(result);
        }
    }
}

},{}],8:[function(require,module,exports){
'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'blogContent': '='
        },
        link: function(scope, elem, attrs) {
            var contentLength = (scope.blogContent).split(" ").length,
                avgwpm = 300,
                timeRead = contentLength / avgwpm;
            timeRead < 1 ? $(elem).html(Math.floor(timeRead * 60) + ' second read') : $(elem).html(Math.floor(timeRead) + ' min read');
        }
    }
}

},{}],9:[function(require,module,exports){
'use strict';
module.exports = function() {

}

},{}],10:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.factory('blogsService', require('./blogsService'));


},{"./blogsService":9}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2Jsb2dzQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2luZGV4LmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvbG9hZE1vcmVDb250ZW50LmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy90aW1lQWdvLmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy90aW1lUmVhZC5qcyIsInNyYy9zY3JpcHRzL3NlcnZpY2VzL2Jsb2dzU2VydmljZS5qcyIsInNyYy9zY3JpcHRzL3NlcnZpY2VzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKlxuICogYXBwLmpzXG4gKiBJbmNsdWRpbmcgdmVuZG9yIGxpYnJhcmllcyAmIHRlbXBsYXRlIHNjcmlwdGluZyBmdW5jdGlvbnNcbiAqXG4gKiovXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbj0gICAgICAgICAgICBBUFAgQ09ORklHICAgICAgICAgICAgPVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4ndXNlIHN0cmljdCc7XG5cbi8vIENyZWF0ZSBhcHAgc2V0dGluZ3MgYW5kIHJvdXRpbmdcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZShcInBhbnRvdW1cIiwgWyd1aS5yb3V0ZXInLCAnc2F0ZWxsaXplcicsICdwZXJtaXNzaW9uJ10pO1xuYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkYXV0aFByb3ZpZGVyLCAkaW50ZXJwb2xhdGVQcm92aWRlcikge1xuICAgIFxuICAgIC8vIFNldCB1cCByb3V0ZSBmYWxsYmFjayBhbmQgYXV0aG9yaXplZCBBUElcbiAgICAkYXV0aFByb3ZpZGVyLmxvZ2luVXJsID0gJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlJztcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXV0aCcpO1xuXG4gICAgLy8gU2V0IHVwIGN1c3RvbSBleHByZXNzaW9ucyBmb3IgYmluZGluZyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBIYW5kbGViYXJzIFxuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCd7W3snKTtcbiAgICAkaW50ZXJwb2xhdGVQcm92aWRlci5lbmRTeW1ib2woJ31dfScpO1xuXG4gICAgLy8gQ29uZmlndXJlIHJvdXRpbmcgc3RhdGVcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcbiAgICAgICAgdXJsOiAnL2F1dGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgICAgIGV4Y2VwdDogWydpc0xvZ2dlZEluJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2Jsb2dzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2F1dGguaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2F1dGhDb250cm9sbGVyIGFzIGF1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KS5zdGF0ZSgnYmxvZ3MnLCB7XG4gICAgICAgIHVybDogJy9ibG9ncycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2Fub255bW91cyddLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICdhdXRoJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Jsb2dzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdibG9nc0NvbnRyb2xsZXIgYXMgYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG4vLyBFeGVjdXRlIGxvZ291dCBsb2dpY3MgYW5kIHBlcm1pc3Npb24gc2V0dGluZ3NcbmFwcC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlLCAkYXV0aCwgUGVybWlzc2lvblN0b3JlKSB7XG4gICAgJHJvb3RTY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJGF1dGgubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aCcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgUGVybWlzc2lvblN0b3JlLmRlZmluZVBlcm1pc3Npb24oJ2lzTG9nZ2VkSW4nLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICAvLyBJZiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgKnRydXRoeSogdGhlbiB0aGUgdXNlciBoYXMgdGhlIHJvbGUsIG90aGVyd2lzZSB0aGV5IGRvbid0XG4gICAgICAgIGlmICgkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdhbm9ueW1vdXMnLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICBpZiAoISRhdXRoLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59KTtcblxuLy8gUmVxdWlyZSBvdGhlciBjb21wb25lbnRzIHRvIGJlIGJ1bmRsZWQgdG9nZXRoZXJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsICRhdXRoLCAkc3RhdGUsICRodHRwKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2bS5sb2dpbkVycm9yID0gZmFsc2U7XG4gICAgdm0ubG9naW5FcnJvclRleHQ7XG4gICAgdm0ubG9naW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNyZWRlbnRpYWxzID0ge1xuICAgICAgICAgICAgZW1haWw6IHZtLmVtYWlsLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHZtLnBhc3N3b3JkXG4gICAgICAgIH07XG5cbiAgICAgICAgJGF1dGgubG9naW4oY3JlZGVudGlhbHMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkaHR0cC5nZXQoJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlL3VzZXInKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1c2VyID0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UudXNlcik7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgdXNlcik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50VXNlciA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYmxvZ3MnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB2bS5sb2dpbkVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvclRleHQgPSBlcnJvci5kYXRhLmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh2bS5sb2dpbkVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxufSIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHEsICRodHRwLCAkc3RhdGUsICRyb290U2NvcGUpIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZtLmJsb2dzID0gW107XG4gICAgdm0uZXJyb3I7XG4gICAgdm0uYmxvZztcbiAgICB2bS5sYXN0UGFnZSA9IDE7XG5cbiAgICB2bS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZtLmxhc3RQYWdlID0gMTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9ibG9ncycsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICBwYXJhbXM6IHsgcGFnZTogdm0ubGFzdFBhZ2UgfVxuICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSBibG9ncy5kYXRhO1xuICAgICAgICAgICAgdm0uY3VycmVudFBhZ2UgPSBibG9ncy5jdXJyZW50X3BhZ2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2bS5pbml0KCk7XG5cbiAgICB2bS5nZXRVc2VyUHJvZmlsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UudXNlcikucHJvZmlsZV9pbWFnZTtcbiAgICB9XG5cbiAgICB2bS5sb2FkTW9yZUNvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdm0ubGFzdFBhZ2UgKz0gMTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9ibG9ncycsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICBwYXJhbXM6IHsgcGFnZTogdm0ubGFzdFBhZ2UgfVxuICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSB2bS5ibG9ncy5jb25jYXQoYmxvZ3MuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmNvbnRyb2xsZXIoJ2F1dGhDb250cm9sbGVyJywgcmVxdWlyZSgnLi9hdXRoQ29udHJvbGxlcicpKTtcbmFwcC5jb250cm9sbGVyKCdibG9nc0NvbnRyb2xsZXInLCByZXF1aXJlKCcuL2Jsb2dzQ29udHJvbGxlcicpKTsiLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmRpcmVjdGl2ZSgndGltZUFnbycsIHJlcXVpcmUoJy4vdGltZUFnbycpKTtcbmFwcC5kaXJlY3RpdmUoJ3RpbWVSZWFkJywgcmVxdWlyZSgnLi90aW1lUmVhZCcpKTtcbmFwcC5kaXJlY3RpdmUoJ2xvYWRNb3JlQ29udGVudCcsIHJlcXVpcmUoJy4vbG9hZE1vcmVDb250ZW50JykpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRkb2N1bWVudCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtLCBhdHRycykge1xuICAgICAgICAgICAgdmFyIHNob3VsZExvYWQgPSBmYWxzZTtcbiAgICAgICAgICAgICQod2luZG93KS5zY3JvbGwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaG91bGRMb2FkICYmICgkKHdpbmRvdykuc2Nyb2xsVG9wKCkgPiAkKGRvY3VtZW50KS5oZWlnaHQoKSAtICQod2luZG93KS5oZWlnaHQoKSAtIDEwMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkTG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2hvdWxkIGxvYWQgbW9yZSBjb250ZW50c1wiKTtcbiAgICAgICAgICAgICAgICAgICAgc2hvdWxkTG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2NyZWF0ZVRpbWUnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHJzKSB7XG4gICAgICAgIFx0dmFyIHJlc3VsdCA9ICQudGltZWFnbyhzY29wZS5jcmVhdGVUaW1lKTtcbiAgICAgICAgXHQkKGVsZW0pLmh0bWwocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdibG9nQ29udGVudCc6ICc9J1xuICAgICAgICB9LFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbSwgYXR0cnMpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TGVuZ3RoID0gKHNjb3BlLmJsb2dDb250ZW50KS5zcGxpdChcIiBcIikubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGF2Z3dwbSA9IDMwMCxcbiAgICAgICAgICAgICAgICB0aW1lUmVhZCA9IGNvbnRlbnRMZW5ndGggLyBhdmd3cG07XG4gICAgICAgICAgICB0aW1lUmVhZCA8IDEgPyAkKGVsZW0pLmh0bWwoTWF0aC5mbG9vcih0aW1lUmVhZCAqIDYwKSArICcgc2Vjb25kIHJlYWQnKSA6ICQoZWxlbSkuaHRtbChNYXRoLmZsb29yKHRpbWVSZWFkKSArICcgbWluIHJlYWQnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuZmFjdG9yeSgnYmxvZ3NTZXJ2aWNlJywgcmVxdWlyZSgnLi9ibG9nc1NlcnZpY2UnKSk7XG5cbiJdfQ==
