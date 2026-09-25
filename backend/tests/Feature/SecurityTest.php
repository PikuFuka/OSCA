<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Guards for the PII-exposure fixes:
 *  - role gates on staff/admin routes (Senior tokens must be rejected)
 *  - profile-photo endpoint requires auth + rejects traversal + Senior
 *    actors can only fetch their own photo
 *  - activity logs are never auto-deleted by a read endpoint
 *  - approve/reject only applies to Pending requests
 */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    private array $photoFiles = [];

    protected function tearDown(): void
    {
        foreach ($this->photoFiles as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
        parent::tearDown();
    }

    private function makeStaff(string $role = 'Staff'): User
    {
        return User::create([
            'name' => 'Test Staff',
            'email' => 'staff-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ], $overrides));
    }

    private function tokenFor($model): string
    {
        return $model->createToken('test-token')->plainTextToken;
    }

    private function authHeaders(string $token): array
    {
        return ['Authorization' => 'Bearer ' . $token];
    }

    private function putPhoto(string $filename): string
    {
        $dir = storage_path('app/public/profile_photos');
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }
        // 1x1 transparent PNG
        $path = $dir . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($path, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        ));
        $this->photoFiles[] = $path;
        return $path;
    }

    // ---------- role gates ----------

    public function test_senior_token_cannot_list_seniors(): void
    {
        $senior = $this->makeSenior();

        $response = $this->getJson('/api/seniors', $this->authHeaders($this->tokenFor($senior)));

        $response->assertForbidden();
    }

    public function test_senior_token_cannot_view_other_seniors(): void
    {
        $seniorA = $this->makeSenior(['osca_id' => 'OSCA-A-' . uniqid()]);
        $seniorB = $this->makeSenior(['osca_id' => 'OSCA-B-' . uniqid()]);

        $response = $this->getJson(
            '/api/seniors/' . $seniorB->osca_id,
            $this->authHeaders($this->tokenFor($seniorA))
        );

        $response->assertForbidden();
    }

    public function test_senior_token_can_view_own_record(): void
    {
        $senior = $this->makeSenior();

        $response = $this->getJson(
            '/api/seniors/' . $senior->osca_id,
            $this->authHeaders($this->tokenFor($senior))
        );

        $response->assertOk();
    }

    public function test_staff_can_list_seniors(): void
    {
        $staff = $this->makeStaff();

        $response = $this->getJson('/api/seniors', $this->authHeaders($this->tokenFor($staff)));

        $response->assertOk();
    }

    public function test_senior_token_cannot_list_users(): void
    {
        $senior = $this->makeSenior();

        $response = $this->getJson('/api/users', $this->authHeaders($this->tokenFor($senior)));

        $response->assertForbidden();
    }

    public function test_senior_token_cannot_approve_requests(): void
    {
        $senior = $this->makeSenior();
        $target = $this->makeSenior(['osca_id' => 'OSCA-T-' . uniqid(), 'status' => 'Pending']);
        $req = SeniorRequest::create([
            'senior_id' => $target->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        $response = $this->putJson(
            "/api/requests/{$req->id}/approve",
            ['osca_id' => 'OSCA-NEW-' . uniqid()],
            $this->authHeaders($this->tokenFor($senior))
        );

        $response->assertForbidden();
        $this->assertEquals('Pending', $req->fresh()->status);
    }

    // ---------- profile photos ----------

    public function test_guest_cannot_fetch_profile_photo(): void
    {
        $this->putPhoto('profile_test_public.png');

        $response = $this->get('/api/storage/profiles/profile_test_public.png');

        $response->assertUnauthorized();
    }

    public function test_profile_photo_rejects_path_traversal(): void
    {
        $staff = $this->makeStaff();

        // URL-encoded traversal resolving to backend/.env on disk — must
        // never be served, no matter how containers decode the segments.
        $response = $this->getJson(
            '/api/storage/profiles/%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2f.env',
            $this->authHeaders($this->tokenFor($staff))
        );

        $response->assertNotFound();
    }

    public function test_senior_cannot_fetch_another_seniors_photo(): void
    {
        $seniorA = $this->makeSenior(['osca_id' => 'OSCA-A-' . uniqid()]);
        $filenameB = 'profile_test_b_' . uniqid() . '.png';
        $seniorB = $this->makeSenior([
            'osca_id' => 'OSCA-B-' . uniqid(),
            'profile_photo_path' => 'profile_photos/' . $filenameB,
        ]);
        $this->putPhoto($filenameB);

        $response = $this->getJson(
            '/api/storage/profiles/' . $filenameB,
            $this->authHeaders($this->tokenFor($seniorA))
        );

        $response->assertForbidden();
    }

    public function test_senior_can_fetch_own_photo(): void
    {
        $filename = 'profile_test_own_' . uniqid() . '.png';
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/' . $filename]);
        $this->putPhoto($filename);

        $response = $this->get(
            '/api/storage/profiles/' . $filename,
            $this->authHeaders($this->tokenFor($senior))
        );

        $response->assertOk();
    }

    public function test_staff_can_fetch_any_profile_photo(): void
    {
        $staff = $this->makeStaff();
        $filename = 'profile_test_staff_' . uniqid() . '.png';
        $this->makeSenior(['profile_photo_path' => 'profile_photos/' . $filename]);
        $this->putPhoto($filename);

        $response = $this->get(
            '/api/storage/profiles/' . $filename,
            $this->authHeaders($this->tokenFor($staff))
        );

        $response->assertOk();
    }

    // ---------- activity logs ----------

    public function test_activity_logs_are_not_auto_deleted_on_index(): void
    {
        $staff = $this->makeStaff();
        $log = ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'LOGIN',
            'target_type' => 'User',
            'target_id' => $staff->id,
            'ip_address' => '127.0.0.1',
        ]);
        $log->created_at = now()->subDays(2);
        $log->save();

        $response = $this->getJson('/api/activity-logs', $this->authHeaders($this->tokenFor($staff)));

        $response->assertOk();
        $this->assertDatabaseHas('activity_logs', ['id' => $log->id]);
    }

    public function test_senior_token_cannot_read_activity_logs(): void
    {
        $senior = $this->makeSenior();

        $response = $this->getJson('/api/activity-logs', $this->authHeaders($this->tokenFor($senior)));

        $response->assertForbidden();
    }

    // ---------- approve/reject guards ----------

    public function test_double_approve_is_rejected(): void
    {
        $staff = $this->makeStaff();
        $target = $this->makeSenior(['osca_id' => null, 'status' => 'Pending']);
        $req = SeniorRequest::create([
            'senior_id' => $target->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);
        $headers = $this->authHeaders($this->tokenFor($staff));

        $first = $this->putJson("/api/requests/{$req->id}/approve", [], $headers);
        $first->assertOk();

        $second = $this->putJson("/api/requests/{$req->id}/approve", [], $headers);
        $second->assertStatus(422);
    }
}
