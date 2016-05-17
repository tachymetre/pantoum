'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.factory('authenticateService', require('./authenticateService'));
app.factory('blogsService', require('./blogsService'));

