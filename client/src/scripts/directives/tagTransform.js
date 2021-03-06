'use strict';
module.exports = function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
        	tags: '@'
        },
        templateUrl: './partials/tagTransform.html',
        link: (scope, elem, attrs) => {
        	var tagArray = scope.tags.split(";");
        	var parent = elem.parent();

        	$.each(tagArray, function(i,v) {
        		elem.children().html(v);
        		parent.append(elem.clone());
        		elem.remove();
        	});
        }
    }
}
