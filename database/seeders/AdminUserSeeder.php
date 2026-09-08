<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed default admin/organizer user if not already present.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@kameti.com'],
            [
                'name' => 'Committee Admin',
                'phone' => '9999999999',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );
    }
}
