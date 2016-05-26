'use strict';
module.exports = function(blogsService) {
    return {
        restrict: 'A',
        scope: {
            ngModel: '=',
            postIndex: '@'
        },
        link: (scope, elem, attrs) => {
            var starElement = elem.children();
            var updateDirection;

            // Update the stylings if visited
            if (JSON.parse(localStorage.getItem('blog_active')).indexOf(attrs.blogIndex) > -1) {
                elem.addClass('update-like');
                $(starElement[0]).attr("class", "fa fa-star");
            }

            // Propagate the click count with appropriate action(s)
            elem.bind('click', (e) => {
                var blogId = attrs.blogIndex,
                    userId = JSON.parse(localStorage.getItem('user')).id,
                    localBlogActive = JSON.parse(localStorage.getItem('blog_active')) || [];

                // Update stylings for according icons
                elem.toggleClass('update-like');
                if ($(starElement[0]).attr("class").indexOf("o") > -1) {
                    $(starElement[0]).attr("class", "fa fa-star");
                    updateDirection = 'up';
                    // Update the like counts to reflect current state
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) + 1;
                    });
                    localBlogActive.push(blogId)
                    localStorage.setItem('blog_active', JSON.stringify(localBlogActive));
                } else {
                    $(starElement[0]).attr("class", "fa fa-star-o");
                    updateDirection = 'down';
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) - 1;
                    });
                    var removeItemIndex = localBlogActive.indexOf(blogId);
                    if (removeItemIndex > -1) {
                        localBlogActive.splice(removeItemIndex, 1);
                        localStorage.setItem('blog_active', JSON.stringify(localBlogActive));
                    }
                }
                // Propagate the number of likes into database
                blogsService.updateBlogLike(blogId, scope.ngModel, userId, updateDirection);
            });
        }
    };
}
