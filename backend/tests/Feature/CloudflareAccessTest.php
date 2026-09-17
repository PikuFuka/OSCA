<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureCloudflareAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudflareAccessTest extends TestCase
{
    private string $team = 'https://osca-test.cloudflareaccess.com';
    private string $aud = 'test-audience-tag';
    private $privateKey;
    private string $certDerB64;

    protected function setUp(): void
    {
        parent::setUp();

        if (!extension_loaded('openssl')) {
            $this->markTestSkipped('openssl extension required');
        }

        config([
            'services.cloudflare_access.team' => $this->team,
            'services.cloudflare_access.aud' => $this->aud,
        ]);

        // Self-signed cert (test-only) whose public half is served as the JWKS.
        // Windows PHP needs an explicit openssl config for CSR creation.
        $sslConf = getenv('OPENSSL_CONF');
        foreach (['C:\xampp\apache\conf\openssl.cnf', 'C:\xampp\php\extras\ssl\openssl.cnf'] as $candidate) {
            if (!$sslConf && is_file($candidate)) {
                $sslConf = $candidate;
                break;
            }
        }
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $csrArgs = ['digest_alg' => 'sha256'];
        if ($sslConf) {
            $csrArgs['config'] = $sslConf;
        }
        $csr = openssl_csr_new(['CN' => 'osca-access-test'], $key, $csrArgs);
        $this->assertNotFalse($csr, 'Could not create test CSR (openssl config missing?)');
        $cert = openssl_csr_sign($csr, null, $key, 1, $csrArgs);
        openssl_x509_export($cert, $pem);
        $der = base64_decode(trim(str_replace(
            ['-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----', "\r", "\n", ' '],
            '',
            $pem
        )));

        $this->privateKey = $key;
        $this->certDerB64 = base64_encode($der);

        Http::fake([
            $this->team . '/cdn-cgi/access/certs' => Http::response([
                'keys' => [['kid' => 'test-key', 'x5c' => [$this->certDerB64]]],
            ], 200),
        ]);
    }

    private function b64url(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }

    private function makeJwt(array $claims, string $kid = 'test-key'): string
    {
        $header = $this->b64url(json_encode(['alg' => 'RS256', 'kid' => $kid, 'typ' => 'JWT']));
        $payload = $this->b64url(json_encode($claims));
        openssl_sign($header . '.' . $payload, $sig, $this->privateKey, OPENSSL_ALGO_SHA256);

        return $header . '.' . $payload . '.' . $this->b64url($sig);
    }

    private function validClaims(): array
    {
        return [
            'aud' => [$this->aud],
            'iss' => $this->team,
            'exp' => time() + 300,
            'iat' => time() - 10,
            'email' => 'admin@osca.gov.ph',
        ];
    }

    private function runMiddleware(?string $jwt): \Symfony\Component\HttpFoundation\Response
    {
        Cache::forget('cf-access-certs');
        $request = Request::create('/api/backup/export', 'GET');
        if ($jwt !== null) {
            $request->headers->set('CF-Access-JWT-Assertion', $jwt);
        }

        return (new EnsureCloudflareAccess)->handle($request, fn () => response('ok'));
    }

    public function test_disabled_without_team_config(): void
    {
        config(['services.cloudflare_access.team' => null]);

        $this->assertSame(200, $this->runMiddleware(null)->getStatusCode());
    }

    public function test_missing_assertion_is_rejected_when_enabled(): void
    {
        $this->assertSame(403, $this->runMiddleware(null)->getStatusCode());
    }

    public function test_valid_access_jwt_passes(): void
    {
        $this->assertSame(200, $this->runMiddleware($this->makeJwt($this->validClaims()))->getStatusCode());
    }

    public function test_tampered_payload_is_rejected(): void
    {
        $jwt = $this->makeJwt($this->validClaims());
        [$h, $p, $s] = explode('.', $jwt);
        $evil = $this->b64url(json_encode(['aud' => [$this->aud], 'admin' => true]));

        $this->assertSame(403, $this->runMiddleware($h . '.' . $evil . '.' . $s)->getStatusCode());
    }

    public function test_expired_jwt_is_rejected(): void
    {
        $claims = $this->validClaims();
        $claims['exp'] = time() - 60;

        $this->assertSame(403, $this->runMiddleware($this->makeJwt($claims))->getStatusCode());
    }

    public function test_wrong_audience_is_rejected(): void
    {
        $claims = $this->validClaims();
        $claims['aud'] = ['someone-elses-app'];

        $this->assertSame(403, $this->runMiddleware($this->makeJwt($claims))->getStatusCode());
    }

    public function test_unknown_key_is_rejected(): void
    {
        $this->assertSame(403, $this->runMiddleware($this->makeJwt($this->validClaims(), 'unknown-kid'))->getStatusCode());
    }
}
