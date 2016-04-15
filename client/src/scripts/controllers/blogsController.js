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
