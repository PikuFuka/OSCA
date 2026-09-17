<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RealtimeStreamTest extends TestCase
{
    use RefreshDatabase;

    public function test_stream_rejects_unsigned_requests(): void
    {
        $this->get('/api/stream/seniors')->assertStatus(403);
    }

    public function test_stream_serves_event_stream_and_terminates(): void
    {
        $url = URL::temporarySignedRoute('stream.seniors', now()->addMinutes(30), []);
        $path = parse_url($url, PHP_URL_PATH) . '?' . parse_url($url, PHP_URL_QUERY);

        $response = $this->get($path);

        $response->assertStatus(200);
        $this->assertStringContainsString(
            'text/event-stream',
            $response->headers->get('Content-Type', '')
        );

        $body = $response->streamedContent();
        $this->assertStringContainsString(': connected', $body);
        $this->assertStringContainsString('event: stream-end', $body);
    }

    public function test_stream_url_endpoint_requires_auth(): void
    {
        $this->getJson('/api/stream/url')->assertStatus(401);
    }

    public function test_authenticated_user_gets_signed_stream_url(): void
    {
        $user = User::create([
            'name' => 'Stream', 'email' => 'stream@osca.ph',
            'password' => Hash::make('StreamPass123!'), 'role' => 'Staff',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->getJson('/api/stream/url', ['Authorization' => "Bearer {$token}"]);

        $response->assertOk();
        $response->assertJsonStructure(['url', 'expires_in_minutes']);
        $this->assertStringContainsString('/api/stream/seniors', $response->json('url'));
        $this->assertStringContainsString('signature=', $response->json('url'));
    }
}
