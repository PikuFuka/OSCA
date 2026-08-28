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
        if (!Schema::hasColumn('senior_documents', 'file_path')) {
            Schema::table('senior_documents', function (Blueprint $table) {
                $table->string('file_path')->nullable()->after('file_content');
            });
        }

        // Make file_content nullable for rollback phase (keep column one release)
        try {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE senior_documents MODIFY file_content LONGBLOB NULL');
        } catch (\Throwable $e) {
            // Column already nullable or DB not reachable in offline baseline — ignore
        }

        // Deduplicate before adding unique constraint (keep latest id per senior_id+type)
        try {
            $dupes = \Illuminate\Support\Facades\DB::select("
                SELECT senior_id, document_type, MAX(id) as keep_id
                FROM senior_documents
                GROUP BY senior_id, document_type
                HAVING COUNT(*) > 1
            ");
            foreach ($dupes as $dupe) {
                \Illuminate\Support\Facades\DB::delete(
                    'DELETE FROM senior_documents WHERE senior_id = ? AND document_type = ? AND id != ?',
                    [$dupe->senior_id, $dupe->document_type, $dupe->keep_id]
                );
            }
        } catch (\Throwable $e) {
            // No duplicates or table not yet migrated — ignore
        }

        // Add unique if not exists
        try {
            $exists = \Illuminate\Support\Facades\DB::selectOne("
                SELECT 1 FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = 'senior_documents' AND index_name = 'senior_documents_senior_type_unique'
            ");
            if (!$exists) {
                Schema::table('senior_documents', function (Blueprint $table) {
                    $table->unique(['senior_id', 'document_type'], 'senior_documents_senior_type_unique');
                });
            }
        } catch (\Throwable $e) {
            // Offline or privilege issue — skip
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            Schema::table('senior_documents', function (Blueprint $table) {
                if (Schema::hasColumn('senior_documents', 'file_path')) {
                    // Drop unique if exists
                    try {
                        $table->dropUnique('senior_documents_senior_type_unique');
                    } catch (\Throwable $e) {}
                    $table->dropColumn('file_path');
                }
            });
        } catch (\Throwable $e) {}

        try {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE senior_documents MODIFY file_content LONGBLOB NOT NULL');
        } catch (\Throwable $e) {}
    }
};
