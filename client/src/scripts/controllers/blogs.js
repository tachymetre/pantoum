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
