<?php

namespace Database\Seeders;

use App\Models\Senior;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;

class SeniorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('en_PH');
        
        $barangays = [
            'Anibong',
            'Biñan',
            'Buboy',
            'Cabanbanan',
            'Calusiche',
            'Dingin',
            'Lambac',
            'Layugan',
            'Magdapio',
            'Maulawin',
            'Pinagsanjan',
            'Poblacion I (Barangay I)',
            'Poblacion II (Barangay II)',
            'Sabang',
            'Sampaloc',
            'San Isidro'
        ];

        $sequence = 1;
        
        // Get existing max ID to continue sequence if needed
        $maxId = Senior::whereRaw('LENGTH(osca_id) = 4')->max('osca_id');
        if ($maxId) {
            $sequence = (int)$maxId + 1;
        }

        foreach ($barangays as $barangay) {
            for ($i = 0; $i < 50; $i++) {
                $gender = $faker->randomElement(['Male', 'Female']);
                $firstName = $gender === 'Male' ? $faker->firstNameMale : $faker->firstNameFemale;
                $lastName = $faker->lastName;
                $dob = $faker->date('Y-m-d', '1964-01-01'); // Senior citizens (60+)
                $age = \Carbon\Carbon::parse($dob)->age;

                Senior::create([
                    'osca_id' => str_pad($sequence++, 4, '0', STR_PAD_LEFT),
                    'first_name' => $firstName,
                    'middle_name' => $faker->lastName,
                    'last_name' => $lastName,
                    'extension_name' => $faker->randomElement([null, null, null, 'Jr.', 'Sr.', 'III']),
                    'date_of_birth' => $dob,
                    'age' => $age,
                    'place_of_birth' => $faker->city . ', ' . $faker->province,
                    'sex' => $gender,
                    'mothers_maiden_name' => $faker->lastName . ', ' . $faker->firstNameFemale,
                    'pension_status' => $faker->randomElement([
                        'Indigent', 
                        'Pensioner', 
                        'National Social Pensioner', 
                        'Local Social Pensioner'
                    ]),
                    'barangay' => $barangay,
                    'street_address' => $faker->streetAddress,
                    'contact_number' => $faker->numerify('09#########'),
                    'emergency_name' => $faker->name,
                    'emergency_contact' => $faker->numerify('09#########'),
                    'rrn' => $faker->numerify('##############'),
                    'national_id' => $faker->numerify('####-####-####-####'),
                    'status' => 'Active', // Bulk populated are usually active
                    'password' => Hash::make('password123'),
                ]);
            }
        }
    }
}
