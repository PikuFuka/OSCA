<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seniors', function (Blueprint $table) {
            $table->string('community_tax_number')->nullable()->after('national_id');
            $table->date('issued_on')->nullable()->after('community_tax_number');
            $table->string('issued_at')->nullable()->after('issued_on');
        });
    }

    public function down(): void
    {
        Schema::table('seniors', function (Blueprint $table) {
            $table->dropColumn(['community_tax_number', 'issued_on', 'issued_at']);
        });
    }
};
