'use strict';
module.exports = function($scope, $auth, $state, $http) {
    var vm = this;
    vm.loginError = false;
    vm.loginErrorText;
    vm.login = () => {
        var credentials = {
            email: vm.email,
            password: vm.password
        };

        $auth.login(credentials).then(() => {
            $http.get('http://pantoum.dev/api/v1/authenticate/user')
                .success((response) => {
                    var user = JSON.stringify(response.user);
                    localStorage.setItem('user', user);
                    $scope.currentUser = response.user;
                    $state.go('blogs');
                })
                .error((error) => {
                    vm.loginError = true;
                    vm.loginErrorText = error.data.error;
                    console.log(vm.loginErrorText);
                })
        });
    }
}