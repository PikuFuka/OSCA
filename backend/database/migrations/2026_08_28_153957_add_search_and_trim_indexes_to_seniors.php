<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Generated column for trimmed osca_id to avoid TRIM() in WHERE (enables index use)
        if (!Schema::hasColumn('seniors', 'osca_id_trim')) {
            try {
                \Illuminate\Support\Facades\DB::statement("
                    ALTER TABLE seniors
                    ADD COLUMN osca_id_trim VARCHAR(255) GENERATED ALWAYS AS (NULLIF(TRIM(osca_id), '')) VIRTUAL
                ");
            } catch (\Throwable $e) {
                // Fallback if generated column not supported — add regular column and backfill via trigger-like update
                if (!Schema::hasColumn('seniors', 'osca_id_trim')) {
                    Schema::table('seniors', function (Blueprint $table) {
                        $table->string('osca_id_trim')->nullable()->after('osca_id');
                    });
                    \Illuminate\Support\Facades\DB::statement("UPDATE seniors SET osca_id_trim = NULLIF(TRIM(osca_id), '') WHERE osca_id_trim IS NULL");
                }
            }
        }

        // Index on generated/regular trim column + composite for valid scope
        $this->addIndexIfMissing('seniors', 'seniors_osca_id_trim_index', function () {
            \Illuminate\Support\Facades\DB::statement('CREATE INDEX seniors_osca_id_trim_index ON seniors (osca_id_trim)');
        });

        // FULLTEXT for name search (InnoDB supports it since 5.6)
        $this->addIndexIfMissing('seniors', 'seniors_ft_name', function () {
            \Illuminate\Support\Facades\DB::statement('CREATE FULLTEXT INDEX seniors_ft_name ON seniors (first_name, middle_name, last_name)');
        });

        // Covering index for index() sort + filter (status included, sorting by last_name)
        $this->addIndexIfMissing('seniors', 'seniors_last_name_first_name_created_at_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['last_name', 'first_name', 'created_at'], 'seniors_last_name_first_name_created_at_index');
            });
        });

        // Ensure existing critical indexes exist (idempotent)
        $this->addIndexIfMissing('seniors', 'seniors_status_barangay_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['status', 'barangay'], 'seniors_status_barangay_index');
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try { \Illuminate\Support\Facades\DB::statement('DROP INDEX seniors_ft_name ON seniors'); } catch (\Throwable $e) {}
        try { \Illuminate\Support\Facades\DB::statement('DROP INDEX seniors_osca_id_trim_index ON seniors'); } catch (\Throwable $e) {}
        try {
            Schema::table('seniors', function (Blueprint $table) {
                if (Schema::hasColumn('seniors', 'osca_id_trim')) {
                    $table->dropColumn('osca_id_trim');
                }
                // Drop covering if exists
                try { $table->dropIndex('seniors_last_name_first_name_created_at_index'); } catch (\Throwable $e) {}
            });
        } catch (\Throwable $e) {}
    }

    private function addIndexIfMissing(string $table, string $index, callable $creator): void
    {
        try {
            $exists = \Illuminate\Support\Facades\DB::selectOne(
                "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1",
                [$table, $index]
            );
            if (!$exists) {
                $creator();
            }
        } catch (\Throwable $e) {
            // Offline or privilege — skip silently, will be created when DB online
        }
    }
};
