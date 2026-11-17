<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seniors', function (Blueprint $table) {
            // Keep the historical identifier after a deceased/deleted record
            // releases it, so reports can still show the member's old OSCA ID.
            $table->string('former_osca_id')->nullable()->after('osca_id');
        });

        Schema::create('osca_id_vacancies', function (Blueprint $table) {
            $table->id();
            $table->string('osca_id')->unique();
            $table->unsignedBigInteger('senior_id')->nullable()->index();
            $table->string('past_holder_name');
            $table->string('reason', 20);
            $table->timestamp('vacated_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('osca_id_vacancies');

        Schema::table('seniors', function (Blueprint $table) {
            $table->dropColumn('former_osca_id');
        });
    }
};
