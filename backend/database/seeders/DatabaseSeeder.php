<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default admin user — passwords sourced from .env (never hardcoded)
        User::create([
            'name' => 'Main Administrator',
            'email' => env('ADMIN_EMAIL', 'admin@osca.gov.ph'),
            'password' => Hash::make(env('ADMIN_PASSWORD', 'admin123')),
            'role' => 'Admin',
            'barangay_assignment' => 'Municipal Hall',
            'status' => 'Active',
            'force_password_change' => true,
        ]);

        // Create a staff user for testing — passwords sourced from .env
        User::create([
            'name' => 'Staff User',
            'email' => env('STAFF_EMAIL', 'staff@osca.gov.ph'),
            'password' => Hash::make(env('STAFF_PASSWORD', 'staff123')),
            'role' => 'Staff',
            'barangay_assignment' => 'Poblacion I (Barangay I)',
            'status' => 'Active',
            'force_password_change' => true,
        ]);

        // Seed Senior Citizens
        $this->call(LargeSeniorSeeder::class);
    }
}
