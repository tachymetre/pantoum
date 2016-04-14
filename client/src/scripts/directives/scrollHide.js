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
            });

            setInterval(function() {
                if (didScroll) {
                    hasScrolled();
                    didScroll = false;
                }
            }, 250);

            function hasScrolled() {
                var windowTop = $(window).scrollTop();
                if (Math.abs(lastScrollTop - windowTop) <= delta)
                    return;
                if (windowTop > lastScrollTop && windowTop > navbarHeight) {
                    $(elem).removeClass('menu-show').addClass('menu-hide');
                } else {
                    if (windowTop + $(window).height() < $(document).height()) {
                        $(elem).removeClass('menu-hide').addClass('menu-show');
                    }
                }
                lastScrollTop = windowTop;
            }
        }
    }
}
