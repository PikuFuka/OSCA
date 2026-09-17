<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SeniorDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'senior_id',
        'document_type',
        'file_content',
        'file_path',
        'file_name',
        'mime_type',
        'file_size'
    ];

    /**
     * Default columns to select (excluding the heavy file_content)
     */
    public function scopeWithoutContent($query)
    {
        return $query->select(['id', 'senior_id', 'document_type', 'file_path', 'file_name', 'mime_type', 'file_size', 'created_at', 'updated_at']);
    }

    /**
     * Get file binary, preferring filesystem (file_path) with DB fallback for rollback period.
     */
    public function getFileBinary(): ?string
    {
        if ($this->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($this->file_path)) {
            return \Illuminate\Support\Facades\Storage::disk('local')->get($this->file_path);
        }
        return $this->file_content ?: null;
    }

    /**
     * Cheap existence check (no file bytes loaded) for 404 decisions.
     * file_content is '' (not null) for disk-backed rows on every driver.
     */
    public function hasFile(): bool
    {
        if ($this->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($this->file_path)) {
            return true;
        }
        return !empty($this->file_content);
    }

    protected static function booted(): void
    {
        static::deleting(function (self $doc) {
            if ($doc->file_path) {
                try {
                    \Illuminate\Support\Facades\Storage::disk('local')->delete($doc->file_path);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning("Failed to delete document file {$doc->file_path}: " . $e->getMessage());
                }
            }
        });
    }

    public function senior()
    {
        return $this->belongsTo(\App\Models\Senior::class);
    }
}
