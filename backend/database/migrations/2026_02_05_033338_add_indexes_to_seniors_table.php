<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! $this->indexExists('seniors', 'seniors_status_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('status');
            });
        }

        if (! $this->indexExists('seniors', 'seniors_last_name_first_name_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['last_name', 'first_name']);
            });
        }

        if (! $this->indexExists('seniors', 'seniors_created_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->indexExists('seniors', 'seniors_status_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_status_index');
            });
        }

        if ($this->indexExists('seniors', 'seniors_last_name_first_name_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_last_name_first_name_index');
            });
        }

        if ($this->indexExists('seniors', 'seniors_created_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_created_at_index');
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::raw('DATABASE()'))
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();
    }
};
