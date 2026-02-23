<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('seniors', function (Blueprint $table) {
            DB::statement("ALTER TABLE seniors MODIFY COLUMN pension_status ENUM('Indigent', 'Pensioner', 'National Social Pensioner', 'Local Social Pensioner', 'None') DEFAULT 'Indigent'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seniors', function (Blueprint $table) {
            DB::statement("ALTER TABLE seniors MODIFY COLUMN pension_status ENUM('Indigent', 'Pensioner', 'National Social Pensioner', 'Local Social Pensioner') DEFAULT 'Indigent'");
        });
    }
};
