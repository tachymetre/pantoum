'use strict';
module.exports = function(blogsService) {
    return {
        restrict: 'A',
        scope: {
            ngModel: '=',
            postIndex: '@'
        },
        controller: 'blogsController',
        controllerAs: 'blogs',
        link: (scope, elem, attrs, ctrl) => {
            var updateDirection;
            elem.bind('click', (e) => {
                // Update stylings for according icons
                elem.toggleClass('update-like');
                var starElement = elem.children();
                if ($(starElement[0]).attr("class").indexOf("o") > -1) {
                    $(starElement[0]).attr("class", "fa fa-star");
                    updateDirection = 'up';
                    // Update the like counts to reflect current state
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) + 1;
                    });
                } else {
                    $(starElement[0]).attr("class", "fa fa-star-o");
                    updateDirection = 'down';
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) - 1;
                    });
                }
                // Propagate the number of likes into database
                var blogId = scope.blogs.blogs[scope.postIndex].blog_id,
                    userId = JSON.parse(localStorage.getItem('user')).id;
                blogsService.updateBlogLike(blogId, scope.ngModel, userId, updateDirection);
            });
        }
    };
}
