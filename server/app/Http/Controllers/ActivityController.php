<?php

namespace App\Http\Controllers;

use App\Activity;
use Response;
use Illuminate\Http\Request;
use App\Http\Requests;

class ActivityController extends Controller
{
    public function __construct() {
        $this->middleware('jwt.auth');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        if (!$request->user_id or !$request->activity) {
            return Response::json([
                'error' => [
                    'message' => 'Please provide user_id and activity fields'
                ]
            ], 422);
        }

        $activities = Activity::ofType($request->user_id, $request->activity)->get();

        return Response::json($this->transformCollection($activities), 200);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    /**
     * Transform collection of activities for better data encapsulation
     * @param int  $activities
     * @return \Illuminate\Http\Response
     */
    private function transformCollection($activities) {
        $activitiesArray = $activities->toArray();
        // return $activitiesArray;
        return [
            'data' => array_map([$this, 'transform'], $activitiesArray)
        ];
    }

    /**
     * Transform a single activity for better data encapsulation
     * @param int  $activity
     * @return \Illuminate\Http\Response
     */
    private function transform($activity) {
        return [
            'blog_like_id' => $activity['blog_id']
        ];
    }
}
