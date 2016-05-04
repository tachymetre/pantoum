'use strict';
// Require components for modularization process
var app = angular.module('pantoum');
app.directive('timeAgo', require('./timeAgo'));
app.directive('timeRead', require('./timeRead'));
app.directive('scrollHide', require('./scrollHide'));
app.directive('dropDown', require('./dropDown'));
app.directive('updateLikes', require('./updateLikes'));
app.directive('showComments', require('./showComments'));
app.directive('tagTransform', require('./tagTransform'));
app.directive('loadMoreContent', require('./loadMoreContent'));


