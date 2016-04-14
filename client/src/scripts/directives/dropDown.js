'use strict';
module.exports = function($document) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            $(elem).on('click', function(e) {
                $('.pa-dropdown-wrapper').toggleClass('active');
                return false;
            });
            $document.on('click', function() {
            	$('.pa-dropdown-wrapper').removeClass('active');
            });
        }
    }
}
