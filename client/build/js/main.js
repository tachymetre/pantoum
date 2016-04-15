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
module.exports = function() {
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
                    $dropDownsIsActive = $('.pa-dropdown-wrapper').attr('class').indexOf('active');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2Jsb2dzQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2luZGV4LmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy9kcm9wRG93bi5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL2xvYWRNb3JlQ29udGVudC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvc2Nyb2xsSGlkZS5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZUFnby5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZVJlYWQuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9ibG9nc1NlcnZpY2UuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICpcbiAqIGFwcC5qc1xuICogSW5jbHVkaW5nIHZlbmRvciBsaWJyYXJpZXMgJiB0ZW1wbGF0ZSBzY3JpcHRpbmcgZnVuY3Rpb25zXG4gKlxuICoqL1xuLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG49ICAgICAgICAgICAgQVBQIENPTkZJRyAgICAgICAgICAgID1cbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBDcmVhdGUgYXBwIHNldHRpbmdzIGFuZCByb3V0aW5nXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoXCJwYW50b3VtXCIsIFsndWkucm91dGVyJywgJ3NhdGVsbGl6ZXInLCAncGVybWlzc2lvbiddKTtcbmFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRhdXRoUHJvdmlkZXIsICRpbnRlcnBvbGF0ZVByb3ZpZGVyKSA9PiB7XG4gICAgXG4gICAgLy8gU2V0IHVwIHJvdXRlIGZhbGxiYWNrIGFuZCBhdXRob3JpemVkIEFQSVxuICAgICRhdXRoUHJvdmlkZXIubG9naW5VcmwgPSAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9hdXRoZW50aWNhdGUnO1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hdXRoJyk7XG5cbiAgICAvLyBTZXQgdXAgY3VzdG9tIGV4cHJlc3Npb25zIGZvciBiaW5kaW5nIHRvIGF2b2lkIGNvbmZsaWN0cyB3aXRoIEhhbmRsZWJhcnMgXG4gICAgJGludGVycG9sYXRlUHJvdmlkZXIuc3RhcnRTeW1ib2woJ3tbeycpO1xuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnfV19Jyk7XG5cbiAgICAvLyBDb25maWd1cmUgcm91dGluZyBzdGF0ZVxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoJywge1xuICAgICAgICB1cmw6ICcvYXV0aCcsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2lzTG9nZ2VkSW4nXSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYXV0aC5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnYXV0aENvbnRyb2xsZXIgYXMgYXV0aCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pLnN0YXRlKCdibG9ncycsIHtcbiAgICAgICAgdXJsOiAnL2Jsb2dzJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgICAgICAgICBleGNlcHQ6IFsnYW5vbnltb3VzJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2F1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYmxvZ3MuaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2Jsb2dzQ29udHJvbGxlciBhcyBibG9ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8vIEV4ZWN1dGUgbG9nb3V0IGxvZ2ljcyBhbmQgcGVybWlzc2lvbiBzZXR0aW5nc1xuYXBwLnJ1bigoJHJvb3RTY29wZSwgJHN0YXRlLCAkYXV0aCwgUGVybWlzc2lvblN0b3JlKSA9PiB7XG4gICAgJHJvb3RTY29wZS5sb2dvdXQgPSAoKSA9PiB7XG4gICAgICAgICRhdXRoLmxvZ291dCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICBQZXJtaXNzaW9uU3RvcmUuZGVmaW5lUGVybWlzc2lvbignaXNMb2dnZWRJbicsIChzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgKnRydXRoeSogdGhlbiB0aGUgdXNlciBoYXMgdGhlIHJvbGUsIG90aGVyd2lzZSB0aGV5IGRvbid0XG4gICAgICAgIGlmICgkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdhbm9ueW1vdXMnLCAoc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgaWYgKCEkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufSk7XG5cbi8vIFJlcXVpcmUgb3RoZXIgY29tcG9uZW50cyB0byBiZSBidW5kbGVkIHRvZ2V0aGVyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMnKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHN0YXRlLCAkaHR0cCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0ubG9naW5FcnJvciA9IGZhbHNlO1xuICAgIHZtLmxvZ2luRXJyb3JUZXh0O1xuICAgIHZtLmxvZ2luID0gKCkgPT4ge1xuICAgICAgICB2YXIgY3JlZGVudGlhbHMgPSB7XG4gICAgICAgICAgICBlbWFpbDogdm0uZW1haWwsXG4gICAgICAgICAgICBwYXNzd29yZDogdm0ucGFzc3dvcmRcbiAgICAgICAgfTtcblxuICAgICAgICAkYXV0aC5sb2dpbihjcmVkZW50aWFscykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAkaHR0cC5nZXQoJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlL3VzZXInKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlciA9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Jsb2dzJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmxvZ2luRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2bS5sb2dpbkVycm9yVGV4dCA9IGVycm9yLmRhdGEuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHZtLmxvZ2luRXJyb3JUZXh0KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG59IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkaHR0cCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0uYmxvZ3MgPSBbXTtcbiAgICB2bS5sYXN0UGFnZSA9IDE7XG5cbiAgICB2bS5pbml0ID0gKCkgPT4ge1xuICAgICAgICB2bS5sYXN0UGFnZSA9IDE7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYmxvZ3MnLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RQYWdlIH1cbiAgICAgICAgfSkuc3VjY2VzcygoYmxvZ3MsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSA9PiB7XG4gICAgICAgICAgICB2bS5ibG9ncyA9IGJsb2dzLmRhdGE7XG4gICAgICAgICAgICB2bS5jdXJyZW50UGFnZSA9IGJsb2dzLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZtLmluaXQoKTtcblxuICAgIHZtLmdldFVzZXJQcm9maWxlID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UudXNlcikucHJvZmlsZV9pbWFnZTtcbiAgICB9XG5cbiAgICB2bS5sb2FkTW9yZUNvbnRlbnQgPSAoKSA9PiB7XG4gICAgICAgIHZtLmxhc3RQYWdlICs9IDE7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYmxvZ3MnLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RQYWdlIH1cbiAgICAgICAgfSkuc3VjY2VzcygoYmxvZ3MsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSA9PiB7XG4gICAgICAgICAgICB2bS5ibG9ncyA9IHZtLmJsb2dzLmNvbmNhdChibG9ncy5kYXRhKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuY29udHJvbGxlcignYXV0aENvbnRyb2xsZXInLCByZXF1aXJlKCcuL2F1dGhDb250cm9sbGVyJykpO1xuYXBwLmNvbnRyb2xsZXIoJ2Jsb2dzQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vYmxvZ3NDb250cm9sbGVyJykpOyIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICAgICAgJChlbGVtKS5vbignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgICQoJy5wYS1kcm9wZG93bi13cmFwcGVyJykudG9nZ2xlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGRvY3VtZW50Lm9uKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIFx0JCgnLnBhLWRyb3Bkb3duLXdyYXBwZXInKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuZGlyZWN0aXZlKCd0aW1lQWdvJywgcmVxdWlyZSgnLi90aW1lQWdvJykpO1xuYXBwLmRpcmVjdGl2ZSgndGltZVJlYWQnLCByZXF1aXJlKCcuL3RpbWVSZWFkJykpO1xuYXBwLmRpcmVjdGl2ZSgnc2Nyb2xsSGlkZScsIHJlcXVpcmUoJy4vc2Nyb2xsSGlkZScpKTtcbmFwcC5kaXJlY3RpdmUoJ2Ryb3BEb3duJywgcmVxdWlyZSgnLi9kcm9wRG93bicpKTtcbmFwcC5kaXJlY3RpdmUoJ2xvYWRNb3JlQ29udGVudCcsIHJlcXVpcmUoJy4vbG9hZE1vcmVDb250ZW50JykpO1xuXG5cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHRydWUsXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cnMpID0+IHtcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBjdXJyZW50IHRpbWUgdG8gZGV0ZWN0IGEgc2hpZnQgaW4gY2FsbGluZyBcbiAgICAgICAgICAgIHZhciB0aW1lTm93ID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIFRocm90dGxlIGZ1bnRpb24gdG8gcmF0ZS1saW1pdCBsb2FkaW5nIGJhc2VkIG9uIHNjcm9sbGluZyBldmVudHNcbiAgICAgICAgICAgIGZ1bmN0aW9uIHRocm90dGxlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGltZW91dCwgY29udGV4dCwgYXJncywgcmVzdWx0O1xuICAgICAgICAgICAgICAgIHZhciBwcmV2aW91cyA9IDA7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG5cbiAgICAgICAgICAgICAgICB2YXIgbGF0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlID8gMCA6IHRpbWVOb3coKTtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgdGhyb3R0bGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBub3cgPSB0aW1lTm93KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdyAtIHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiB3YWl0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzID0gbm93O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCF0aW1lb3V0ICYmIG9wdGlvbnMudHJhaWxpbmcgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgcmVtYWluaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aHJvdHRsZWQuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhyb3R0bGVkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIEltcGxlbWVudCBsb2FkaW5nIGZ1bmN0aW9uIHdoZW4gc2Nyb2xsaW5nIHRvIGJvdHRvbVxuICAgICAgICAgICAgdmFyIGxhc3RTY3JvbGwgPSAwO1xuICAgICAgICAgICAgJCh3aW5kb3cpLnNjcm9sbCh0aHJvdHRsZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgd2luZG93VG9wID0gJCh0aGlzKS5zY3JvbGxUb3AoKSxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93SGVpZ2h0ID0gJCh0aGlzKS5oZWlnaHQoKSxcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRIZWlnaHQgPSAkZG9jdW1lbnQuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAod2luZG93VG9wID4gbGFzdFNjcm9sbCAmJiB3aW5kb3dUb3AgPj0gZG9jdW1lbnRIZWlnaHQgLSB3aW5kb3dIZWlnaHQgLSA1MDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGF0dHJzLmluaXRMb2FkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFzdFNjcm9sbCA9IHdpbmRvd1RvcDtcbiAgICAgICAgICAgIH0sIDIwMCkpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICAgICAgdmFyIGRpZFNjcm9sbCxcbiAgICAgICAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gMCxcbiAgICAgICAgICAgICAgICBkZWx0YSA9IDUsXG4gICAgICAgICAgICAgICAgbmF2YmFySGVpZ2h0ID0gJChlbGVtKS5vdXRlckhlaWdodCgpO1xuXG4gICAgICAgICAgICAkKHdpbmRvdykuc2Nyb2xsKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlkU2Nyb2xsID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRpZFNjcm9sbCkge1xuICAgICAgICAgICAgICAgICAgICBoYXNTY3JvbGxlZCgpO1xuICAgICAgICAgICAgICAgICAgICBkaWRTY3JvbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAyNTApO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBoYXNTY3JvbGxlZCgpIHtcbiAgICAgICAgICAgICAgICB2YXIgd2luZG93VG9wID0gJCh3aW5kb3cpLnNjcm9sbFRvcCgpLFxuICAgICAgICAgICAgICAgICAgICAkZHJvcERvd25zSXNBY3RpdmUgPSAkKCcucGEtZHJvcGRvd24td3JhcHBlcicpLmF0dHIoJ2NsYXNzJykuaW5kZXhPZignYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzY3JvbGxpbmcgaGFzIHBhc3NlZCBhIGNlcnRhaW4gdGhyZXNob2xkXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGxhc3RTY3JvbGxUb3AgLSB3aW5kb3dUb3ApIDw9IGRlbHRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93VG9wID4gbGFzdFNjcm9sbFRvcCAmJiB3aW5kb3dUb3AgPiBuYXZiYXJIZWlnaHQgJiYgJGRyb3BEb3duc0lzQWN0aXZlID09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsZW0pLnJlbW92ZUNsYXNzKCdtZW51LXNob3cnKS5hZGRDbGFzcygnbWVudS1oaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAod2luZG93VG9wICsgJCh3aW5kb3cpLmhlaWdodCgpIDwgJChkb2N1bWVudCkuaGVpZ2h0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZWxlbSkucmVtb3ZlQ2xhc3MoJ21lbnUtaGlkZScpLmFkZENsYXNzKCdtZW51LXNob3cnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gd2luZG93VG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2NyZWF0ZVRpbWUnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICBcdHZhciByZXN1bHQgPSAkLnRpbWVhZ28oc2NvcGUuY3JlYXRlVGltZSk7XG4gICAgICAgIFx0JChlbGVtKS5odG1sKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnYmxvZ0NvbnRlbnQnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMZW5ndGggPSAoc2NvcGUuYmxvZ0NvbnRlbnQpLnNwbGl0KFwiIFwiKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXZnd3BtID0gMzAwLFxuICAgICAgICAgICAgICAgIHRpbWVSZWFkID0gY29udGVudExlbmd0aCAvIGF2Z3dwbTtcbiAgICAgICAgICAgIHRpbWVSZWFkIDwgMSA/ICQoZWxlbSkuaHRtbChNYXRoLmZsb29yKHRpbWVSZWFkICogNjApICsgJyBzZWNvbmQgcmVhZCcpIDogJChlbGVtKS5odG1sKE1hdGguZmxvb3IodGltZVJlYWQpICsgJyBtaW4gcmVhZCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5mYWN0b3J5KCdibG9nc1NlcnZpY2UnLCByZXF1aXJlKCcuL2Jsb2dzU2VydmljZScpKTtcblxuIl19
