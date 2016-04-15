'use strict';
module.exports = function($document) {
    return {
        restrict: 'A',
        link: (scope, elem, attrs) => {
            $(elem).on('click', (e) => {
                $('.pa-dropdown-wrapper').toggleClass('active');
                return false;
            });
            $document.on('click', () => {
            	$('.pa-dropdown-wrapper').removeClass('active');
            });
        }
    }
}
