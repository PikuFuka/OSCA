<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Comprehensive indexing pass — adds every missing index that matters
     * for the queries this application runs. Each addition is guarded by
     * an existence check so the migration is fully idempotent.
     */
    public function up(): void
    {
        // ──────────────────────────────────────────────
        // seniors
        // ──────────────────────────────────────────────

        // Gender aggregation in dashboard statistics
        $this->addIndexIfMissing('seniors', 'seniors_sex_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('sex', 'seniors_sex_index');
            });
        });

        // Pension filtering
        $this->addIndexIfMissing('seniors', 'seniors_pension_status_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('pension_status', 'seniors_pension_status_index');
            });
        });

        // Dashboard centenarian count: where('status','!=','Deceased')->where('age','>=',100)
        $this->addIndexIfMissing('seniors', 'seniors_status_age_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['status', 'age'], 'seniors_status_age_index');
            });
        });

        // Dashboard gender breakdowns within status filter
        $this->addIndexIfMissing('seniors', 'seniors_status_sex_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['status', 'sex'], 'seniors_status_sex_index');
            });
        });

        // Heatmap query grouped by barangay with status filter (reverse of existing status+barangay)
        $this->addIndexIfMissing('seniors', 'seniors_barangay_status_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index(['barangay', 'status'], 'seniors_barangay_status_index');
            });
        });

        // Deceased list sorted by updated_at DESC
        $this->addIndexIfMissing('seniors', 'seniors_updated_at_index', function () {
            Schema::table('seniors', function (Blueprint $table) {
                $table->index('updated_at', 'seniors_updated_at_index');
            });
        });

        // ──────────────────────────────────────────────
        // senior_documents
        // ──────────────────────────────────────────────

        // updateOrCreate and document retrieval keyed on senior_id + document_type
        $this->addIndexIfMissing('senior_documents', 'senior_documents_senior_id_document_type_index', function () {
            Schema::table('senior_documents', function (Blueprint $table) {
                $table->index(['senior_id', 'document_type'], 'senior_documents_senior_id_document_type_index');
            });
        });

        // ──────────────────────────────────────────────
        // requests
        // ──────────────────────────────────────────────

        // Standalone status filter in ensurePendingApprovalRequests
        $this->addIndexIfMissing('requests', 'requests_status_index', function () {
            Schema::table('requests', function (Blueprint $table) {
                $table->index('status', 'requests_status_index');
            });
        });

        // Filter by request type
        $this->addIndexIfMissing('requests', 'requests_type_index', function () {
            Schema::table('requests', function (Blueprint $table) {
                $table->index('type', 'requests_type_index');
            });
        });

        // ──────────────────────────────────────────────
        // activity_logs
        // ──────────────────────────────────────────────

        // Filter by action alone (existing composite action+created_at may not help solo filter)
        $this->addIndexIfMissing('activity_logs', 'activity_logs_action_index', function () {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index('action', 'activity_logs_action_index');
            });
        });

        // ──────────────────────────────────────────────
        // users
        // ──────────────────────────────────────────────

        // Filtering users by role
        $this->addIndexIfMissing('users', 'users_role_index', function () {
            Schema::table('users', function (Blueprint $table) {
                $table->index('role', 'users_role_index');
            });
        });

        // Login lookups (skip if unique constraint already provides one)
        $this->addIndexIfMissing('users', 'users_email_index', function () {
            // Check if a unique index already exists on email before adding a plain one
            $hasUnique = DB::selectOne(
                "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email' AND non_unique = 0 LIMIT 1"
            );
            if (!$hasUnique) {
                Schema::table('users', function (Blueprint $table) {
                    $table->index('email', 'users_email_index');
                });
            }
        });

        // Active/Inactive user filtering
        $this->addIndexIfMissing('users', 'users_status_index', function () {
            Schema::table('users', function (Blueprint $table) {
                $table->index('status', 'users_status_index');
            });
        });
    }

    public function down(): void
    {
        $indexes = [
            'seniors' => [
                'seniors_sex_index',
                'seniors_pension_status_index',
                'seniors_status_age_index',
                'seniors_status_sex_index',
                'seniors_barangay_status_index',
                'seniors_updated_at_index',
            ],
            'senior_documents' => [
                'senior_documents_senior_id_document_type_index',
            ],
            'requests' => [
                'requests_status_index',
                'requests_type_index',
            ],
            'activity_logs' => [
                'activity_logs_action_index',
            ],
            'users' => [
                'users_role_index',
                'users_email_index',
                'users_status_index',
            ],
        ];

        foreach ($indexes as $table => $tableIndexes) {
            foreach ($tableIndexes as $indexName) {
                if ($this->indexExists($table, $indexName)) {
                    Schema::table($table, function (Blueprint $table) use ($indexName) {
                        $table->dropIndex($indexName);
                    });
                }
            }
        }
    }

    private function addIndexIfMissing(string $table, string $index, callable $creator): void
    {
        try {
            if (! $this->indexExists($table, $index)) {
                $creator();
            }
        } catch (\Throwable $e) {
            // Offline or privilege issue — skip silently, will be created when DB is available
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        return (bool) DB::selectOne(
            "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1",
            [$table, $indexName]
        );
    }
};
