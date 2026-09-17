<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\RealtimeFeed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Server-sent events for realtime registry refresh.
 *
 * Browsers cannot attach an Authorization header to an EventSource, so —
 * exactly like profile photos and documents (see App\Support\MediaUrls) —
 * the stream URL is short-lived and signed. Events carry NO record data,
 * only "the seniors table changed, refetch the list" pings, so any
 * authenticated user may hold one.
 *
 * Change detection is a monotonic sequence bumped by SeniorObserver
 * (timestamps are blind to same-second writes). Streams end themselves
 * after realtime.max_duration_seconds; browsers reconnect automatically,
 * which rotates php-cgi workers and drains cleanly across deploys.
 */
class StreamController extends Controller
{
    /** Mint a short-lived signed stream URL (authenticated users only). */
    public function url(Request $request)
    {
        $ttlMinutes = (int) config('realtime.stream_ttl_minutes', 30);

        return response()->json([
            'url' => URL::temporarySignedRoute(
                'stream.seniors',
                now()->addMinutes($ttlMinutes),
                []
            ),
            'expires_in_minutes' => $ttlMinutes,
        ]);
    }

    /** The event stream itself: valid signature OR Sanctum session. */
    public function stream(Request $request): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        if (!$request->hasValidSignature() && !auth('sanctum')->check()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $pollSeconds = (int) config('realtime.poll_seconds', 3);
        $heartbeatSeconds = (int) config('realtime.heartbeat_seconds', 15);
        $maxDuration = (int) config('realtime.max_duration_seconds', 240);

        // Unit tests must not sit in a 4-minute loop: collapse the timing so
        // the loop runs its baseline pass plus one check, then terminates.
        if (app()->runningUnitTests()) {
            $pollSeconds = 0;
            $heartbeatSeconds = 0;
            $maxDuration = 0;
        }

        return response()->stream(function () use ($pollSeconds, $heartbeatSeconds, $maxDuration) {
            set_time_limit(0);

            $baseline = RealtimeFeed::baseline();
            $deadline = time() + $maxDuration;
            $lastHeartbeat = 0;

            $this->emit(': connected');
            $this->emit('retry: 5000');

            do {
                if ($pollSeconds > 0) {
                    sleep($pollSeconds);
                }
                if (connection_aborted()) {
                    break;
                }

                if (RealtimeFeed::changedSince($baseline)) {
                    $baseline = RealtimeFeed::baseline();
                    $this->emit('event: seniors-changed');
                    $this->emit('data: ' . json_encode(['seq' => $baseline['seq']]));
                    $this->emit('');
                }

                if ($heartbeatSeconds > 0 && time() - $lastHeartbeat >= $heartbeatSeconds) {
                    $lastHeartbeat = time();
                    $this->emit(': heartbeat');
                }
            } while (time() < $deadline);

            $this->emit('event: stream-end');
            $this->emit('data: ' . json_encode(['reason' => 'max-duration']));
            $this->emit('');
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            // nginx fastcgi honours this per-response: no buffering for SSE.
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function emit(string $line): void
    {
        echo $line . "\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }
}
