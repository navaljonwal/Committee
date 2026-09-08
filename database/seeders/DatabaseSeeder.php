<?php

namespace Database\Seeders;

use App\Models\Committee;
use App\Models\Member;
use Illuminate\Database\Seeder;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Always ensure Admin / Organizer user exists
        $this->call(AdminUserSeeder::class);

        // 2. Only seed sample test data in local environment or if specifically requested
        if (app()->environment('local') || env('SEED_SAMPLE_DATA', false)) {
            $this->call(SampleDataSeeder::class);
        }
    }
}

