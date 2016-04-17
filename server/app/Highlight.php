<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Highlight extends Model
{
	/**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title', 'tag',
    ];

    public function blogs() {
		return $this->hasMany('App\Blog');
	}
}
