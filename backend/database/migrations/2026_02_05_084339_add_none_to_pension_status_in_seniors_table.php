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
        // MySQL-only: ENUM modification. SQLite stores this as TEXT and
        // accepts any value, so there is nothing to change there.
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        Schema::table('seniors', function (Blueprint $table) {
            DB::statement("ALTER TABLE seniors MODIFY COLUMN pension_status ENUM('Indigent', 'Pensioner', 'National Social Pensioner', 'Local Social Pensioner', 'None') DEFAULT 'Indigent'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }
        Schema::table('seniors', function (Blueprint $table) {
            DB::statement("ALTER TABLE seniors MODIFY COLUMN pension_status ENUM('Indigent', 'Pensioner', 'National Social Pensioner', 'Local Social Pensioner') DEFAULT 'Indigent'");
        });
    }
};
