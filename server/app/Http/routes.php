<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::group(['middleware' => ['web', 'cors'], 'prefix' => 'api/v1'], function () {
	// Authenticate routes
    Route::resource('authenticate', 'AuthenticateController', ['only' => ['index']]);
    Route::post('authenticate', 'AuthenticateController@authenticate');
    Route::get('authenticate/user', 'AuthenticateController@getAuthenticatedUser');

    // Blog routes
    Route::resource('blogs', 'BlogsController');
    Route::put('blogs/updateLike/{blogId}', 'BlogsController@updateLikeCount');

    // Highlight routes
    Route::resource('highlights', 'HighlightsController');
});
