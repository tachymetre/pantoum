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

    // vm.getUserProfile = function() {
    //     var obj = JSON.parse(localStorage.user);
    //     vm.hello = obj.profile_image;
    //     console.log(obj.profile_image);
    // }

    // vm.getUserProfile();

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoLmpzIiwic3JjL3NjcmlwdHMvY29udHJvbGxlcnMvYmxvZ3MuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVBZ28uanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVSZWFkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICpcbiAqIGFwcC5qc1xuICogSW5jbHVkaW5nIHZlbmRvciBsaWJyYXJpZXMgJiB0ZW1wbGF0ZSBzY3JpcHRpbmcgZnVuY3Rpb25zXG4gKlxuICoqL1xuLyo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG49ICAgICAgICAgICAgQVBQIENPTkZJRyAgICAgICAgICAgID1cbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0qL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBDcmVhdGUgYXBwIHNldHRpbmdzIGFuZCByb3V0aW5nXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoXCJwYW50b3VtXCIsIFsndWkucm91dGVyJywgJ3NhdGVsbGl6ZXInLCAncGVybWlzc2lvbiddKTtcbmFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGF1dGhQcm92aWRlciwgJGludGVycG9sYXRlUHJvdmlkZXIpIHtcbiAgICBcbiAgICAvLyBTZXQgdXAgcm91dGUgZmFsbGJhY2sgYW5kIGF1dGhvcml6ZWQgQVBJXG4gICAgJGF1dGhQcm92aWRlci5sb2dpblVybCA9ICdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2F1dGhlbnRpY2F0ZSc7XG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2F1dGgnKTtcblxuICAgIC8vIFNldCB1cCBjdXN0b20gZXhwcmVzc2lvbnMgZm9yIGJpbmRpbmcgdG8gYXZvaWQgY29uZmxpY3RzIHdpdGggSGFuZGxlYmFycyBcbiAgICAkaW50ZXJwb2xhdGVQcm92aWRlci5zdGFydFN5bWJvbCgne1t7Jyk7XG4gICAgJGludGVycG9sYXRlUHJvdmlkZXIuZW5kU3ltYm9sKCd9XX0nKTtcblxuICAgIC8vIENvbmZpZ3VyZSByb3V0aW5nIHN0YXRlXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgnLCB7XG4gICAgICAgIHVybDogJy9hdXRoJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGVybWlzc2lvbnM6IHtcbiAgICAgICAgICAgICAgICBleGNlcHQ6IFsnaXNMb2dnZWRJbiddLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICdibG9ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdibG9nc0NvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9hdXRoLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBdXRoQ3RybCBhcyBhdXRoJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSkuc3RhdGUoJ2Jsb2dzJywge1xuICAgICAgICB1cmw6ICcvYmxvZ3MnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgICAgIGV4Y2VwdDogWydhbm9ueW1vdXMnXSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvOiAnYXV0aCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdibG9nc0NvbnRlbnQnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9ibG9ncy5odG1sJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQmxvZ3NDdHJsIGFzIGJsb2dzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTtcblxuLy8gRXhlY3V0ZSBsb2dvdXQgbG9naWNzIGFuZCBwZXJtaXNzaW9uIHNldHRpbmdzXG5hcHAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSwgJGF1dGgsIFBlcm1pc3Npb25TdG9yZSkge1xuICAgICRyb290U2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRhdXRoLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdpc0xvZ2dlZEluJywgZnVuY3Rpb24oc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgLy8gSWYgdGhlIHJldHVybmVkIHZhbHVlIGlzICp0cnV0aHkqIHRoZW4gdGhlIHVzZXIgaGFzIHRoZSByb2xlLCBvdGhlcndpc2UgdGhleSBkb24ndFxuICAgICAgICBpZiAoJGF1dGguaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgICBQZXJtaXNzaW9uU3RvcmUuZGVmaW5lUGVybWlzc2lvbignYW5vbnltb3VzJywgZnVuY3Rpb24oc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgaWYgKCEkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufSk7XG5cbi8vIFJlcXVpcmUgb3RoZXIgY29tcG9uZW50cyB0byBiZSBidW5kbGVkIHRvZ2V0aGVyXG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMnKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHN0YXRlLCAkaHR0cCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0ubG9naW5FcnJvciA9IGZhbHNlO1xuICAgIHZtLmxvZ2luRXJyb3JUZXh0O1xuICAgIHZtLmxvZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgIGVtYWlsOiB2bS5lbWFpbCxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB2bS5wYXNzd29yZFxuICAgICAgICB9O1xuXG4gICAgICAgICRhdXRoLmxvZ2luKGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2F1dGhlbnRpY2F0ZS91c2VyJylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlciA9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Jsb2dzJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZtLmxvZ2luRXJyb3JUZXh0ID0gZXJyb3IuZGF0YS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codm0ubG9naW5FcnJvclRleHQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGF1dGgsICRxLCAkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2bS5ibG9ncyA9IFtdO1xuICAgIHZtLmVycm9yO1xuICAgIHZtLmJsb2c7XG4gICAgdm0ubGFzdFBhZ2UgPSAxO1xuXG4gICAgdm0uaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2bS5sYXN0UGFnZSA9IDE7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYmxvZ3MnLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RQYWdlIH1cbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihibG9ncywgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIHZtLmJsb2dzID0gYmxvZ3MuZGF0YTtcbiAgICAgICAgICAgIHZtLmN1cnJlbnRQYWdlID0gYmxvZ3MuY3VycmVudF9wYWdlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdm0uaW5pdCgpO1xuXG4gICAgLy8gdm0uZ2V0VXNlclByb2ZpbGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLnVzZXIpO1xuICAgIC8vICAgICB2bS5oZWxsbyA9IG9iai5wcm9maWxlX2ltYWdlO1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhvYmoucHJvZmlsZV9pbWFnZSk7XG4gICAgLy8gfVxuXG4gICAgLy8gdm0uZ2V0VXNlclByb2ZpbGUoKTtcblxuICAgIC8vIHZtLmFkZEpva2UgPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGh0dHAucG9zdCgnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzJywge1xuICAgIC8vICAgICAgICAgYm9keTogdm0uam9rZSxcbiAgICAvLyAgICAgICAgIHVzZXJfaWQ6ICRyb290U2NvcGUuY3VycmVudFVzZXIuaWRcbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIC8vICAgICAgICAgdm0uam9rZXMudW5zaGlmdChyZXNwb25zZS5kYXRhKTtcbiAgICAvLyAgICAgICAgIHZtLmpva2UgPSAnJztcbiAgICAvLyAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIGFkZFwiKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfTtcblxuICAgIC8vIHZtLnVwZGF0ZUpva2UgPSBmdW5jdGlvbihqb2tlKSB7XG4gICAgLy8gICAgICRodHRwLnB1dCgnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzLycgKyBqb2tlLmpva2VfaWQsIHtcbiAgICAvLyAgICAgICAgIGJvZHk6IGpva2Uuam9rZSxcbiAgICAvLyAgICAgICAgIHVzZXJfaWQ6ICRyb290U2NvcGUuY3VycmVudFVzZXIuaWRcbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgIC8vICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgdXBkYXRlXCIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9O1xuXG4gICAgLy8gdm0uZGVsZXRlSm9rZSA9IGZ1bmN0aW9uKGluZGV4LCBqb2tlSWQpIHtcbiAgICAvLyAgICAgJGh0dHAuZGVsZXRlKCdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMvJyArIGpva2VJZClcbiAgICAvLyAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIHZtLmpva2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgLy8gICAgICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIGRlbGV0ZVwiKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vIH07XG5cbiAgICAvLyB2bS5sb2FkTW9yZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2bS5sYXN0cGFnZSArPSAxO1xuICAgIC8vICAgICAkaHR0cCh7XG4gICAgLy8gICAgICAgICB1cmw6ICdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMnLFxuICAgIC8vICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIC8vICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RwYWdlIH1cbiAgICAvLyAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihqb2tlcywgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAvLyAgICAgICAgIHZtLmpva2VzID0gdm0uam9rZXMuY29uY2F0KGpva2VzLmRhdGEpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9O1xuXG59XG4iLCIndXNlIHN0cmljdCc7XG4vLyBSZXF1aXJlIGNvbXBvbmVudHMgZm9yIG1vZHVsYXJpemF0aW9uIHByb2Nlc3NcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgncGFudG91bScpO1xuYXBwLmNvbnRyb2xsZXIoJ0F1dGhDdHJsJywgcmVxdWlyZSgnLi9hdXRoJykpO1xuYXBwLmNvbnRyb2xsZXIoJ0Jsb2dzQ3RybCcsIHJlcXVpcmUoJy4vYmxvZ3MnKSk7IiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5kaXJlY3RpdmUoJ3RpbWVBZ28nLCByZXF1aXJlKCcuL3RpbWVBZ28nKSk7XG5hcHAuZGlyZWN0aXZlKCd0aW1lUmVhZCcsIHJlcXVpcmUoJy4vdGltZVJlYWQnKSk7XG5cbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAgICdjcmVhdGVUaW1lJzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtLCBhdHRycykge1xuICAgICAgICBcdHZhciByZXN1bHQgPSAkLnRpbWVhZ28oc2NvcGUuY3JlYXRlVGltZSk7XG4gICAgICAgIFx0JChlbGVtKS5odG1sKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnYmxvZ0NvbnRlbnQnOiAnPSdcbiAgICAgICAgfSxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHJzKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudExlbmd0aCA9IChzY29wZS5ibG9nQ29udGVudCkuc3BsaXQoXCIgXCIpLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBhdmd3cG0gPSAzMDAsXG4gICAgICAgICAgICAgICAgdGltZVJlYWQgPSBjb250ZW50TGVuZ3RoIC8gYXZnd3BtO1xuICAgICAgICAgICAgdGltZVJlYWQgPCAxID8gJChlbGVtKS5odG1sKE1hdGguZmxvb3IodGltZVJlYWQgKiA2MCkgKyAnIHNlY29uZCByZWFkJykgOiAkKGVsZW0pLmh0bWwoTWF0aC5mbG9vcih0aW1lUmVhZCkgKyAnIG1pbiByZWFkJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=
