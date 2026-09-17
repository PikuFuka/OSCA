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
     * Keeps DB light (file_content stays empty) — file_path is source of truth.
     * storeAs streams the upload straight to disk: no file_get_contents +
     * put double-buffer in PHP memory.
     */
    public function store(int $seniorId, string $type, UploadedFile $file): SeniorDocument
    {
        $fileName = $file->getClientOriginalName();
        $safe = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
        $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
        $name = time() . "_{$type}_{$safe}.{$ext}";
        $path = $file->storeAs("documents/{$seniorId}", $name, 'local');

        // Clean previous of same type (unique senior_id+type) — after the
        // new file lands, so a failed write never loses the old one.
        if ($prev = SeniorDocument::where('senior_id',$seniorId)->where('document_type',$type)->first()) {
            if ($prev->file_path && $prev->file_path !== $path) Storage::disk('local')->delete($prev->file_path);
        }

        return SeniorDocument::updateOrCreate(
            ['senior_id'=>$seniorId,'document_type'=>$type],
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
            if ($prev->file_path && $prev->file_path !== $path) Storage::disk('local')->delete($prev->file_path);
        }
        return SeniorDocument::updateOrCreate(
            ['senior_id'=>$seniorId,'document_type'=>$type],
            ['file_content'=>'','file_path'=>$path,'file_name'=>$fileName,'mime_type'=>$mime,'file_size'=>strlen($binary)]
        );
    }

    public function stream(SeniorDocument $doc): \Symfony\Component\HttpFoundation\Response
    {
        // True disk streaming (kernel sendfile): the file is never loaded
        // into PHP memory. Storage::response() would buffer via get().
        if ($doc->file_path && Storage::disk('local')->exists($doc->file_path)) {
            return response()->file(
                Storage::disk('local')->path($doc->file_path),
                ['Content-Type' => $doc->mime_type]
            )->setContentDisposition('inline', $doc->file_name);
        }
        $binary = $doc->file_content;
        return response()->streamDownload(function() use ($binary) { echo $binary; }, $doc->file_name, ['Content-Type'=>$doc->mime_type]);
    }
}
