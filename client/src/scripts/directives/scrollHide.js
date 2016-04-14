'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            var didScroll;
            var lastScrollTop = 0;
            var delta = 5;
            var navbarHeight = $(elem).outerHeight();

            $(window).scroll(function(e) {
                didScroll = true;
                if (didScroll) {
                    hasScrolled();
                }
                didScroll = false;
            });

            // setInterval(function() {
            //     if (didScroll) {
            //         hasScrolled();
            //         didScroll = false;
            //     }
            // }, 250);

            function hasScrolled() {
                var st = $(window).scrollTop();
                if (Math.abs(lastScrollTop - st) <= delta)
                    return;
                if (st > lastScrollTop && st > navbarHeight) {

                    $(elem).removeClass('menu-show').addClass('menu-hide');
                } else {
                    if (st + $(window).height() < $(document).height()) {
                        $(elem).removeClass('menu-hide').addClass('menu-show');
                    }
                }
                lastScrollTop = st;
            }
        }
    }
}
