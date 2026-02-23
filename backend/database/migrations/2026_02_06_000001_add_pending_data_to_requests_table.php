<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->json('pending_data')->nullable()->after('status');
        });

        // Expand the type ENUM to include 'Information Update' if not present
        DB::statement("ALTER TABLE requests MODIFY COLUMN type ENUM('New Application', 'Information Update') DEFAULT 'New Application'");
    }

    public function down(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->dropColumn('pending_data');
        });
    }
};
