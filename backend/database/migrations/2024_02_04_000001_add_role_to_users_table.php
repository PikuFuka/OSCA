<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['Admin', 'Staff'])->default('Staff')->after('password');
            $table->string('barangay_assignment')->nullable()->after('role');
            $table->enum('status', ['Active', 'Inactive'])->default('Active')->after('barangay_assignment');
            $table->timestamp('last_active_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'barangay_assignment', 'status', 'last_active_at']);
        });
    }
};
