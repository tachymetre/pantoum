'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            ngModel: '='
        },
        controller: 'blogsController',
        controllerAs: 'blogs',
        link: (scope, elem, attrs, ctrl) => {
            elem.on('click', (e) => {
                // Update stylings for according icons
                elem.toggleClass('update-like');
                var starElement = elem.children();
                if ($(starElement[0]).attr("class").indexOf("o") > -1) {
                    $(starElement[0]).attr("class", "fa fa-star");
                    // Update the like counts to reflect current state  
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) + 1;
                    });
                } else {
                    $(starElement[0]).attr("class", "fa fa-star-o");
                    scope.$apply(function() {
                        scope.ngModel = parseInt(scope.ngModel) - 1;
                    });
                }
            });
        }
    }
}
