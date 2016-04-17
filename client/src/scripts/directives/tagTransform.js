'use strict';
module.exports = function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
        	tags: '@'
        },
        template: '<li class="pure-highlight-item">' +
        		  	'<a class="pure-highlight-link"></a>' + 
        		  '</li>',
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
