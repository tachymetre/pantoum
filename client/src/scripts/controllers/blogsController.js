'use strict';
module.exports = function(blogsService, $http) {
    var vm = this;
    vm.blogs = [];
    vm.lastPage = 1;

    vm.init = (function() {
        vm.lastPage = 1;
        $http({
            url: 'http://pantoum.dev/api/v1/blogs',
            method: "GET",
            params: { page: vm.lastPage }
        }).success(function(blogs, status, headers, config) {
            vm.blogs = blogs.data;
            vm.currentPage = blogs.current_page;
        });
    })();

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

    vm.getHighlightContent = (function() {
        $http({
            url: 'http://pantoum.dev/api/v1/highlights',
            method: "GET"
        }).success(function(highlights, status, headers, config) {
            vm.highlights = highlights.data;
        });
    })();
}
