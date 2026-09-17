<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Monotonic change counters polled by the realtime SSE stream.
     *
     * Timestamps cannot serve as the change signal (1-second resolution
     * misses same-second writes); an atomically-incremented sequence can.
     * One row per feed name (currently only 'seniors').
     */
    public function up(): void
    {
        Schema::create('realtime_state', function (Blueprint $table) {
            $table->string('name')->primary();
            $table->unsignedBigInteger('seq')->default(0);
        });

        DB::table('realtime_state')->insert(['name' => 'seniors', 'seq' => 0]);
    }

    public function down(): void
    {
        Schema::dropIfExists('realtime_state');
    }
};
