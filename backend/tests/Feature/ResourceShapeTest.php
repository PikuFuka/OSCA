<?php

namespace Tests\Feature;

use App\Http\Resources\RequestResource;
use App\Http\Resources\SeniorResource;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceShapeTest extends TestCase
{
    use RefreshDatabase;

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Shape',
            'last_name' => 'Test',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_senior_resource_id_photo_uses_storage_url_format(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/abc123.png']);

        $data = (new SeniorResource($senior))->toArray(request());

        $this->assertSame('/api/storage/profiles/abc123.png', $data['idPhoto']);
    }

    public function test_senior_resource_id_photo_extracts_basename(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/nested/dir/photo.jpg']);

        $data = (new SeniorResource($senior))->toArray(request());

        $this->assertSame('/api/storage/profiles/photo.jpg', $data['idPhoto']);
    }

    public function test_senior_resource_id_photo_null_without_photo(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => null]);

        $data = (new SeniorResource($senior))->toArray(request());

        $this->assertNull($data['idPhoto']);
    }

    public function test_request_resource_profile_picture_prefers_pending_data(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/old.png']);
        $req = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'Information Update',
            'status' => 'Pending',
            'pending_data' => ['profile_photo_path' => 'profile_photos/new.png'],
        ]);

        $data = (new RequestResource($req->load('senior')))->toArray(request());

        $this->assertSame('/api/storage/profiles/new.png', $data['details']['profilePicture']);
    }

    public function test_request_resource_profile_picture_falls_back_to_senior_photo(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/senior.png']);
        $req = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        $data = (new RequestResource($req->load('senior')))->toArray(request());

        $this->assertSame('/api/storage/profiles/senior.png', $data['details']['profilePicture']);
    }

    public function test_request_resource_profile_picture_null_without_any_photo(): void
    {
        $senior = $this->makeSenior(['profile_photo_path' => null]);
        $req = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        $data = (new RequestResource($req->load('senior')))->toArray(request());

        $this->assertNull($data['details']['profilePicture']);
    }

    public function test_show_endpoint_returns_storage_url_format(): void
    {
        $staff = User::create([
            'name' => 'Shape Staff',
            'email' => 'shape-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
        $senior = $this->makeSenior(['profile_photo_path' => 'profile_photos/endpoint.png']);

        $response = $this->getJson(
            "/api/seniors/{$senior->osca_id}",
            ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken]
        );

        $response->assertOk();
        $response->assertJsonPath('idPhoto', '/api/storage/profiles/endpoint.png');
    }

    public function test_show_endpoint_returns_null_photo_when_missing(): void
    {
        $staff = User::create([
            'name' => 'Shape Staff',
            'email' => 'shape-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
        $senior = $this->makeSenior(['profile_photo_path' => null]);

        $response = $this->getJson(
            "/api/seniors/{$senior->osca_id}",
            ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken]
        );

        $response->assertOk();
        $this->assertNull($response->json('idPhoto'));
    }
}
