<?php

namespace Tests\Unit;

use App\Http\Middleware\AuthenticateWithToken;
use Illuminate\Http\Request;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Response;

class QueryTokenAuthenticationTest extends TestCase
{
    public function test_query_parameter_does_not_authenticate_request(): void
    {
        $request = Request::create('/api/me', 'GET', ['token' => 'synthetic-query-value']);
        (new AuthenticateWithToken)->handle($request, fn () => new Response);
        $this->assertNull($request->bearerToken());
    }

    public function test_query_parameter_does_not_replace_authorization_header(): void
    {
        $request = Request::create('/api/me', 'GET', ['token' => 'synthetic-query-value']);
        $request->headers->set('Authorization', 'Bearer synthetic-header-value');
        (new AuthenticateWithToken)->handle($request, fn () => new Response);
        $this->assertSame('synthetic-header-value', $request->bearerToken());
    }
}
