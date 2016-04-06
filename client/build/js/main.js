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

},{"./controllers":4}],2:[function(require,module,exports){
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
    vm.lastpage = 1;

    vm.init = function() {
        vm.lastpage = 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastpage }
        }).success(function(blogs, status, headers, config) {
            vm.blogs = blogs.data;
            vm.currentpage = blogs.current_page;
        });
    };

    vm.init();

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
},{"./auth":2,"./blogs":3}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoLmpzIiwic3JjL3NjcmlwdHMvY29udHJvbGxlcnMvYmxvZ3MuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKlxuICogYXBwLmpzXG4gKiBJbmNsdWRpbmcgdmVuZG9yIGxpYnJhcmllcyAmIHRlbXBsYXRlIHNjcmlwdGluZyBmdW5jdGlvbnNcbiAqXG4gKiovXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbj0gICAgICAgICAgICBBUFAgQ09ORklHICAgICAgICAgICAgPVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4ndXNlIHN0cmljdCc7XG5cbi8vIENyZWF0ZSBhcHAgc2V0dGluZ3MgYW5kIHJvdXRpbmdcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZShcInBhbnRvdW1cIiwgWyd1aS5yb3V0ZXInLCAnc2F0ZWxsaXplcicsICdwZXJtaXNzaW9uJ10pO1xuYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkYXV0aFByb3ZpZGVyLCAkaW50ZXJwb2xhdGVQcm92aWRlcikge1xuICAgIFxuICAgIC8vIFNldCB1cCByb3V0ZSBmYWxsYmFjayBhbmQgYXV0aG9yaXplZCBBUElcbiAgICAkYXV0aFByb3ZpZGVyLmxvZ2luVXJsID0gJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlJztcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXV0aCcpO1xuXG4gICAgLy8gU2V0IHVwIGN1c3RvbSBleHByZXNzaW9ucyBmb3IgYmluZGluZyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBIYW5kbGViYXJzIFxuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCd7W3snKTtcbiAgICAkaW50ZXJwb2xhdGVQcm92aWRlci5lbmRTeW1ib2woJ31dfScpO1xuXG4gICAgLy8gQ29uZmlndXJlIHJvdXRpbmcgc3RhdGVcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcbiAgICAgICAgdXJsOiAnL2F1dGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgICAgIGV4Y2VwdDogWydpc0xvZ2dlZEluJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2Jsb2dzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2F1dGguaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0F1dGhDdHJsIGFzIGF1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KS5zdGF0ZSgnYmxvZ3MnLCB7XG4gICAgICAgIHVybDogJy9ibG9ncycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2Fub255bW91cyddLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICdhdXRoJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Jsb2dzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCbG9nc0N0cmwgYXMgYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG4vLyBFeGVjdXRlIGxvZ291dCBsb2dpY3MgYW5kIHBlcm1pc3Npb24gc2V0dGluZ3NcbmFwcC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlLCAkYXV0aCwgUGVybWlzc2lvblN0b3JlKSB7XG4gICAgJHJvb3RTY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJGF1dGgubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aCcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgUGVybWlzc2lvblN0b3JlLmRlZmluZVBlcm1pc3Npb24oJ2lzTG9nZ2VkSW4nLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICAvLyBJZiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgKnRydXRoeSogdGhlbiB0aGUgdXNlciBoYXMgdGhlIHJvbGUsIG90aGVyd2lzZSB0aGV5IGRvbid0XG4gICAgICAgIGlmICgkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdhbm9ueW1vdXMnLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICBpZiAoISRhdXRoLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59KTtcblxuLy8gUmVxdWlyZSBvdGhlciBjb21wb25lbnRzIHRvIGJlIGJ1bmRsZWQgdG9nZXRoZXJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbiIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHN0YXRlLCAkaHR0cCkge1xuICAgIHZhciB2bSA9IHRoaXM7XG4gICAgdm0ubG9naW5FcnJvciA9IGZhbHNlO1xuICAgIHZtLmxvZ2luRXJyb3JUZXh0O1xuICAgIHZtLmxvZ2luID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgIGVtYWlsOiB2bS5lbWFpbCxcbiAgICAgICAgICAgIHBhc3N3b3JkOiB2bS5wYXNzd29yZFxuICAgICAgICB9O1xuXG4gICAgICAgICRhdXRoLmxvZ2luKGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJGh0dHAuZ2V0KCdodHRwOi8vcGFudG91bS5kZXYvYXBpL3YxL2F1dGhlbnRpY2F0ZS91c2VyJylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlciA9IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpO1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Jsb2dzJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvciA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZtLmxvZ2luRXJyb3JUZXh0ID0gZXJyb3IuZGF0YS5lcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codm0ubG9naW5FcnJvclRleHQpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCRzY29wZSwgJGF1dGgsICRxLCAkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2bS5ibG9ncyA9IFtdO1xuICAgIHZtLmVycm9yO1xuICAgIHZtLmJsb2c7XG4gICAgdm0ubGFzdHBhZ2UgPSAxO1xuXG4gICAgdm0uaW5pdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2bS5sYXN0cGFnZSA9IDE7XG4gICAgICAgICRodHRwKHtcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYmxvZ3MnLFxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgcGFyYW1zOiB7IHBhZ2U6IHZtLmxhc3RwYWdlIH1cbiAgICAgICAgfSkuc3VjY2VzcyhmdW5jdGlvbihibG9ncywgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpIHtcbiAgICAgICAgICAgIHZtLmJsb2dzID0gYmxvZ3MuZGF0YTtcbiAgICAgICAgICAgIHZtLmN1cnJlbnRwYWdlID0gYmxvZ3MuY3VycmVudF9wYWdlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdm0uaW5pdCgpO1xuXG4gICAgLy8gdm0uYWRkSm9rZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkaHR0cC5wb3N0KCdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMnLCB7XG4gICAgLy8gICAgICAgICBib2R5OiB2bS5qb2tlLFxuICAgIC8vICAgICAgICAgdXNlcl9pZDogJHJvb3RTY29wZS5jdXJyZW50VXNlci5pZFxuICAgIC8vICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgLy8gICAgICAgICB2bS5qb2tlcy51bnNoaWZ0KHJlc3BvbnNlLmRhdGEpO1xuICAgIC8vICAgICAgICAgdm0uam9rZSA9ICcnO1xuICAgIC8vICAgICB9KS5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgYWRkXCIpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9O1xuXG4gICAgLy8gdm0udXBkYXRlSm9rZSA9IGZ1bmN0aW9uKGpva2UpIHtcbiAgICAvLyAgICAgJGh0dHAucHV0KCdodHRwOi8vb2RlLmRldi9hcGkvdjEvam9rZXMvJyArIGpva2Uuam9rZV9pZCwge1xuICAgIC8vICAgICAgICAgYm9keTogam9rZS5qb2tlLFxuICAgIC8vICAgICAgICAgdXNlcl9pZDogJHJvb3RTY29wZS5jdXJyZW50VXNlci5pZFxuICAgIC8vICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgLy8gICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciB1cGRhdGVcIik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH07XG5cbiAgICAvLyB2bS5kZWxldGVKb2tlID0gZnVuY3Rpb24oaW5kZXgsIGpva2VJZCkge1xuICAgIC8vICAgICAkaHR0cC5kZWxldGUoJ2h0dHA6Ly9vZGUuZGV2L2FwaS92MS9qb2tlcy8nICsgam9rZUlkKVxuICAgIC8vICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgdm0uam9rZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAvLyAgICAgICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgZGVsZXRlXCIpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gfTtcblxuICAgIC8vIHZtLmxvYWRNb3JlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHZtLmxhc3RwYWdlICs9IDE7XG4gICAgLy8gICAgICRodHRwKHtcbiAgICAvLyAgICAgICAgIHVybDogJ2h0dHA6Ly9vZGUuZGV2L2FwaS92MS9qb2tlcycsXG4gICAgLy8gICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgLy8gICAgICAgICBwYXJhbXM6IHsgcGFnZTogdm0ubGFzdHBhZ2UgfVxuICAgIC8vICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGpva2VzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgIC8vICAgICAgICAgdm0uam9rZXMgPSB2bS5qb2tlcy5jb25jYXQoam9rZXMuZGF0YSk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH07XG5cbn1cbiIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuY29udHJvbGxlcignQXV0aEN0cmwnLCByZXF1aXJlKCcuL2F1dGgnKSk7XG5hcHAuY29udHJvbGxlcignQmxvZ3NDdHJsJywgcmVxdWlyZSgnLi9ibG9ncycpKTsiXX0=
