<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    private function staffToken(): string
    {
        $user = User::create([
            'name' => 'Photo', 'email' => 'photo@osca.ph',
            'password' => Hash::make('PhotoPass123!'), 'role' => 'Staff',
            'status' => 'Active', 'force_password_change' => false,
        ]);

        return $user->createToken('test')->plainTextToken;
    }

    private function makeSenior(): Senior
    {
        return Senior::create([
            'first_name' => 'Photo', 'last_name' => 'Probe-' . uniqid(),
            'date_of_birth' => '1950-06-15', 'age' => 76, 'sex' => 'Female',
            'barangay' => 'Test Barangay', 'street_address' => '1 Test St',
            'osca_id' => 'OSCA-3000-' . uniqid(), 'status' => 'Active',
        ]);
    }

    public function test_jpeg_photo_stored_with_jpeg_mime(): void
    {
        Storage::fake('public');
        $senior = $this->makeSenior();
        $token = $this->staffToken();

        // 1x1 red JPEG, base64-encoded.
        $jpeg = base64_decode(
            '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////wgARCAABAAEDASIAAhEBAxEB/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AH//Z'
        );

        $this->app['auth']->forgetGuards();
        $response = $this->postJson(
            "/api/seniors/{$senior->osca_id}/photo",
            ['photo' => 'data:image/jpeg;base64,' . base64_encode($jpeg)],
            ['Authorization' => "Bearer {$token}"]
        );

        $response->assertOk();
        $fresh = $senior->fresh();
        $this->assertStringEndsWith('.jpg', $fresh->profile_photo_path);
        Storage::disk('public')->assertExists($fresh->profile_photo_path);
        $this->assertDatabaseHas('senior_documents', [
            'senior_id' => $senior->id,
            'document_type' => 'idPicture',
            'mime_type' => 'image/jpeg',
        ]);
    }

    public function test_non_photo_data_url_is_rejected(): void
    {
        $senior = $this->makeSenior();
        $token = $this->staffToken();

        $this->app['auth']->forgetGuards();
        $this->postJson(
            "/api/seniors/{$senior->osca_id}/photo",
            ['photo' => 'data:image/gif;base64,R0lGODdhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs='],
            ['Authorization' => "Bearer {$token}"]
        )->assertStatus(422);
    }
}
