'use strict';
module.exports = function($http) {
    return {
        authenticateUser: function() {
            var promise = $http({
                method: 'GET',
                url: 'http://pantoum.dev/api/v1/authenticate/user'
            });
            return promise;
        }
    };
}
