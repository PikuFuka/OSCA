<?php

namespace App\Services\Senior;

use App\Models\SeniorDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    /**
     * Stores file to local disk (storage/app/private/documents) and creates DB row.
     * Keeps DB light (file_content = null) — file_path is source of truth.
     */
    public function store(int $seniorId, string $type, UploadedFile $file): SeniorDocument
    {
        $binary = file_get_contents($file->getRealPath());
        $fileName = $file->getClientOriginalName();
        $safe = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
        $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
        $path = "documents/{$seniorId}/" . time() . "_{$type}_{$safe}.{$ext}";
        Storage::disk('local')->put($path, $binary);

        // Clean previous of same type (unique senior_id+type)
        if ($prev = SeniorDocument::where('senior_id',$seniorId)->where('document_type',$type)->first()) {
            if ($prev->file_path) Storage::disk('local')->delete($prev->file_path);
        }

        return SeniorDocument::updateOrCreate(
            ['senior_id'=>$seniorId,'document_type'=>$type],
            // Empty string (not null): bytes live on disk (file_path). Stays valid
            // on NOT NULL schemas that predate the nullable migration.
            ['file_content'=>'','file_path'=>$path,'file_name'=>$fileName,'mime_type'=>$file->getMimeType(),'file_size'=>$file->getSize()]
        );
    }

    public function storeFromBinary(int $seniorId, string $type, string $binary, string $fileName, string $mime): SeniorDocument
    {
        $safe = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
        $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
        $path = "documents/{$seniorId}/" . time() . "_{$type}_{$safe}.{$ext}";
        Storage::disk('local')->put($path, $binary);
        if ($prev = SeniorDocument::where('senior_id',$seniorId)->where('document_type',$type)->first()) {
            if ($prev->file_path) Storage::disk('local')->delete($prev->file_path);
        }
        return SeniorDocument::updateOrCreate(
            ['senior_id'=>$seniorId,'document_type'=>$type],
            ['file_content'=>'','file_path'=>$path,'file_name'=>$fileName,'mime_type'=>$mime,'file_size'=>strlen($binary)]
        );
    }

    public function stream(SeniorDocument $doc): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        // Prefer streaming from disk; fallback to DB BLOB for not-yet-migrated rows
        if ($doc->file_path && Storage::disk('local')->exists($doc->file_path)) {
            return Storage::disk('local')->response($doc->file_path, $doc->file_name, ['Content-Type'=>$doc->mime_type]);
        }
        $binary = $doc->file_content;
        return response()->streamDownload(function() use ($binary) { echo $binary; }, $doc->file_name, ['Content-Type'=>$doc->mime_type]);
    }
}
