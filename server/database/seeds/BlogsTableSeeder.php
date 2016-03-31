<?php

use App\Blog;
use Illuminate\Database\Seeder;

class BlogsTableSeeder extends Seeder {
	/**
     * Run the database seeds.
     *
     * @return void
     */
	public function run() {
		$faker = Faker\Factory::create();

		foreach (range(1, 30) as $index) {
			Blog::create([
				'body'    => $faker->paragraph($nbSentences = 3),
				'user_id' => $faker->numberBetween($min = 1, $max = 5),
			]);
		}
	}
}
