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
        'file_name',
        'mime_type',
        'file_size'
    ];

    /**
     * Default columns to select (excluding the heavy file_content)
     */
    public function scopeWithoutContent($query)
    {
        return $query->select(['id', 'senior_id', 'document_type', 'file_name', 'mime_type', 'file_size', 'created_at', 'updated_at']);
    }

    public function senior()
    {
        return $this->belongsTo(Senior::class);
    }
}
