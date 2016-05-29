'use strict';
module.exports = function($stateParams, blogsService) {
    var vm = this;

    vm.init = (function() {
    	blogsService.getSingleBlog($stateParams.blogId).then(function(response) {
    		vm.blog = response.data.data;
    		console.log(vm.blog);
    	});
    })();
}
