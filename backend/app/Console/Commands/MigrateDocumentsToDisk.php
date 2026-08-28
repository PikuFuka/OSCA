<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SeniorDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigrateDocumentsToDisk extends Command
{
    protected $signature = 'documents:migrate-to-disk
                            {--dry-run : Show what would be migrated without writing files}
                            {--force : Bypass confirmation}';

    protected $description = 'Migrate senior_documents.file_content LONGBLOB to filesystem storage/app/documents';

    public function handle(): int
    {
        $isDryRun = (bool) $this->option('dry-run');
        $query = SeniorDocument::query()
            ->whereNotNull('file_content')
            ->where(function ($q) {
                $q->whereNull('file_path')->orWhere('file_path', '');
            });

        $total = (clone $query)->count();
        if ($total === 0) {
            $this->info('No documents need migration (file_path already set or file_content empty).');
            return self::SUCCESS;
        }

        $this->info(($isDryRun ? '[DRY-RUN] ' : '') . "Found {$total} document(s) to migrate.");

        if (!$isDryRun && !$this->option('force') && !$this->confirm("Migrate {$total} document(s) to storage/app/documents?")) {
            $this->warn('Aborted.');
            return self::FAILURE;
        }

        $migrated = 0;
        $skipped = 0;
        $failed = 0;

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        // Use cursor to avoid loading all LONGBLOBs into memory at once
        foreach ($query->cursor() as $doc) {
            $bar->advance();
            try {
                $binary = $doc->file_content;
                if ($binary === null || $binary === '') {
                    $skipped++;
                    continue;
                }

                // Preserve original extension if present
                $safeName = Str::slug(pathinfo($doc->file_name, PATHINFO_FILENAME)) ?: 'document';
                $ext = pathinfo($doc->file_name, PATHINFO_EXTENSION);
                if ($ext === '' || strlen($ext) > 10) {
                    // Fallback from mime_type
                    $ext = match ($doc->mime_type) {
                        'image/jpeg' => 'jpg',
                        'image/png' => 'png',
                        'application/pdf' => 'pdf',
                        default => $ext ?: 'bin',
                    };
                }

                $fileName = $safeName . ($ext ? ".{$ext}" : '');
                $relativePath = "documents/{$doc->senior_id}/{$doc->id}_{$fileName}";

                if ($isDryRun) {
                    $migrated++;
                    continue;
                }

                // Write atomically via Storage (local disk root storage/app/private)
                Storage::disk('local')->put($relativePath, $binary);

                // Verify sha1
                $written = Storage::disk('local')->get($relativePath);
                if (sha1($written) !== sha1($binary)) {
                    $this->error(" SHA1 mismatch for doc {$doc->id}");
                    $failed++;
                    continue;
                }

                $doc->update(['file_path' => $relativePath]);
                $migrated++;
            } catch (\Throwable $e) {
                $this->error(" Failed doc {$doc->id}: " . $e->getMessage());
                $failed++;
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Done. Migrated: {$migrated}, Skipped: {$skipped}, Failed: {$failed}" . ($isDryRun ? ' (dry-run, no files written)' : ''));
        $this->warn('file_content kept for rollback. Drop in next release after verification: ALTER TABLE senior_documents DROP COLUMN file_content');

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
