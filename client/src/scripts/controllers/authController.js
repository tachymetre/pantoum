'use strict';
module.exports = function($auth, authenticateService, $state, $log) {
    var vm = this;
    vm.loginError = false;
    vm.loginErrorText;
    vm.login = function() {
        var credentials = {
            email: vm.email,
            password: vm.password
        };
        $auth.login(credentials).then(function() {
            authenticateService.authenticateUser().then(function(response) {
                var userObj = response.data.user;
                localStorage.setItem('user', JSON.stringify(userObj));
                $state.go('blogs');
            }, function(error) {
                vm.loginError = true;
                vm.loginErrorText = error.data.error;
                $log.error(vm.loginErrorText);
            });
        });
    }
}
