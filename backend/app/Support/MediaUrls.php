<?php

namespace App\Support;

use Illuminate\Support\Facades\URL;

/**
 * Single place where browser-usable media URLs are built.
 *
 * Photos and private documents are NEVER addressed with bearer tokens in the
 * query string (tokens leak into logs, history and Referer headers). Instead
 * every URL handed to the frontend is a short-lived Laravel signed URL that
 * the corresponding controller accepts WITHOUT an Authorization header.
 * Interactive API calls (fetch/XHR) keep using the Authorization header and
 * do not need these URLs at all.
 */
class MediaUrls
{
    /** How long browser-facing media links stay valid. */
    public static function ttl(): \DateTimeInterface|\DateInterval|int
    {
        return now()->addMinutes(30);
    }

    /** Signed URL for a profile photo file (basename only, e.g. "profile_1_2.png"). */
    public static function photo(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        return URL::temporarySignedRoute('media.photo', static::ttl(), [
            'filename' => basename($path),
        ]);
    }

    /** Signed URL for a senior document (ownership is re-checked when served). */
    public static function document(int|string $seniorId, int|string $documentId): string
    {
        return URL::temporarySignedRoute('media.document', static::ttl(), [
            'seniorId' => $seniorId,
            'documentId' => $documentId,
        ]);
    }
}
