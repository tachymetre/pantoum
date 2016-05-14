'use strict';
module.exports = function(blogsService, $http) {
    var vm = this;
    vm.blogs = [];
    vm.lastPage = 1;

    vm.init = (function() {
        blogsService.getBlogContent(vm.lastPage).then(function(response) {
            vm.blogs = response.data.data;
            vm.currentPage = response.data.current_page;
        });
    })();

    vm.getUserProfile = function() {
        return JSON.parse(localStorage.user).profile_image;
    }

    vm.getHighlightContent = (function() {
        blogsService.getHighlightContent().then(function(response) {
            vm.highlights = response.data.data;
        });
    })();
    
    vm.loadMoreContent = function() {
        vm.lastPage += 1;
        blogsService.loadMoreContent(vm.lastPage).then(function(response) {
            vm.blogs = vm.blogs.concat(response.data.data);
        });
    }
}
