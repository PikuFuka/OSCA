<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional second factor for admin endpoints via Cloudflare Access.
 *
 * When `services.cloudflare_access.team` is empty (LAN-only operation) this
 * middleware passes everything through. When configured, the request must
 * carry a valid Cloudflare Access JWT (`CF-Access-JWT-Assertion`), verified
 * here at the origin against Cloudflare's published certs (RS256, aud/iss/
 * expiry checked). This keeps working even if someone reaches the origin
 * directly, bypassing the edge policy.
 */
class EnsureCloudflareAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $team = (string) config('services.cloudflare_access.team', '');
        $aud = (string) config('services.cloudflare_access.aud', '');

        if ($team === '' || $aud === '') {
            return $next($request);
        }

        $assertion = $request->header('CF-Access-JWT-Assertion');
        if (!$assertion || !$this->valid($assertion, $team, $aud)) {
            return response()->json([
                'message' => 'Forbidden. A valid Cloudflare Access session is required for this resource.',
            ], 403);
        }

        return $next($request);
    }

    private function valid(string $jwt, string $team, string $aud): bool
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }
        [$headerB64, $payloadB64, $sigB64] = $parts;

        $header = json_decode($this->b64urlDecode($headerB64), true);
        $claims = json_decode($this->b64urlDecode($payloadB64), true);
        if (!is_array($header) || !is_array($claims)) {
            return false;
        }

        if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) {
            return false;
        }

        // Time + audience + issuer checks before the (slower) signature check.
        $now = time();
        if (isset($claims['exp']) && $claims['exp'] < $now - 30) {
            return false;
        }
        if (isset($claims['nbf']) && $claims['nbf'] > $now + 30) {
            return false;
        }
        $audiences = (array) ($claims['aud'] ?? []);
        if (!in_array($aud, $audiences, true)) {
            return false;
        }
        if (($claims['iss'] ?? '') !== $team && ($claims['iss'] ?? '') !== rtrim($team, '/')) {
            return false;
        }

        $key = $this->publicKeyFor((string) $header['kid'], $team);
        if ($key === null) {
            return false;
        }

        $signature = $this->b64urlDecode($sigB64);
        if ($signature === '') {
            return false;
        }

        return openssl_verify($headerB64 . '.' . $payloadB64, $signature, $key, OPENSSL_ALGO_SHA256) === 1;
    }

    /**
     * @return resource|\OpenSSLAsymmetricKey|null
     */
    private function publicKeyFor(string $kid, string $team)
    {
        try {
            $keys = Cache::remember('cf-access-certs', now()->addHours(6), function () use ($team) {
                $response = Http::timeout(10)->get(rtrim($team, '/') . '/cdn-cgi/access/certs');
                if (!$response->successful()) {
                    return [];
                }

                return $response->json('keys', []);
            });
        } catch (\Throwable $e) {
            Log::warning('Cloudflare Access cert fetch failed.', ['error' => $e->getMessage()]);

            return null;
        }

        foreach ((array) $keys as $key) {
            if (($key['kid'] ?? null) !== $kid || empty($key['x5c'][0])) {
                continue;
            }

            $pem = "-----BEGIN CERTIFICATE-----\n"
                . chunk_split($key['x5c'][0], 64, "\n")
                . "-----END CERTIFICATE-----\n";
            $publicKey = openssl_pkey_get_public($pem);
            if ($publicKey !== false) {
                return $publicKey;
            }
        }

        return null;
    }

    private function b64urlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $input .= str_repeat('=', 4 - $remainder);
        }

        return (string) base64_decode(strtr($input, '-_', '+/'));
    }
}
