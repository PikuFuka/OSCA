<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Models\User;
use App\Services\Request\RequestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Simulate a fresh HTTP request boundary for authentication.
     *
     * In the test process the application (and Sanctum's guard) persists
     * across calls, so a previously authenticated identity would otherwise
     * leak into the next call. Real requests boot a fresh app every time.
     */
    private function freshRequest(?string $token = null): static
    {
        $this->app['auth']->forgetGuards();
        if ($token === null) {
            unset($this->defaultHeaders['Authorization']);
            return $this;
        }

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    private function makeAdmin(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Test Admin',
            'email' => 'admin-test-' . uniqid() . '@osca.gov.ph',
            'password' => Hash::make('AdminPass123!'),
            'role' => 'Admin',
            'status' => 'Active',
            'force_password_change' => false,
        ], $overrides));
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'T-' . uniqid(),
            'first_name' => 'Test',
            'last_name' => 'Senior',
            'date_of_birth' => '1950-01-01',
            'age' => 76,
            'sex' => 'Male',
            'pension_status' => 'Indigent',
            'barangay' => 'Test Barangay',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => Hash::make('SeniorPass123!'),
            'force_password_change' => false,
        ], $overrides));
    }

    public function test_password_change_revokes_all_tokens(): void
    {
        $user = $this->makeAdmin();
        $tokenA = $user->createToken('a')->plainTextToken;
        $tokenB = $user->createToken('b')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->postJson('/api/change-password', [
                'current_password' => 'AdminPass123!',
                'new_password' => 'BrandNewPass123!',
                'new_password_confirmation' => 'BrandNewPass123!',
            ]);

        $response->assertOk();
        $this->assertTrue((bool) $response->json('reauthenticate'));

        // Both the used token and all other sessions must be dead.
        $this->freshRequest($tokenA)->getJson('/api/me')->assertUnauthorized();
        $this->freshRequest($tokenB)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_force_password_change_blocks_protected_routes_but_allows_self_service(): void
    {
        $user = $this->makeAdmin(['force_password_change' => true]);
        $token = $user->createToken('t')->plainTextToken;
        $headers = ['Authorization' => 'Bearer ' . $token];

        // Staff/admin data routes are blocked until the password is changed.
        $blocked = $this->withHeaders($headers)->getJson('/api/seniors');
        $blocked->assertForbidden();
        $this->assertTrue((bool) $blocked->json('password_change_required'));

        // Self-service stays reachable so the user can actually comply.
        $this->withHeaders($headers)->getJson('/api/me')->assertOk();
        $this->withHeaders($headers)->postJson('/api/logout')->assertOk();
        $this->withHeaders($headers)->postJson('/api/change-password', [])->assertStatus(422);
    }

    public function test_profile_photo_requires_signature_or_auth_and_ignores_query_token(): void
    {
        $filename = 'hardening-' . uniqid() . '.png';
        $dir = storage_path('app/public/profile_photos');
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        file_put_contents($dir . '/' . $filename, 'PNGDATA');

        try {
            // Anonymous: denied.
            $this->freshRequest()->get('/api/storage/profiles/' . $filename)->assertUnauthorized();

            // A valid bearer token smuggled as ?token= must NOT authenticate.
            $user = $this->makeAdmin();
            $token = $user->createToken('t')->plainTextToken;
            $this->freshRequest()->get('/api/storage/profiles/' . $filename . '?token=' . $token)->assertUnauthorized();

            // Short-lived signature works without any Authorization header.
            $signed = URL::temporarySignedRoute('media.photo', now()->addMinutes(5), ['filename' => $filename]);
            $this->freshRequest()->get($signed)->assertOk();

            // Tampered signature is rejected as unauthenticated.
            $this->freshRequest()->get($signed . 'tampered')->assertUnauthorized();

            // Bearer header works.
            $this->freshRequest($token)->get('/api/storage/profiles/' . $filename)->assertOk();
        } finally {
            @unlink($dir . '/' . $filename);
        }
    }

    public function test_document_route_enforces_ownership_and_accepts_signature(): void
    {
        $seniorA = $this->makeSenior();
        $seniorB = $this->makeSenior();

        $relPath = 'hardening-docs/' . uniqid() . '.txt';
        $absDir = storage_path('app/private/hardening-docs');
        if (!is_dir($absDir)) mkdir($absDir, 0755, true);
        file_put_contents($absDir . '/' . basename($relPath), 'SECRET-DOC');

        $doc = SeniorDocument::create([
            'senior_id' => $seniorA->id,
            'document_type' => 'birthCert',
            'file_content' => 'test-only-placeholder',
            'file_path' => $relPath,
            'file_name' => 'birth.txt',
            'mime_type' => 'text/plain',
            'file_size' => 10,
        ]);

        try {
            $url = "/api/seniors/{$seniorA->osca_id}/documents/{$doc->id}";

            $this->freshRequest()->get($url)->assertUnauthorized();

            $tokenB = $seniorB->createToken('t')->plainTextToken;
            $this->freshRequest()->get($url . '?token=' . $tokenB)->assertUnauthorized();

            $signed = URL::temporarySignedRoute('media.document', now()->addMinutes(5), [
                'seniorId' => $seniorA->osca_id,
                'documentId' => $doc->id,
            ]);
            $this->freshRequest()->get($signed)->assertOk();

            $this->freshRequest($tokenB)->get($url)->assertForbidden();

            $tokenA = $seniorA->createToken('t')->plainTextToken;
            $this->freshRequest($tokenA)->get($url)->assertOk();
        } finally {
            $doc->delete();
            @unlink($absDir . '/' . basename($relPath));
        }
    }

    public function test_show_returns_signed_media_urls_without_tokens(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/signed-check.png']);
        $doc = SeniorDocument::create([
            'senior_id' => $senior->id,
            'document_type' => 'birthCert',
            'file_content' => 'test-only-placeholder',
            'file_path' => null,
            'file_name' => 'birth.txt',
            'mime_type' => 'text/plain',
            'file_size' => 10,
        ]);

        try {
            $token = $senior->createToken('t')->plainTextToken;
            $response = $this->freshRequest($token)->getJson('/api/seniors/' . $senior->osca_id);
            $response->assertOk();

            $idPhoto = $response->json('idPhoto');
            $this->assertStringContainsString('/api/storage/profiles/signed-check.png', $idPhoto);
            $this->assertStringContainsString('signature=', $idPhoto);
            $this->assertStringNotContainsStringIgnoringCase('token=', $idPhoto);

            $docUrl = $response->json('documents.0.url');
            $this->assertStringContainsString('signature=', $docUrl);
            $this->assertStringNotContainsStringIgnoringCase('token=', $docUrl);
        } finally {
            $doc->delete();
        }
    }

    public function test_approval_can_set_initial_password_and_login_requires_it(): void
    {
        $senior = $this->makeSenior(['password' => null, 'status' => 'Pending', 'osca_id' => null]);
        $admin = $this->makeAdmin();

        $req = \App\Models\Request::create([
            'senior_id' => $senior->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        app(RequestService::class)->approve($req, 'T-9999', $admin, 'InitialPass123!');

        $senior->refresh();
        $this->assertTrue(Hash::check('InitialPass123!', $senior->password));
        $this->assertTrue((bool) $senior->force_password_change);

        // A passwordless imported account cannot log in at all.
        $nopass = $this->makeSenior(['password' => null, 'osca_id' => 'T-NOPASS']);
        $this->postJson('/api/login', ['identifier' => 'T-NOPASS', 'password' => 'anything'])
            ->assertStatus(422);
    }
}
