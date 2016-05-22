<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
    	'user_id',
    	'activity',
        'value'
    ];

    protected $except = ['api/*'];

    public function scopeThatSatisfy($query, $userId, $blogId, $activity) {
        return $query->where(['user_id' => $userId, 'blog_id' => $blogId, 'activity' => $activity]);
    }
}
