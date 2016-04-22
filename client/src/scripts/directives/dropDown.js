'use strict';
module.exports = function($document) {
    return {
        restrict: 'A',
        scope: {
            'aim': '@'
        },
        link: (scope, elem, attrs) => {
            var dropdownWrapper = $('.pa-dropdown-wrapper'),
                nonTarget = dropdownWrapper.filter("[data-target!=" + scope.aim + "]"),
                target = dropdownWrapper.filter("[data-target=" + scope.aim + "]");
            $(elem).on('click', (e) => {
                nonTarget.removeClass('active');
                target.toggleClass('active');
                return false;
            });
            $document.on('click', (e) => {
                dropdownWrapper.removeClass('active');
            });
        }
    }
}
