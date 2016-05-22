'use strict';
module.exports = function($http) {
    return {
        getBlogContent: function(lastPage) {
            var promise = $http({
                method: 'GET',
                url: 'http://pantoum.dev/api/v1/blogs',
                params: { page: lastPage }
            });
            return promise;
        },
        getHighlightContent: function() {
            var promise = $http({
                method: 'GET',
                url: 'http://pantoum.dev/api/v1/highlights'
            });
            return promise;
        },
        loadMoreContent: function(lastPage) {
            var promise = $http({
                method: 'GET',
                url: 'http://pantoum.dev/api/v1/blogs',
                params: { page: lastPage }
            });
            return promise;
        },
        updateBlogLike: function(blogId, updateLikeCount, userId, direction) {
            var promise = $http({
                method: 'PUT',
                url: 'http://pantoum.dev/api/v1/blogs/updateLike/' + blogId,
                params: {
                    like_count: updateLikeCount,
                    user_id: userId,
                    direction: direction
                }
            });
            return promise;
        }
    };
}
