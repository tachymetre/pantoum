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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9hcHAuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9hdXRoLmpzIiwic3JjL3NjcmlwdHMvY29udHJvbGxlcnMvYmxvZ3MuanMiLCJzcmMvc2NyaXB0cy9jb250cm9sbGVycy9pbmRleC5qcyIsInNyYy9zY3JpcHRzL2RpcmVjdGl2ZXMvaW5kZXguanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVBZ28uanMiLCJzcmMvc2NyaXB0cy9kaXJlY3RpdmVzL3RpbWVSZWFkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKlxuICogYXBwLmpzXG4gKiBJbmNsdWRpbmcgdmVuZG9yIGxpYnJhcmllcyAmIHRlbXBsYXRlIHNjcmlwdGluZyBmdW5jdGlvbnNcbiAqXG4gKiovXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbj0gICAgICAgICAgICBBUFAgQ09ORklHICAgICAgICAgICAgPVxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG4ndXNlIHN0cmljdCc7XG5cbi8vIENyZWF0ZSBhcHAgc2V0dGluZ3MgYW5kIHJvdXRpbmdcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZShcInBhbnRvdW1cIiwgWyd1aS5yb3V0ZXInLCAnc2F0ZWxsaXplcicsICdwZXJtaXNzaW9uJ10pO1xuYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkYXV0aFByb3ZpZGVyLCAkaW50ZXJwb2xhdGVQcm92aWRlcikge1xuICAgIFxuICAgIC8vIFNldCB1cCByb3V0ZSBmYWxsYmFjayBhbmQgYXV0aG9yaXplZCBBUElcbiAgICAkYXV0aFByb3ZpZGVyLmxvZ2luVXJsID0gJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlJztcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXV0aCcpO1xuXG4gICAgLy8gU2V0IHVwIGN1c3RvbSBleHByZXNzaW9ucyBmb3IgYmluZGluZyB0byBhdm9pZCBjb25mbGljdHMgd2l0aCBIYW5kbGViYXJzIFxuICAgICRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCd7W3snKTtcbiAgICAkaW50ZXJwb2xhdGVQcm92aWRlci5lbmRTeW1ib2woJ31dfScpO1xuXG4gICAgLy8gQ29uZmlndXJlIHJvdXRpbmcgc3RhdGVcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcbiAgICAgICAgdXJsOiAnL2F1dGgnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBwZXJtaXNzaW9uczoge1xuICAgICAgICAgICAgICAgIGV4Y2VwdDogWydpc0xvZ2dlZEluJ10sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbzogJ2Jsb2dzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2F1dGguaHRtbCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0F1dGhDdHJsIGFzIGF1dGgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KS5zdGF0ZSgnYmxvZ3MnLCB7XG4gICAgICAgIHVybDogJy9ibG9ncycsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiB7XG4gICAgICAgICAgICAgICAgZXhjZXB0OiBbJ2Fub255bW91cyddLFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG86ICdhdXRoJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2Jsb2dzQ29udGVudCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2Jsb2dzLmh0bWwnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdCbG9nc0N0cmwgYXMgYmxvZ3MnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG4vLyBFeGVjdXRlIGxvZ291dCBsb2dpY3MgYW5kIHBlcm1pc3Npb24gc2V0dGluZ3NcbmFwcC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlLCAkYXV0aCwgUGVybWlzc2lvblN0b3JlKSB7XG4gICAgJHJvb3RTY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJGF1dGgubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aCcpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgUGVybWlzc2lvblN0b3JlLmRlZmluZVBlcm1pc3Npb24oJ2lzTG9nZ2VkSW4nLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICAvLyBJZiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgKnRydXRoeSogdGhlbiB0aGUgdXNlciBoYXMgdGhlIHJvbGUsIG90aGVyd2lzZSB0aGV5IGRvbid0XG4gICAgICAgIGlmICgkYXV0aC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIFBlcm1pc3Npb25TdG9yZS5kZWZpbmVQZXJtaXNzaW9uKCdhbm9ueW1vdXMnLCBmdW5jdGlvbihzdGF0ZVBhcmFtcykge1xuICAgICAgICBpZiAoISRhdXRoLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59KTtcblxuLy8gUmVxdWlyZSBvdGhlciBjb21wb25lbnRzIHRvIGJlIGJ1bmRsZWQgdG9nZXRoZXJcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigkc2NvcGUsICRhdXRoLCAkc3RhdGUsICRodHRwKSB7XG4gICAgdmFyIHZtID0gdGhpcztcbiAgICB2bS5sb2dpbkVycm9yID0gZmFsc2U7XG4gICAgdm0ubG9naW5FcnJvclRleHQ7XG4gICAgdm0ubG9naW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNyZWRlbnRpYWxzID0ge1xuICAgICAgICAgICAgZW1haWw6IHZtLmVtYWlsLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IHZtLnBhc3N3b3JkXG4gICAgICAgIH07XG5cbiAgICAgICAgJGF1dGgubG9naW4oY3JlZGVudGlhbHMpLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkaHR0cC5nZXQoJ2h0dHA6Ly9wYW50b3VtLmRldi9hcGkvdjEvYXV0aGVudGljYXRlL3VzZXInKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1c2VyID0gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UudXNlcik7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgdXNlcik7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jdXJyZW50VXNlciA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYmxvZ3MnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICB2bS5sb2dpbkVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdm0ubG9naW5FcnJvclRleHQgPSBlcnJvci5kYXRhLmVycm9yO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh2bS5sb2dpbkVycm9yVGV4dCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgfVxufSIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJHNjb3BlLCAkYXV0aCwgJHEsICRodHRwLCAkc3RhdGUsICRyb290U2NvcGUpIHtcbiAgICB2YXIgdm0gPSB0aGlzO1xuICAgIHZtLmJsb2dzID0gW107XG4gICAgdm0uZXJyb3I7XG4gICAgdm0uYmxvZztcbiAgICB2bS5sYXN0cGFnZSA9IDE7XG5cbiAgICB2bS5pbml0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZtLmxhc3RwYWdlID0gMTtcbiAgICAgICAgJGh0dHAoe1xuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3BhbnRvdW0uZGV2L2FwaS92MS9ibG9ncycsXG4gICAgICAgICAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgICAgICAgICBwYXJhbXM6IHsgcGFnZTogdm0ubGFzdHBhZ2UgfVxuICAgICAgICB9KS5zdWNjZXNzKGZ1bmN0aW9uKGJsb2dzLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZykge1xuICAgICAgICAgICAgdm0uYmxvZ3MgPSBibG9ncy5kYXRhO1xuICAgICAgICAgICAgdm0uY3VycmVudHBhZ2UgPSBibG9ncy5jdXJyZW50X3BhZ2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2bS5pbml0KCk7XG5cbiAgICAvLyB2bS5hZGRKb2tlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRodHRwLnBvc3QoJ2h0dHA6Ly9vZGUuZGV2L2FwaS92MS9qb2tlcycsIHtcbiAgICAvLyAgICAgICAgIGJvZHk6IHZtLmpva2UsXG4gICAgLy8gICAgICAgICB1c2VyX2lkOiAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyLmlkXG4gICAgLy8gICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAvLyAgICAgICAgIHZtLmpva2VzLnVuc2hpZnQocmVzcG9uc2UuZGF0YSk7XG4gICAgLy8gICAgICAgICB2bS5qb2tlID0gJyc7XG4gICAgLy8gICAgIH0pLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBhZGRcIik7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH07XG5cbiAgICAvLyB2bS51cGRhdGVKb2tlID0gZnVuY3Rpb24oam9rZSkge1xuICAgIC8vICAgICAkaHR0cC5wdXQoJ2h0dHA6Ly9vZGUuZGV2L2FwaS92MS9qb2tlcy8nICsgam9rZS5qb2tlX2lkLCB7XG4gICAgLy8gICAgICAgICBib2R5OiBqb2tlLmpva2UsXG4gICAgLy8gICAgICAgICB1c2VyX2lkOiAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyLmlkXG4gICAgLy8gICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAvLyAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcImVycm9yIHVwZGF0ZVwiKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfTtcblxuICAgIC8vIHZtLmRlbGV0ZUpva2UgPSBmdW5jdGlvbihpbmRleCwgam9rZUlkKSB7XG4gICAgLy8gICAgICRodHRwLmRlbGV0ZSgnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzLycgKyBqb2tlSWQpXG4gICAgLy8gICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICB2bS5qb2tlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIC8vICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coXCJlcnJvciBkZWxldGVcIik7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyB9O1xuXG4gICAgLy8gdm0ubG9hZE1vcmUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdm0ubGFzdHBhZ2UgKz0gMTtcbiAgICAvLyAgICAgJGh0dHAoe1xuICAgIC8vICAgICAgICAgdXJsOiAnaHR0cDovL29kZS5kZXYvYXBpL3YxL2pva2VzJyxcbiAgICAvLyAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAvLyAgICAgICAgIHBhcmFtczogeyBwYWdlOiB2bS5sYXN0cGFnZSB9XG4gICAgLy8gICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oam9rZXMsIHN0YXR1cywgaGVhZGVycywgY29uZmlnKSB7XG4gICAgLy8gICAgICAgICB2bS5qb2tlcyA9IHZtLmpva2VzLmNvbmNhdChqb2tlcy5kYXRhKTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfTtcblxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gUmVxdWlyZSBjb21wb25lbnRzIGZvciBtb2R1bGFyaXphdGlvbiBwcm9jZXNzXG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ3BhbnRvdW0nKTtcbmFwcC5jb250cm9sbGVyKCdBdXRoQ3RybCcsIHJlcXVpcmUoJy4vYXV0aCcpKTtcbmFwcC5jb250cm9sbGVyKCdCbG9nc0N0cmwnLCByZXF1aXJlKCcuL2Jsb2dzJykpOyIsIid1c2Ugc3RyaWN0Jztcbi8vIFJlcXVpcmUgY29tcG9uZW50cyBmb3IgbW9kdWxhcml6YXRpb24gcHJvY2Vzc1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdwYW50b3VtJyk7XG5hcHAuZGlyZWN0aXZlKCd0aW1lQWdvJywgcmVxdWlyZSgnLi90aW1lQWdvJykpO1xuYXBwLmRpcmVjdGl2ZSgndGltZVJlYWQnLCByZXF1aXJlKCcuL3RpbWVSZWFkJykpO1xuXG4iLCIndXNlIHN0cmljdCc7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAnY3JlYXRlVGltZSc6ICc9J1xuICAgICAgICB9LFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbSwgYXR0cnMpIHtcbiAgICAgICAgXHR2YXIgcmVzdWx0ID0gJC50aW1lYWdvKHNjb3BlLmNyZWF0ZVRpbWUpO1xuICAgICAgICBcdCQoZWxlbSkuaHRtbChyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgICAgJ2Jsb2dDb250ZW50JzogJz0nXG4gICAgICAgIH0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtLCBhdHRycykge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRMZW5ndGggPSAoc2NvcGUuYmxvZ0NvbnRlbnQpLnNwbGl0KFwiIFwiKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYXZnd3BtID0gMzAwLFxuICAgICAgICAgICAgICAgIHRpbWVSZWFkID0gY29udGVudExlbmd0aCAvIGF2Z3dwbTtcbiAgICAgICAgICAgIHRpbWVSZWFkIDwgMSA/ICQoZWxlbSkuaHRtbChNYXRoLmZsb29yKHRpbWVSZWFkICogNjApICsgJyBzZWNvbmQgcmVhZCcpIDogJChlbGVtKS5odG1sKE1hdGguZmxvb3IodGltZVJlYWQpICsgJyBtaW4gcmVhZCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19
