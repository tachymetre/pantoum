'use strict';
module.exports = function(blogsService, $http) {
    var vm = this,
        localUser = JSON.parse(localStorage.getItem('user'));
    vm.blogs = [];
    vm.lastPage = 1;

    vm.init = (function() {
        blogsService.getBlogContent(vm.lastPage).then(function(response) {
            vm.blogs = response.data.data;
            vm.currentPage = response.data.current_page;
        });
    })();

    vm.getBlogLikeActivity = (function() {
        blogsService.getBlogActivity(localUser.id, 'blog_like').then(function(response) {
            var userBlogLikesArray = [];
            response.data.data.forEach(function(value) {
                userBlogLikesArray.push(value.blog_like_id);
            });
            localStorage.setItem('blog_active', userBlogLikesArray);
        });
    })();

    vm.getUserProfile = (function() {
        vm.userProfileImage = localUser.profile_image;
    })();

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
