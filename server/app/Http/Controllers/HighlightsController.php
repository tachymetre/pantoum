<?php

namespace App\Http\Controllers;

use App\Blog;
use App\Highlight;
use Response;
use Illuminate\Http\Request;
use App\Http\Requests;

class HighlightsController extends Controller
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
        $limit = $request->input('limit') ? $request->input('limit') : 9;

        $highlights = Highlight::orderBy('id', 'DESC')->select('id', 'title', 'tag', 'created_at')->paginate($limit);

        $highlights->appends(array(
            'limit' => $limit
        ));

        return Response::json($this->transformCollection($highlights), 200);    
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

    }

    /**
     * Transform collection of highlights for better data encapsulation
     * @param int  $highlights 
     * @return \Illuminate\Http\Response
     */
    private function transformCollection($highlights) {
        $highlightsArray = $highlights->toArray();
        return [
            'total' => $highlightsArray['total'],
            'per_page' => intval($highlightsArray['per_page']),
            'current_page' => $highlightsArray['current_page'],
            'last_page' => $highlightsArray['last_page'],
            'next_page_url' => $highlightsArray['next_page_url'],
            'prev_page_url' => $highlightsArray['prev_page_url'],
            'from' => $highlightsArray['from'],
            'to' => $highlightsArray['to'],
            'data' => array_map([$this, 'transform'], $highlightsArray['data'])
        ];
    }

    /**
     * Transform a single highlight for better data encapsulation
     * @param int  $highlight 
     * @return \Illuminate\Http\Response
     */
    private function transform($highlight) {
        return [
            'highlight_id' => $highlight['id'],
            'highlight_title' => $highlight['title'],
            'highlight_tag' => $highlight['tag'],
            'highlight_created_at' => $highlight['created_at']
        ];
    }
}
