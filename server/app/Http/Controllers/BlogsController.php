<?php

namespace App\Http\Controllers;

use App\Blog;
use App\User;
use Response;
use Illuminate\Http\Request;
use App\Http\Requests;

class BlogsController extends Controller
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
        $search_term = $request->input('search');
        $limit = $request->input('limit') ? $request->input('limit') : 5;

        if($search_term) {
            $blogs = Blog::orderBy('id', 'DESC')->where('body', 'LIKE', "%$search_term%")->with(array('User' => function($query) {
                $query->select('id', 'name', 'profile_image');
            }))->select('id', 'title', 'body', 'created_at', 'user_id')->paginate($limit);

            $blogs->appends(array(
                'search' => $search_term,
                'limit' => $limit
            ));
        } else {
             $blogs = Blog::orderBy('id', 'DESC')->with(array('User' => function($query) {
                $query->select('id', 'name', 'profile_image');
            }))->select('id', 'title', 'body', 'created_at', 'user_id')->paginate($limit);

            $blogs->appends(array(
                'limit' => $limit
            ));
        }

        return Response::json($this->transformCollection($blogs), 200);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if(!$request->title or !$request->body or !$request->user_id) {
            return Response::json([
                'error' => [
                    'message' => 'Please provide title, body, and user_id fields'
                ]
            ], 422);
        }

        $blog = Blog::create($request->all());

        return Response::json([
            'message' => 'Blog is created successfully',
            'data' => $this->transform($blog)
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $blog = Blog::with(array('User' => function($query) {
            $query->select('id', 'name', 'profile_image');
        }))->find($id);
        if(!$blog) {
            return Response::json([
                'error' => [
                    'message' => 'Blog does not exist'
                ]
            ], 404);
        }

        // Get the previous blog id
        $previous = Blog::where('id', '<', $blog->id)->max('id');
        // Get the next blog id
        $next = Blog::where('id', '>', $blog->id)->min('id');

        return Response::json([
            'previous_blog_id' => $previous,
            'next_blog_id' => $next, 
            'data' => $this->transform($blog)
        ], 200);
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
        if(!$request->title or !$request->body or !$request->user_id) {
            return Response::json([
                'error' => [
                    'message' => 'Please provide title, body, and user_id fields'
                ]
            ], 422);
        }

        $blog = Blog::find($id);
        $blog->title = $request->title;
        $blog->body = $request->body;
        $blog->user_id = $request->user_id;
        $blog->save();

        return Response::json([
            'message' => 'Blog is updated successfully'
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        Blog::destroy($id);
    }

    /**
     * Transform collection of blogs for better data encapsulation
     * @param int  $blogs 
     * @return \Illuminate\Http\Response
     */
    private function transformCollection($blogs) {
        $blogsArray = $blogs->toArray();
        return [
            'total' => $blogsArray['total'],
            'per_page' => intval($blogsArray['per_page']),
            'current_page' => $blogsArray['current_page'],
            'last_page' => $blogsArray['last_page'],
            'next_page_url' => $blogsArray['next_page_url'],
            'prev_page_url' => $blogsArray['prev_page_url'],
            'from' => $blogsArray['from'],
            'to' => $blogsArray['to'],
            'data' => array_map([$this, 'transform'], $blogsArray['data'])
        ];
    }

    /**
     * Transform a single blog for better data encapsulation
     * @param int  $blog 
     * @return \Illuminate\Http\Response
     */
    private function transform($blog) {
        return [
            'blog_id' => $blog['id'],
            'blog_title' => $blog['title'],
            'blog' => $blog['body'],
            'blog_created_at' => $blog['created_at'],
            'submitted_by' => $blog['user']['name'],
            'represented_by' => $blog['user']['profile_image']
        ];
    }
}
