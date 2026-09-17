<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Change signalling behind the registry's realtime refresh stream.
 *
 * Seniors use SoftDeletes, but timestamps cannot be the change signal:
 * SQLite/MySQL datetime resolution is 1 second, so a write landing in the
 * same second as the cursor is invisible. Instead every senior write
 * (create / update / delete / restore — see SeniorObserver) atomically
 * bumps a monotonic sequence, and stream loops compare it. Events carry no
 * record data, only "refetch the list" pings; the list API stays the source
 * of truth, so a missed or duplicate ping is harmless.
 */
class RealtimeFeed
{
    public const SENIORS = 'seniors';

    /** Current sequence value (0 when the feed has never changed). */
    public static function seq(string $feed = self::SENIORS): int
    {
        $row = DB::table('realtime_state')->where('name', $feed)->first();

        return $row ? (int) $row->seq : 0;
    }

    /** Atomically bump the sequence (single UPDATE, safe under concurrency). */
    public static function bump(string $feed = self::SENIORS): void
    {
        $updated = DB::table('realtime_state')->where('name', $feed)->increment('seq');

        if (!$updated) {
            DB::table('realtime_state')->insertOrIgnore([
                ['name' => $feed, 'seq' => 1],
            ]);
        }
    }

    /** Cursor a stream loop stores between polls. */
    public static function baseline(string $feed = self::SENIORS): array
    {
        return ['feed' => $feed, 'seq' => static::seq($feed)];
    }

    /** True when the feed moved since the baseline was taken. */
    public static function changedSince(array $baseline): bool
    {
        return static::seq($baseline['feed'] ?? self::SENIORS) !== ($baseline['seq'] ?? 0);
    }
}
