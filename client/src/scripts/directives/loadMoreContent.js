'use strict';
module.exports = function($document) {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            var shouldLoad = false;
            $(window).scroll(function() {
                if (!shouldLoad && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
                    shouldLoad = true;
                    console.log("Should load more contents");
                    shouldLoad = false;
                }
            });
        }
    }
}
