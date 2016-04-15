'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'blogContent': '='
        },
        link: (scope, elem, attrs) => {
            var contentLength = (scope.blogContent).split(" ").length,
                avgwpm = 300,
                timeRead = contentLength / avgwpm;
            timeRead < 1 ? $(elem).html(Math.floor(timeRead * 60) + ' second read') : $(elem).html(Math.floor(timeRead) + ' min read');
        }
    }
}
