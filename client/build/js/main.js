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
                controller: 'AuthCtrl as auth'
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
                controller: 'BlogsCtrl as blogs'
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

},{"./controllers":4,"./directives":5}],2:[function(require,module,exports){
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

    // vm.addJoke = function() {
    //     $http.post('http://ode.dev/api/v1/jokes', {
    //         body: vm.joke,
    //         user_id: $rootScope.currentUser.id
    //     }).success(function(response) {
    //         vm.jokes.unshift(response.data);
    //         vm.joke = '';
    //     }).error(function() {
    //         console.log("error add");
    //     });
    // };

    // vm.updateJoke = function(joke) {
    //     $http.put('http://ode.dev/api/v1/jokes/' + joke.joke_id, {
    //         body: joke.joke,
    //         user_id: $rootScope.currentUser.id
    //     }).success(function(response) {
    //         console.log(response);
    //     }).error(function() {
    //         console.log("error update");
    //     });
    // };

    // vm.deleteJoke = function(index, jokeId) {
    //     $http.delete('http://ode.dev/api/v1/jokes/' + jokeId)
    //         .success(function() {
    //             vm.jokes.splice(index, 1);
    //         }).error(function() {
    //             console.log("error delete");
    //         });
    // };

    // vm.loadMore = function() {
    //     vm.lastpage += 1;
    //     $http({
    //         url: 'http://ode.dev/api/v1/jokes',
    //         method: "GET",
    //         params: { page: vm.lastpage }
    //     }).success(function(jokes, status, headers, config) {
    //         vm.jokes = vm.jokes.concat(jokes.data);
    //     });
    // };

}

},{}],4:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.controller('AuthCtrl', require('./auth'));
app.controller('BlogsCtrl', require('./blogs'));
},{"./auth":2,"./blogs":3}],5:[function(require,module,exports){
'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.directive('timeAgo', require('./timeAgo'));
app.directive('timeRead', require('./timeRead'));


},{"./timeAgo":6,"./timeRead":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoLmpzIiwic3JjL3NjcmlwdHMvY29udHJvbGxlcnMvYmxvZ3MuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVBZ28uanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVSZWFkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqXG4gKiBhcHAuanNcbiAqIEluY2x1ZGluZyB2ZW5kb3IgbGlicmFyaWVzICYgdGVtcGxhdGUgc2NyaXB0aW5nIGZ1bmN0aW9uc1xuICpcbiAqKi9cbi8qPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuPSAgICAgICAgICAgIEFQUCBDT05GSUcgICAgICAgICAgICA9XG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09Ki9cbid1c2Ugc3RyaWN0JztcblxuLy8gQ3JlYXRlIGFwcCBzZXR0aW5ncyBhbmQgcm91dGluZ1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKFwicGFudG91bVwiLCBbJ3VpLnJvdXRlcicsICdzYXRlbGxpemVyJywgJ3Blcm1pc3Npb24nXSk7XG5hcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRhdXRoUHJvdmlkZXIsICRpbnRlcnBvbGF0ZVByb3ZpZGVyKSB7XG4gICAgXG4gICAgLy8gU2V0IHVwIHJvdXRlIGZhbGxiYWNrIGFuZCBhdXRob3JpemVkIEFQSVxuICAgICRhdXRoUHJvdmlkZXIubG9naW5VcmwgPSAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9hdXRoZW50aWNhdGUnO1xuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9hdXRoJyk7XG5cbiAgICAvLyBTZXQgdXAgY3VzdG9tIGV4cHJlc3Npb25zIGZvciBiaW5kaW5nIHRvIGF2b2lkIGNvbmZsaWN0cyB3aXRoIEhhbmRsZWJhcnMgXG4gICAgJGludGVycG9sYXRlUHJvdmlkZXIuc3RhcnRTeW1ib2woJ3tbeycpO1xuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnfV19Jyk7XG5cbiAgICAvLyBDb25maWd1cmUgcm91dGluZyBzdGF0ZVxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoJywge1xuICAgICAgICB1cmw6ICcvYXV0aCcsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2lzTG9nZ2VkSW4nXSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYXV0aC5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQXV0aEN0cmwgYXMgYXV0aCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pLnN0YXRlKCdibG9ncycsIHtcbiAgICAgICAgdXJsOiAnL2Jsb2dzJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgICAgICAgICBleGNlcHQ6IFsnYW5vbnltb3VzJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2F1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnYmxvZ3NDb250ZW50Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvYmxvZ3MuaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0Jsb2dzQ3RybCBhcyBibG9ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8vIEV4ZWN1dGUgbG9nb3V0IGxvZ2ljcyBhbmQgcGVybWlzc2lvbiBzZXR0aW5nc1xuYXBwLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGUsICRhdXRoLCBQZXJtaXNzaW9uU3RvcmUpIHtcbiAgICAkcm9vdFNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkYXV0aC5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICBQZXJtaXNzaW9uU3RvcmUuZGVmaW5lUGVybWlzc2lvbignaXNMb2dnZWRJbicsIGZ1bmN0aW9uKHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIC8vIElmIHRoZSByZXR1cm5lZCB2YWx1ZSBpcyAqdHJ1dGh5KiB0aGVuIHRoZSB1c2VyIGhhcyB0aGUgcm9sZSwgb3RoZXJ3aXNlIHRoZXkgZG9uJ3RcbiAgICAgICAgaWYgKCRhdXRoLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gICAgUGVybWlzc2lvblN0b3JlLmRlZmluZVBlcm1pc3Npb24oJ2Fub255bW91cycsIGZ1bmN0aW9uKHN0YXRlUGFyYW1zKSB7XG4gICAgICAgIGlmICghJGF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbn0pO1xuXG4vLyBSZXF1aXJlIG90aGVyIGNvbXBvbmVudHMgdG8gYmUgYnVuZGxlZCB0b2dldGhlclxucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJyk7XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGF1dGgsICRzdGF0ZSwgJGh0dHApIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZtLmxvZ2luRXJyb3IgPSBmYWxzZTtcbiAgICB2bS5sb2dpbkVycm9yVGV4dDtcbiAgICB2bS5sb2dpbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3JlZGVudGlhbHMgPSB7XG4gICAgICAgICAgICBlbWFpbDogdm0uZW1haWwsXG4gICAgICAgICAgICBwYXNzd29yZDogdm0ucGFzc3dvcmRcbiAgICAgICAgfTtcblxuICAgICAgICAkYXV0aC5sb2dpbihjcmVkZW50aWFscykudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICRodHRwLmdldCgnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9hdXRoZW50aWNhdGUvdXNlcicpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXIgPSBKU09OLnN0cmluZ2lmeShyZXNwb25zZS51c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCB1c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRVc2VyID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdibG9ncycpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHZtLmxvZ2luRXJyb3IgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB2bS5sb2dpbkVycm9yVGV4dCA9IGVycm9yLmRhdGEuZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHZtLmxvZ2luRXJyb3JUZXh0KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG59IiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsICRhdXRoLCAkcSwgJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0uYmxvZ3MgPSBbXTtcbiAgICB2bS5lcnJvcjtcbiAgICB2bS5ibG9nO1xuICAgIHZtLmxhc3RQYWdlID0gMTtcblxuICAgIHZtLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdm0ubGFzdFBhZ2UgPSAxO1xuICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2Jsb2dzJyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0UGFnZSB9XG4gICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oYmxvZ3MsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgICAgICAgICB2bS5ibG9ncyA9IGJsb2dzLmRhdGE7XG4gICAgICAgICAgICB2bS5jdXJyZW50UGFnZSA9IGJsb2dzLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZtLmluaXQoKTtcblxuICAgIHZtLmdldFVzZXJQcm9maWxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS51c2VyKS5wcm9maWxlX2ltYWdlO1xuICAgIH1cblxuICAgIC8vIHZtLmFkZEpva2UgPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGh0dHAucG9zdCgnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzJywge1xuICAgIC8vICAgICAgICAgYm9keTogdm0uam9rZSxcbiAgICAvLyAgICAgICAgIHVzZXJfaWQ6ICRyb290U2NvcGUuY3VycmVudFVzZXIuaWRcbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIC8vICAgICAgICAgdm0uam9rZXMudW5zaGlmdChyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgICAgIHZtLmpva2UgPSAnJztcbiAgICAvLyAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIGFkZFwiKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfTtcblxuICAgIC8vIHZtLnVwZGF0ZUpva2UgPSBmdW5jdGlvbihqb2tlKSB7XG4gICAgLy8gICAgICRodHRwLnB1dCgnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzLycgKyBqb2tlLmpva2VfaWQsIHtcbiAgICAvLyAgICAgICAgIGJvZHk6IGpva2Uuam9rZSxcbiAgICAvLyAgICAgICAgIHVzZXJfaWQ6ICRyb290U2NvcGUuY3VycmVudFVzZXIuaWRcbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIC8vICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgdXBkYXRlXCIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9O1xuXG4gICAgLy8gdm0uZGVsZXRlSm9rZSA9IGZ1bmN0aW9uKGluZGV4LCBqb2tlSWQpIHtcbiAgICAvLyAgICAgJGh0dHAuZGVsZXRlKCdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMvJyArIGpva2VJZClcbiAgICAvLyAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIHZtLmpva2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgLy8gICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIGRlbGV0ZVwiKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vIH07XG5cbiAgICAvLyB2bS5sb2FkTW9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2bS5sYXN0cGFnZSArPSAxO1xuICAgIC8vICAgICAkaHR0cCh7XG4gICAgLy8gICAgICAgICB1cmw6ICdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMnLFxuICAgIC8vICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIC8vICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RwYWdlIH1cbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihqb2tlcywgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAvLyAgICAgICAgIHZtLmpva2VzID0gdm0uam9rZXMuY29uY2F0KGpva2VzLmRhdGEpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9O1xuXG59XG4iLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmNvbnRyb2xsZXIoJ0F1dGhDdHJsJywgcmVxdWlyZSgnLi9hdXRoJykpO1xuYXBwLmNvbnRyb2xsZXIoJ0Jsb2dzQ3RybCcsIHJlcXVpcmUoJy4vYmxvZ3MnKSk7IiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5kaXJlY3RpdmUoJ3RpbWVBZ28nLCByZXF1aXJlKCcuL3RpbWVBZ28nKSk7XG5hcHAuZGlyZWN0aXZlKCd0aW1lUmVhZCcsIHJlcXVpcmUoJy4vdGltZVJlYWQnKSk7XG5cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdjcmVhdGVUaW1lJzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtLCBhdHRycykge1xuICAgICAgICBcdHZhciByZXN1bHQgPSAkLnRpbWVhZ28oc2NvcGUuY3JlYXRlVGltZSk7XG4gICAgICAgIFx0JChlbGVtKS5odG1sKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnYmxvZ0NvbnRlbnQnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHJzKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExlbmd0aCA9IChzY29wZS5ibG9nQ29udGVudCkuc3BsaXQoXCIgXCIpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBhdmd3cG0gPSAzMDAsXG4gICAgICAgICAgICAgICAgdGltZVJlYWQgPSBjb250ZW50TGVuZ3RoIC8gYXZnd3BtO1xuICAgICAgICAgICAgdGltZVJlYWQgPCAxID8gJChlbGVtKS5odG1sKE1hdGguZmxvb3IodGltZVJlYWQgKiA2MCkgKyAnIHNlY29uZCByZWFkJykgOiAkKGVsZW0pLmh0bWwoTWF0aC5mbG9vcih0aW1lUmVhZCkgKyAnIG1pbiByZWFkJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
