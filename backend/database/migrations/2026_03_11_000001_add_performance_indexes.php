<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! $this->indexExists('seniors', 'seniors_status_barangay_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['status', 'barangay']);
            });
        }

        if (! $this->indexExists('seniors', 'seniors_status_created_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['status', 'created_at']);
            });
        }

        if (! $this->indexExists('seniors', 'seniors_age_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('age');
            });
        }

        if (Schema::hasColumn('seniors', 'deleted_at') && ! $this->indexExists('seniors', 'seniors_deleted_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('deleted_at');
            });
        }

        if (! $this->indexExists('requests', 'requests_status_created_at_index')) {
            Schema::table('requests', function (Blueprint $table) {
                $table->index(['status', 'created_at']);
            });
        }

        if (! $this->indexExists('requests', 'requests_senior_id_status_index')) {
            Schema::table('requests', function (Blueprint $table) {
                $table->index(['senior_id', 'status']);
            });
        }

        if (! $this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index('created_at');
            });
        }

        if (! $this->indexExists('activity_logs', 'activity_logs_action_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index(['action', 'created_at']);
            });
        }

        if (! $this->indexExists('activity_logs', 'activity_logs_user_id_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        if ($this->indexExists('seniors', 'seniors_status_barangay_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_status_barangay_index');
            });
        }

        if ($this->indexExists('seniors', 'seniors_status_created_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_status_created_at_index');
            });
        }

        if ($this->indexExists('seniors', 'seniors_age_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_age_index');
            });
        }

        if ($this->indexExists('seniors', 'seniors_deleted_at_index')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->dropIndex('seniors_deleted_at_index');
            });
        }

        if ($this->indexExists('requests', 'requests_status_created_at_index')) {
            Schema::table('requests', function (Blueprint $table) {
                $table->dropIndex('requests_status_created_at_index');
            });
        }

        if ($this->indexExists('requests', 'requests_senior_id_status_index')) {
            Schema::table('requests', function (Blueprint $table) {
                $table->dropIndex('requests_senior_id_status_index');
            });
        }

        if ($this->indexExists('activity_logs', 'activity_logs_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropIndex('activity_logs_created_at_index');
            });
        }

        if ($this->indexExists('activity_logs', 'activity_logs_action_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropIndex('activity_logs_action_created_at_index');
            });
        }

        if ($this->indexExists('activity_logs', 'activity_logs_user_id_created_at_index')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->dropIndex('activity_logs_user_id_created_at_index');
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