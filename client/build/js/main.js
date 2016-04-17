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
module.exports = function($http) {
    var vm = this;
    vm.blogs = [];
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
        }).success((blogs, status, headers, config) => {
            vm.blogs = vm.blogs.concat(blogs.data);
        });
    };

    vm.getHighlightContent = function() {
        $http({
            url: 'http://pantoum.dev/api/v1/highlights',
            method: "GET"
        }).success(function(highlights, status, headers, config) {
            vm.highlights = highlights;
            console.log(vm.highlights);
        });
    }

    vm.getHighlightContent();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2Jsb2dzQ29udHJvbGxlci5qcyIsInNyYy9zY3JpcHRzL2NvbnRyb2xsZXJzL2luZGV4LmpzIiwic3JjL3NjcmlwdHMvZGlyZWN0aXZlcy9kcm9wRG93bi5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL2xvYWRNb3JlQ29udGVudC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvc2Nyb2xsSGlkZS5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZUFnby5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvdGltZVJlYWQuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9ibG9nc1NlcnZpY2UuanMiLCJzcmMvc2NyaXB0cy9zZXJ2aWNlcy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICpcbiAqIGFwcC5qc1xuICogSW5jbHVkaW5nIHZlbmRvciBsaWJyYXJpZXMgJiB0ZW1wbGF0ZSBzY3JpcHRpbmcgZnVuY3Rpb25zXG4gKlxuICoqL1xuLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG49ICAgICAgICAgICAgQVBQIENPTkZJRyAgICAgICAgICAgID1cbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBDcmVhdGUgYXBwIHNldHRpbmdzIGFuZCByb3V0aW5nXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoXCJwYW50b3VtXCIsIFsndWkucm91dGVyJywgJ3NhdGVsbGl6ZXInLCAncGVybWlzc2lvbiddKTtcbmFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRhdXRoUHJvdmlkZXIsICRpbnRlcnBvbGF0ZVByb3ZpZGVyKSA9PiB7XG4gICAgXG4gICAgLy8gU2V0IHVwIHJvdXRlIGZhbGxiYWNrIGFuZCBhdXRob3JpemVkIEFQSVxuICAgICRhdXRoUHJvdmlkZXIubG9naW5VcmwgPSAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9hdXRoZW50aWNhdGUnO1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hdXRoJyk7XG5cbiAgICAvLyBTZXQgdXAgY3VzdG9tIGV4cHJlc3Npb25zIGZvciBiaW5kaW5nIHRvIGF2b2lkIGNvbmZsaWN0cyB3aXRoIEhhbmRsZWJhcnMgXG4gICAgJGludGVycG9sYXRlUHJvdmlkZXIuc3RhcnRTeW1ib2woJ3tbeycpO1xuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnfV19Jyk7XG5cbiAgICAvLyBDb25maWd1cmUgcm91dGluZyBzdGF0ZVxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoJywge1xuICAgICAgICB1cmw6ICcvYXV0aCcsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2lzTG9nZ2VkSW4nXSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYXV0aC5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnYXV0aENvbnRyb2xsZXIgYXMgYXV0aCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pLnN0YXRlKCdibG9ncycsIHtcbiAgICAgICAgdXJsOiAnL2Jsb2dzJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgICAgICAgICBleGNlcHQ6IFsnYW5vbnltb3VzJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2F1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYmxvZ3MuaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ2Jsb2dzQ29udHJvbGxlciBhcyBibG9ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8vIEV4ZWN1dGUgbG9nb3V0IGxvZ2ljcyBhbmQgcGVybWlzc2lvbiBzZXR0aW5nc1xuYXBwLnJ1bigoJHJvb3RTY29wZSwgJHN0YXRlLCAkYXV0aCwgUGVybWlzc2lvblN0b3JlKSA9PiB7XG4gICAgJHJvb3RTY29wZS5sb2dvdXQgPSAoKSA9PiB7XG4gICAgICAgICRhdXRoLmxvZ291dCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICBQZXJtaXNzaW9uU3RvcmUuZGVmaW5lUGVybWlzc2lvbignaXNMb2dnZWRJbicsIChzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICAvLyBJZiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgKnRydXRoeSogdGhlbiB0aGUgdXNlciBoYXMgdGhlIHJvbGUsIG90aGVyd2lzZSB0aGV5IGRvbid0XG4gICAgICAgIGlmICgkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdhbm9ueW1vdXMnLCAoc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgaWYgKCEkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufSk7XG5cbi8vIFJlcXVpcmUgb3RoZXIgY29tcG9uZW50cyB0byBiZSBidW5kbGVkIHRvZ2V0aGVyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMnKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHN0YXRlLCAkaHR0cCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0ubG9naW5FcnJvciA9IGZhbHNlO1xuICAgIHZtLmxvZ2luRXJyb3JUZXh0O1xuICAgIHZtLmxvZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgIGVtYWlsOiB2bS5lbWFpbCxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB2bS5wYXNzd29yZFxuICAgICAgICB9O1xuXG4gICAgICAgICRhdXRoLmxvZ2luKGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2F1dGhlbnRpY2F0ZS91c2VyJylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlciA9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Jsb2dzJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZtLmxvZ2luRXJyb3JUZXh0ID0gZXJyb3IuZGF0YS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codm0ubG9naW5FcnJvclRleHQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2bS5ibG9ncyA9IFtdO1xuICAgIHZtLmxhc3RQYWdlID0gMTtcblxuICAgIHZtLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdm0ubGFzdFBhZ2UgPSAxO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2Jsb2dzJyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0UGFnZSB9XG4gICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oYmxvZ3MsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICB2bS5ibG9ncyA9IGJsb2dzLmRhdGE7XG4gICAgICAgICAgICB2bS5jdXJyZW50UGFnZSA9IGJsb2dzLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZtLmluaXQoKTtcblxuICAgIHZtLmdldFVzZXJQcm9maWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS51c2VyKS5wcm9maWxlX2ltYWdlO1xuICAgIH1cblxuICAgIHZtLmxvYWRNb3JlQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2bS5sYXN0UGFnZSArPSAxO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2Jsb2dzJyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0UGFnZSB9XG4gICAgICAgIH0pLnN1Y2Nlc3MoKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykgPT4ge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSB2bS5ibG9ncy5jb25jYXQoYmxvZ3MuZGF0YSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2bS5nZXRIaWdobGlnaHRDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvaGlnaGxpZ2h0cycsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCJcbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihoaWdobGlnaHRzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgdm0uaGlnaGxpZ2h0cyA9IGhpZ2hsaWdodHM7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh2bS5oaWdobGlnaHRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdm0uZ2V0SGlnaGxpZ2h0Q29udGVudCgpO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5jb250cm9sbGVyKCdhdXRoQ29udHJvbGxlcicsIHJlcXVpcmUoJy4vYXV0aENvbnRyb2xsZXInKSk7XG5hcHAuY29udHJvbGxlcignYmxvZ3NDb250cm9sbGVyJywgcmVxdWlyZSgnLi9ibG9nc0NvbnRyb2xsZXInKSk7IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHJzKSA9PiB7XG4gICAgICAgICAgICAkKGVsZW0pLm9uKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgJCgnLnBhLWRyb3Bkb3duLXdyYXBwZXInKS50b2dnbGVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkZG9jdW1lbnQub24oJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgXHQkKCcucGEtZHJvcGRvd24td3JhcHBlcicpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5kaXJlY3RpdmUoJ3RpbWVBZ28nLCByZXF1aXJlKCcuL3RpbWVBZ28nKSk7XG5hcHAuZGlyZWN0aXZlKCd0aW1lUmVhZCcsIHJlcXVpcmUoJy4vdGltZVJlYWQnKSk7XG5hcHAuZGlyZWN0aXZlKCdzY3JvbGxIaWRlJywgcmVxdWlyZSgnLi9zY3JvbGxIaWRlJykpO1xuYXBwLmRpcmVjdGl2ZSgnZHJvcERvd24nLCByZXF1aXJlKCcuL2Ryb3BEb3duJykpO1xuYXBwLmRpcmVjdGl2ZSgnbG9hZE1vcmVDb250ZW50JywgcmVxdWlyZSgnLi9sb2FkTW9yZUNvbnRlbnQnKSk7XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGN1cnJlbnQgdGltZSB0byBkZXRlY3QgYSBzaGlmdCBpbiBjYWxsaW5nIFxuICAgICAgICAgICAgdmFyIHRpbWVOb3cgPSBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gVGhyb3R0bGUgZnVudGlvbiB0byByYXRlLWxpbWl0IGxvYWRpbmcgYmFzZWQgb24gc2Nyb2xsaW5nIGV2ZW50c1xuICAgICAgICAgICAgZnVuY3Rpb24gdGhyb3R0bGUoZnVuYywgd2FpdCwgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lb3V0LCBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZpb3VzID0gMDtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMpIG9wdGlvbnMgPSB7fTtcblxuICAgICAgICAgICAgICAgIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyA9IG9wdGlvbnMubGVhZGluZyA9PT0gZmFsc2UgPyAwIDogdGltZU5vdygpO1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciB0aHJvdHRsZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IHRpbWVOb3coKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcmV2aW91cyAmJiBvcHRpb25zLmxlYWRpbmcgPT09IGZhbHNlKSBwcmV2aW91cyA9IG5vdztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXRpbWVvdXQgJiYgb3B0aW9ucy50cmFpbGluZyAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCByZW1haW5pbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRocm90dGxlZC5jYW5jZWwgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91cyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aHJvdHRsZWQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gSW1wbGVtZW50IGxvYWRpbmcgZnVuY3Rpb24gd2hlbiBzY3JvbGxpbmcgdG8gYm90dG9tXG4gICAgICAgICAgICB2YXIgbGFzdFNjcm9sbCA9IDA7XG4gICAgICAgICAgICAkKHdpbmRvdykuc2Nyb2xsKHRocm90dGxlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB3aW5kb3dUb3AgPSAkKHRoaXMpLnNjcm9sbFRvcCgpLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3dIZWlnaHQgPSAkKHRoaXMpLmhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudEhlaWdodCA9ICRkb2N1bWVudC5oZWlnaHQoKTtcblxuICAgICAgICAgICAgICAgIGlmICh3aW5kb3dUb3AgPiBsYXN0U2Nyb2xsICYmIHdpbmRvd1RvcCA+PSBkb2N1bWVudEhlaWdodCAtIHdpbmRvd0hlaWdodCAtIDUwMCkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoYXR0cnMuaW5pdExvYWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0U2Nyb2xsID0gd2luZG93VG9wO1xuICAgICAgICAgICAgfSwgMjAwKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzdGF0ZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB0cnVlLFxuICAgICAgICBsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHJzKSA9PiB7XG4gICAgICAgICAgICB2YXIgZGlkU2Nyb2xsLFxuICAgICAgICAgICAgICAgIGxhc3RTY3JvbGxUb3AgPSAwLFxuICAgICAgICAgICAgICAgIGRlbHRhID0gNSxcbiAgICAgICAgICAgICAgICBuYXZiYXJIZWlnaHQgPSAkKGVsZW0pLm91dGVySGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICQod2luZG93KS5zY3JvbGwoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBkaWRTY3JvbGwgPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGlkU2Nyb2xsKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhc1Njcm9sbGVkKCk7XG4gICAgICAgICAgICAgICAgICAgIGRpZFNjcm9sbCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDI1MCk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGhhc1Njcm9sbGVkKCkge1xuICAgICAgICAgICAgICAgIHZhciB3aW5kb3dUb3AgPSAkKHdpbmRvdykuc2Nyb2xsVG9wKCksXG4gICAgICAgICAgICAgICAgICAgICRkcm9wRG93bnNJc0FjdGl2ZTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gT25seSBhbGxvdyB0aGUgc2Nyb2xsSGlkZSB3aGVuIG9uIHRoZSBibG9ncyByb3V0ZVxuICAgICAgICAgICAgICAgIGlmICgkc3RhdGUuJGN1cnJlbnQudXJsLnNvdXJjZVBhdGggPT0gXCIvYmxvZ3NcIikge1xuICAgICAgICAgICAgICAgICAgICAkZHJvcERvd25zSXNBY3RpdmUgPSAkKCcucGEtZHJvcGRvd24td3JhcHBlcicpLmF0dHIoJ2NsYXNzJykuaW5kZXhPZignYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBzY3JvbGxpbmcgaGFzIHBhc3NlZCBhIGNlcnRhaW4gdGhyZXNob2xkXG4gICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGxhc3RTY3JvbGxUb3AgLSB3aW5kb3dUb3ApIDw9IGRlbHRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAod2luZG93VG9wID4gbGFzdFNjcm9sbFRvcCAmJiB3aW5kb3dUb3AgPiBuYXZiYXJIZWlnaHQgJiYgJGRyb3BEb3duc0lzQWN0aXZlID09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGVsZW0pLnJlbW92ZUNsYXNzKCdtZW51LXNob3cnKS5hZGRDbGFzcygnbWVudS1oaWRlJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAod2luZG93VG9wICsgJCh3aW5kb3cpLmhlaWdodCgpIDwgJChkb2N1bWVudCkuaGVpZ2h0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZWxlbSkucmVtb3ZlQ2xhc3MoJ21lbnUtaGlkZScpLmFkZENsYXNzKCdtZW51LXNob3cnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsYXN0U2Nyb2xsVG9wID0gd2luZG93VG9wO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2NyZWF0ZVRpbWUnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICBcdHZhciByZXN1bHQgPSAkLnRpbWVhZ28oc2NvcGUuY3JlYXRlVGltZSk7XG4gICAgICAgIFx0JChlbGVtKS5odG1sKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnYmxvZ0NvbnRlbnQnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRycykgPT4ge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMZW5ndGggPSAoc2NvcGUuYmxvZ0NvbnRlbnQpLnNwbGl0KFwiIFwiKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXZnd3BtID0gMzAwLFxuICAgICAgICAgICAgICAgIHRpbWVSZWFkID0gY29udGVudExlbmd0aCAvIGF2Z3dwbTtcbiAgICAgICAgICAgIHRpbWVSZWFkIDwgMSA/ICQoZWxlbSkuaHRtbChNYXRoLmZsb29yKHRpbWVSZWFkICogNjApICsgJyBzZWNvbmQgcmVhZCcpIDogJChlbGVtKS5odG1sKE1hdGguZmxvb3IodGltZVJlYWQpICsgJyBtaW4gcmVhZCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5mYWN0b3J5KCdibG9nc1NlcnZpY2UnLCByZXF1aXJlKCcuL2Jsb2dzU2VydmljZScpKTtcblxuIl19
