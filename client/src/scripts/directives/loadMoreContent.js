'use strict';
module.exports = function($document) {
    return {
        restrict: 'E',
        link: function(scope, elem, attrs) {
            var lastScroll = 0;
            $(window).scroll(function(e) {
                var st = $(this).scrollTop();
                console.log(st);
                if (st > lastScroll && st >= $(document).height() - $(window).height() - 100) {
                    console.log("Fire");
                    scope.$apply(attrs.initLoad);
                }
                lastScroll = st;
            });
        }
    }
}
