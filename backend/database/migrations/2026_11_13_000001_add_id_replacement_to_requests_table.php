<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('requests', function (Blueprint $table) {
            $table->string('reason')->nullable()->after('status');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE requests MODIFY COLUMN type ENUM('New Application', 'Information Update', 'ID Replacement') DEFAULT 'New Application'");
        } else {
            // SQLite stores enums as varchar with a CHECK constraint. Rebuild the
            // column as a plain string so the new request type is accepted.
            Schema::table('requests', function (Blueprint $table) {
                $table->string('type')->default('New Application')->change();
            });
        }
    }

    public function down(): void
    {
        DB::table('requests')->where('type', 'ID Replacement')->update(['type' => 'Information Update']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE requests MODIFY COLUMN type ENUM('New Application', 'Information Update') DEFAULT 'New Application'");
        } else {
            Schema::table('requests', function (Blueprint $table) {
                $table->enum('type', ['New Application', 'Information Update'])->default('New Application')->change();
            });
        }

        Schema::table('requests', function (Blueprint $table) {
            $table->dropColumn('reason');
        });
    }
};
