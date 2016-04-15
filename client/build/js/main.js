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
app.config(($stateProvider, $urlRouterProvider, $authProvider, $interpolateProvider) => {
    
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
app.run(($rootScope, $state, $auth, PermissionStore) => {
    $rootScope.logout = () => {
        $auth.logout().then(() => {
            localStorage.removeItem('user');
            $rootScope.currentUser = null;
            $state.go('auth');
        });
    }
    $rootScope.currentUser = JSON.parse(localStorage.getItem('user'));
    PermissionStore.definePermission('isLoggedIn', (stateParams) => {
        // If the returned value is *truthy* then the user has the role, otherwise they don't
        if ($auth.isAuthenticated()) {
            return true;
        }
        return false;
    });
    PermissionStore.definePermission('anonymous', (stateParams) => {
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

},{"./controllers":4,"./directives":6,"./services":12}],2:[function(require,module,exports){
'use strict';
module.exports = function($scope, $auth, $state, $http) {
    var vm = this;
    vm.loginError = false;
    vm.loginErrorText;
    vm.login = () => {
        var credentials = {
            email: vm.email,
            password: vm.password
        };

        $auth.login(credentials).then(() => {
            $http.get('http://pantoum.dev/api/v1/authenticate/user')
                .success((response) => {
                    var user = JSON.stringify(response.user);
                    localStorage.setItem('user', user);
                    $scope.currentUser = response.user;
                    $state.go('blogs');
                })
                .error((error) => {
                    vm.loginError = true;
                    vm.loginErrorText = error.data.error;
                    console.log(vm.loginErrorText);
                })
        });
    }
}
},{}],3:[function(require,module,exports){
'use strict';
module.exports = function($http) {
    var vm = this;
    vm.blogs = [];
    vm.lastPage = 1;

    vm.init = () => {
        vm.lastPage = 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastPage }
        }).success((blogs, status, headers, config) => {
            vm.blogs = blogs.data;
            vm.currentPage = blogs.current_page;
        });
    };

    vm.init();

    vm.getUserProfile = () => {
        return JSON.parse(localStorage.user).profile_image;
    }

    vm.loadMoreContent = () => {
        vm.lastPage += 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastPage }
        }).success((blogs, status, headers, config) => {
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
module.exports = function($document) {
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            $(elem).on('click', (e) => {
                $('.pa-dropdown-wrapper').toggleClass('active');
                return false;
            });
            $document.on('click', () => {
            	$('.pa-dropdown-wrapper').removeClass('active');
            });
        }
    }
}

},{}],6:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.directive('timeAgo', require('./timeAgo'));
app.directive('timeRead', require('./timeRead'));
app.directive('scrollHide', require('./scrollHide'));
app.directive('dropDown', require('./dropDown'));
app.directive('loadMoreContent', require('./loadMoreContent'));



},{"./dropDown":5,"./loadMoreContent":7,"./scrollHide":8,"./timeAgo":9,"./timeRead":10}],7:[function(require,module,exports){
'use strict';
module.exports = function($document) {
    return {
        restrict: 'E',
        scope: true,
        link: (scope, elem, attrs) => {
            // Calculate current time to detect a shift in calling 
            var timeNow = Date.now || function() {
                return new Date().getTime();
            };
            // Throttle funtion to rate-limit loading based on scrolling events
            function throttle(func, wait, options) {
                var timeout, context, args, result;
                var previous = 0;
                if (!options) options = {};

                var later = function() {
                    previous = options.leading === false ? 0 : timeNow();
                    timeout = null;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                };

                var throttled = function() {
                    var now = timeNow();
                    if (!previous && options.leading === false) previous = now;
                    var remaining = wait - (now - previous);
                    context = this;
                    args = arguments;
                    if (remaining <= 0 || remaining > wait) {
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = null;
                        }
                        previous = now;
                        result = func.apply(context, args);
                        if (!timeout) context = args = null;
                    } else if (!timeout && options.trailing !== false) {
                        timeout = setTimeout(later, remaining);
                    }
                    return result;
                };

                throttled.cancel = function() {
                    clearTimeout(timeout);
                    previous = 0;
                    timeout = context = args = null;
                };

                return throttled;
            };
            // Implement loading function when scrolling to bottom
            var lastScroll = 0;
            $(window).scroll(throttle(function() {
                var windowTop = $(this).scrollTop(),
                    windowHeight = $(this).height(),
                    documentHeight = $document.height();

                if (windowTop > lastScroll && windowTop >= documentHeight - windowHeight - 500) {
                    scope.$apply(attrs.initLoad);
                }
                lastScroll = windowTop;
            }, 200));
        }
    }
}

},{}],8:[function(require,module,exports){
'use strict';
module.exports = function($state) {
    return {
        restrict: 'A',
        scope: true,
        link: (scope, elem, attrs) => {
            var didScroll,
                lastScrollTop = 0,
                delta = 5,
                navbarHeight = $(elem).outerHeight();

            $(window).scroll((e) => {
                didScroll = true;
            });

            setInterval(() => {
                if (didScroll) {
                    hasScrolled();
                    didScroll = false;
                }
            }, 250);

            function hasScrolled() {
                var windowTop = $(window).scrollTop(),
                    $dropDownsIsActive;
                // Only allow the scrollHide when on the blogs route
                if ($state.$current.url.sourcePath == "/blogs") {
                    $dropDownsIsActive = $('.pa-dropdown-wrapper').attr('class').indexOf('active');
                }

                // Make sure the scrolling has passed a certain threshold
                if (Math.abs(lastScrollTop - windowTop) <= delta) {
                    return;
                } else {
                    if (windowTop > lastScrollTop && windowTop > navbarHeight && $dropDownsIsActive == -1) {
                        $(elem).removeClass('menu-show').addClass('menu-hide');
                    } else if (windowTop + $(window).height() < $(document).height()) {
                        $(elem).removeClass('menu-hide').addClass('menu-show');
                    }
                }
                lastScrollTop = windowTop;
            }
        }
    }
}

},{}],9:[function(require,module,exports){
'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'createTime': '='
        },
        link: (scope, elem, attrs) => {
        	var result = $.timeago(scope.createTime);
        	$(elem).html(result);
        }
    }
}

},{}],10:[function(require,module,exports){
'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'blogContent': '='
        },
        link: (scope, elem, attrs) => {
            var contentLength = (scope.blogContent).split(" ").length,
                avgwpm = 300,
                timeRead = contentLength / avgwpm;
            timeRead < 1 ? $(elem).html(Math.floor(timeRead * 60) + ' second read') : $(elem).html(Math.floor(timeRead) + ' min read');
        }
    }
}

},{}],11:[function(require,module,exports){
'use strict';
module.exports = function() {

}

},{}],12:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.factory('blogsService', require('./blogsService'));


},{"./blogsService":11}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2Jsb2dzQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2luZGV4LmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy9kcm9wRG93bi5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL2xvYWRNb3JlQ29udGVudC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvc2Nyb2xsSGlkZS5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZUFnby5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZVJlYWQuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9ibG9nc1NlcnZpY2UuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqXG4gKiBhcHAuanNcbiAqIEluY2x1ZGluZyB2ZW5kb3IgbGlicmFyaWVzICYgdGVtcGxhdGUgc2NyaXB0aW5nIGZ1bmN0aW9uc1xuICpcbiAqKi9cbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuPSAgICAgICAgICAgIEFQUCBDT05GSUcgICAgICAgICAgICA9XG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbid1c2Ugc3RyaWN0JztcblxuLy8gQ3JlYXRlIGFwcCBzZXR0aW5ncyBhbmQgcm91dGluZ1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKFwicGFudG91bVwiLCBbJ3VpLnJvdXRlcicsICdzYXRlbGxpemVyJywgJ3Blcm1pc3Npb24nXSk7XG5hcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkYXV0aFByb3ZpZGVyLCAkaW50ZXJwb2xhdGVQcm92aWRlcikgPT4ge1xuICAgIFxuICAgIC8vIFNldCB1cCByb3V0ZSBmYWxsYmFjayBhbmQgYXV0aG9yaXplZCBBUElcbiAgICAkYXV0aFByb3ZpZGVyLmxvZ2luVXJsID0gJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlJztcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXV0aCcpO1xuXG4gICAgLy8gU2V0IHVwIGN1c3RvbSBleHByZXNzaW9ucyBmb3IgYmluZGluZyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBIYW5kbGViYXJzIFxuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCd7W3snKTtcbiAgICAkaW50ZXJwb2xhdGVQcm92aWRlci5lbmRTeW1ib2woJ31dfScpO1xuXG4gICAgLy8gQ29uZmlndXJlIHJvdXRpbmcgc3RhdGVcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcbiAgICAgICAgdXJsOiAnL2F1dGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgICAgIGV4Y2VwdDogWydpc0xvZ2dlZEluJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2Jsb2dzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2F1dGguaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2F1dGhDb250cm9sbGVyIGFzIGF1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KS5zdGF0ZSgnYmxvZ3MnLCB7XG4gICAgICAgIHVybDogJy9ibG9ncycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2Fub255bW91cyddLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICdhdXRoJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Jsb2dzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdibG9nc0NvbnRyb2xsZXIgYXMgYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG4vLyBFeGVjdXRlIGxvZ291dCBsb2dpY3MgYW5kIHBlcm1pc3Npb24gc2V0dGluZ3NcbmFwcC5ydW4oKCRyb290U2NvcGUsICRzdGF0ZSwgJGF1dGgsIFBlcm1pc3Npb25TdG9yZSkgPT4ge1xuICAgICRyb290U2NvcGUubG9nb3V0ID0gKCkgPT4ge1xuICAgICAgICAkYXV0aC5sb2dvdXQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aCcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgUGVybWlzc2lvblN0b3JlLmRlZmluZVBlcm1pc3Npb24oJ2lzTG9nZ2VkSW4nLCAoc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlIHJldHVybmVkIHZhbHVlIGlzICp0cnV0aHkqIHRoZW4gdGhlIHVzZXIgaGFzIHRoZSByb2xlLCBvdGhlcndpc2UgdGhleSBkb24ndFxuICAgICAgICBpZiAoJGF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgICBQZXJtaXNzaW9uU3RvcmUuZGVmaW5lUGVybWlzc2lvbignYW5vbnltb3VzJywgKHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgIGlmICghJGF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbn0pO1xuXG4vLyBSZXF1aXJlIG90aGVyIGNvbXBvbmVudHMgdG8gYmUgYnVuZGxlZCB0b2dldGhlclxucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGF1dGgsICRzdGF0ZSwgJGh0dHApIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZtLmxvZ2luRXJyb3IgPSBmYWxzZTtcbiAgICB2bS5sb2dpbkVycm9yVGV4dDtcbiAgICB2bS5sb2dpbiA9ICgpID0+IHtcbiAgICAgICAgdmFyIGNyZWRlbnRpYWxzID0ge1xuICAgICAgICAgICAgZW1haWw6IHZtLmVtYWlsLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHZtLnBhc3N3b3JkXG4gICAgICAgIH07XG5cbiAgICAgICAgJGF1dGgubG9naW4oY3JlZGVudGlhbHMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2F1dGhlbnRpY2F0ZS91c2VyJylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcygocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXIgPSBKU09OLnN0cmluZ2lmeShyZXNwb25zZS51c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCB1c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRVc2VyID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdibG9ncycpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2bS5sb2dpbkVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvclRleHQgPSBlcnJvci5kYXRhLmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh2bS5sb2dpbkVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxufSIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJGh0dHApIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZtLmJsb2dzID0gW107XG4gICAgdm0ubGFzdFBhZ2UgPSAxO1xuXG4gICAgdm0uaW5pdCA9ICgpID0+IHtcbiAgICAgICAgdm0ubGFzdFBhZ2UgPSAxO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2Jsb2dzJyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0UGFnZSB9XG4gICAgICAgIH0pLnN1Y2Nlc3MoKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSBibG9ncy5kYXRhO1xuICAgICAgICAgICAgdm0uY3VycmVudFBhZ2UgPSBibG9ncy5jdXJyZW50X3BhZ2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2bS5pbml0KCk7XG5cbiAgICB2bS5nZXRVc2VyUHJvZmlsZSA9ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLnVzZXIpLnByb2ZpbGVfaW1hZ2U7XG4gICAgfVxuXG4gICAgdm0ubG9hZE1vcmVDb250ZW50ID0gKCkgPT4ge1xuICAgICAgICB2bS5sYXN0UGFnZSArPSAxO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2Jsb2dzJyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0UGFnZSB9XG4gICAgICAgIH0pLnN1Y2Nlc3MoKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSB2bS5ibG9ncy5jb25jYXQoYmxvZ3MuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG4iLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmNvbnRyb2xsZXIoJ2F1dGhDb250cm9sbGVyJywgcmVxdWlyZSgnLi9hdXRoQ29udHJvbGxlcicpKTtcbmFwcC5jb250cm9sbGVyKCdibG9nc0NvbnRyb2xsZXInLCByZXF1aXJlKCcuL2Jsb2dzQ29udHJvbGxlcicpKTsiLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRkb2N1bWVudCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cnMpID0+IHtcbiAgICAgICAgICAgICQoZWxlbSkub24oJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAkKCcucGEtZHJvcGRvd24td3JhcHBlcicpLnRvZ2dsZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRkb2N1bWVudC5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBcdCQoJy5wYS1kcm9wZG93bi13cmFwcGVyJykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmRpcmVjdGl2ZSgndGltZUFnbycsIHJlcXVpcmUoJy4vdGltZUFnbycpKTtcbmFwcC5kaXJlY3RpdmUoJ3RpbWVSZWFkJywgcmVxdWlyZSgnLi90aW1lUmVhZCcpKTtcbmFwcC5kaXJlY3RpdmUoJ3Njcm9sbEhpZGUnLCByZXF1aXJlKCcuL3Njcm9sbEhpZGUnKSk7XG5hcHAuZGlyZWN0aXZlKCdkcm9wRG93bicsIHJlcXVpcmUoJy4vZHJvcERvd24nKSk7XG5hcHAuZGlyZWN0aXZlKCdsb2FkTW9yZUNvbnRlbnQnLCByZXF1aXJlKCcuL2xvYWRNb3JlQ29udGVudCcpKTtcblxuXG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRkb2N1bWVudCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgICBsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHJzKSA9PiB7XG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgY3VycmVudCB0aW1lIHRvIGRldGVjdCBhIHNoaWZ0IGluIGNhbGxpbmcgXG4gICAgICAgICAgICB2YXIgdGltZU5vdyA9IERhdGUubm93IHx8IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBUaHJvdHRsZSBmdW50aW9uIHRvIHJhdGUtbGltaXQgbG9hZGluZyBiYXNlZCBvbiBzY3JvbGxpbmcgZXZlbnRzXG4gICAgICAgICAgICBmdW5jdGlvbiB0aHJvdHRsZShmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVvdXQsIGNvbnRleHQsIGFyZ3MsIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB2YXIgcHJldmlvdXMgPSAwO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucykgb3B0aW9ucyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgdmFyIGxhdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiB0aW1lTm93KCk7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIHRocm90dGxlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gdGltZU5vdygpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByZXZpb3VzICYmIG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UpIHByZXZpb3VzID0gbm93O1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3cgLSBwcmV2aW91cyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRpbWVvdXQpIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhyb3R0bGVkLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRocm90dGxlZDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBJbXBsZW1lbnQgbG9hZGluZyBmdW5jdGlvbiB3aGVuIHNjcm9sbGluZyB0byBib3R0b21cbiAgICAgICAgICAgIHZhciBsYXN0U2Nyb2xsID0gMDtcbiAgICAgICAgICAgICQod2luZG93KS5zY3JvbGwodGhyb3R0bGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpbmRvd1RvcCA9ICQodGhpcykuc2Nyb2xsVG9wKCksXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvd0hlaWdodCA9ICQodGhpcykuaGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50SGVpZ2h0ID0gJGRvY3VtZW50LmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHdpbmRvd1RvcCA+IGxhc3RTY3JvbGwgJiYgd2luZG93VG9wID49IGRvY3VtZW50SGVpZ2h0IC0gd2luZG93SGVpZ2h0IC0gNTAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShhdHRycy5pbml0TG9hZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3RTY3JvbGwgPSB3aW5kb3dUb3A7XG4gICAgICAgICAgICB9LCAyMDApKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHN0YXRlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHRydWUsXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cnMpID0+IHtcbiAgICAgICAgICAgIHZhciBkaWRTY3JvbGwsXG4gICAgICAgICAgICAgICAgbGFzdFNjcm9sbFRvcCA9IDAsXG4gICAgICAgICAgICAgICAgZGVsdGEgPSA1LFxuICAgICAgICAgICAgICAgIG5hdmJhckhlaWdodCA9ICQoZWxlbSkub3V0ZXJIZWlnaHQoKTtcblxuICAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGRpZFNjcm9sbCA9IHRydWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkaWRTY3JvbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFzU2Nyb2xsZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgZGlkU2Nyb2xsID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaGFzU2Nyb2xsZWQoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpbmRvd1RvcCA9ICQod2luZG93KS5zY3JvbGxUb3AoKSxcbiAgICAgICAgICAgICAgICAgICAgJGRyb3BEb3duc0lzQWN0aXZlO1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgYWxsb3cgdGhlIHNjcm9sbEhpZGUgd2hlbiBvbiB0aGUgYmxvZ3Mgcm91dGVcbiAgICAgICAgICAgICAgICBpZiAoJHN0YXRlLiRjdXJyZW50LnVybC5zb3VyY2VQYXRoID09IFwiL2Jsb2dzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgJGRyb3BEb3duc0lzQWN0aXZlID0gJCgnLnBhLWRyb3Bkb3duLXdyYXBwZXInKS5hdHRyKCdjbGFzcycpLmluZGV4T2YoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgc2Nyb2xsaW5nIGhhcyBwYXNzZWQgYSBjZXJ0YWluIHRocmVzaG9sZFxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhsYXN0U2Nyb2xsVG9wIC0gd2luZG93VG9wKSA8PSBkZWx0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpbmRvd1RvcCA+IGxhc3RTY3JvbGxUb3AgJiYgd2luZG93VG9wID4gbmF2YmFySGVpZ2h0ICYmICRkcm9wRG93bnNJc0FjdGl2ZSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChlbGVtKS5yZW1vdmVDbGFzcygnbWVudS1zaG93JykuYWRkQ2xhc3MoJ21lbnUtaGlkZScpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHdpbmRvd1RvcCArICQod2luZG93KS5oZWlnaHQoKSA8ICQoZG9jdW1lbnQpLmhlaWdodCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsZW0pLnJlbW92ZUNsYXNzKCdtZW51LWhpZGUnKS5hZGRDbGFzcygnbWVudS1zaG93Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdFNjcm9sbFRvcCA9IHdpbmRvd1RvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdjcmVhdGVUaW1lJzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cnMpID0+IHtcbiAgICAgICAgXHR2YXIgcmVzdWx0ID0gJC50aW1lYWdvKHNjb3BlLmNyZWF0ZVRpbWUpO1xuICAgICAgICBcdCQoZWxlbSkuaHRtbChyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2Jsb2dDb250ZW50JzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cnMpID0+IHtcbiAgICAgICAgICAgIHZhciBjb250ZW50TGVuZ3RoID0gKHNjb3BlLmJsb2dDb250ZW50KS5zcGxpdChcIiBcIikubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGF2Z3dwbSA9IDMwMCxcbiAgICAgICAgICAgICAgICB0aW1lUmVhZCA9IGNvbnRlbnRMZW5ndGggLyBhdmd3cG07XG4gICAgICAgICAgICB0aW1lUmVhZCA8IDEgPyAkKGVsZW0pLmh0bWwoTWF0aC5mbG9vcih0aW1lUmVhZCAqIDYwKSArICcgc2Vjb25kIHJlYWQnKSA6ICQoZWxlbSkuaHRtbChNYXRoLmZsb29yKHRpbWVSZWFkKSArICcgbWluIHJlYWQnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuZmFjdG9yeSgnYmxvZ3NTZXJ2aWNlJywgcmVxdWlyZSgnLi9ibG9nc1NlcnZpY2UnKSk7XG5cbiJdfQ==
