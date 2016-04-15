'use strict';
module.exports = function() {
    return {
        restrict: 'A',
        scope: {
            'createTime': '='
        },
        link: (scope, elem, attrs) => {
        	var result = $.timeago(scope.createTime);
        	$(elem).html(result);
        }
    }
}
