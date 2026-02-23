<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seniors', function (Blueprint $table) {
            $table->id();
            $table->string('osca_id')->unique()->nullable();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('extension_name')->nullable();
            $table->date('date_of_birth');
            $table->integer('age');
            $table->string('place_of_birth')->nullable();
            $table->enum('sex', ['Male', 'Female']);
            $table->string('mothers_maiden_name')->nullable();
            
            $table->enum('pension_status', [
                'Indigent', 
                'Pensioner', 
                'National Social Pensioner', 
                'Local Social Pensioner'
            ])->default('Indigent');

            $table->string('barangay')->index();
            $table->text('street_address');
            $table->string('contact_number')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_contact')->nullable();

            $table->string('rrn')->nullable();
            $table->string('national_id')->nullable();
            $table->string('profile_photo_path')->nullable();
            $table->json('id_config')->nullable();
            $table->enum('status', ['Active', 'Pending', 'Deceased', 'Inactive'])->default('Pending');
            $table->string('password')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('seniors');
    }
};
