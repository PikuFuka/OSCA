<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilePhotoTest extends TestCase
{
    use RefreshDatabase;

    private const PNG_1PX = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    private function jpegDataUrl(): string
    {
        $img = imagecreatetruecolor(1, 1);
        imagefill($img, 0, 0, imagecolorallocate($img, 255, 255, 255));
        ob_start();
        imagejpeg($img);
        $binary = (string) ob_get_clean();
        imagedestroy($img);
        return 'data:image/jpeg;base64,' . base64_encode($binary);
    }

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Photo Staff',
            'email' => 'photo-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Photo',
            'last_name' => 'Test',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ], $overrides));
    }

    private function photoPath(Senior $senior): ?string
    {
        $rel = $senior->fresh()->profile_photo_path;
        return $rel ? storage_path('app/public/' . ltrim($rel, '/')) : null;
    }

    public function test_staff_can_upload_png_photo_and_it_is_served(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $response = $this->postJson(
            "/api/seniors/{$senior->osca_id}/photo",
            ['photo' => 'data:image/png;base64,' . self::PNG_1PX],
            $headers
        );

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $diskPath = $this->photoPath($senior);
        $this->assertNotNull($diskPath);
        $this->assertFileExists($diskPath);

        $served = $this->get('/api/storage/profiles/' . basename($diskPath), $headers);
        $served->assertOk();
    }

    public function test_staff_can_upload_jpeg_photo_and_it_is_served(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $response = $this->postJson(
            "/api/seniors/{$senior->osca_id}/photo",
            ['photo' => $this->jpegDataUrl()],
            $headers
        );

        $response->assertOk();

        $diskPath = $this->photoPath($senior);
        $this->assertNotNull($diskPath);
        $this->assertStringEndsWith('.jpg', $diskPath);
        $this->assertFileExists($diskPath);

        $served = $this->get('/api/storage/profiles/' . basename($diskPath), $headers);
        $served->assertOk();
    }

    public function test_replacing_photo_deletes_old_file_and_keeps_new(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $this->postJson("/api/seniors/{$senior->osca_id}/photo", ['photo' => 'data:image/png;base64,' . self::PNG_1PX], $headers)->assertOk();
        $firstPath = $this->photoPath($senior);
        $this->assertFileExists($firstPath);

        sleep(1); // distinct time() filename
        $this->postJson("/api/seniors/{$senior->osca_id}/photo", ['photo' => $this->jpegDataUrl()], $headers)->assertOk();
        $secondPath = $this->photoPath($senior);

        $this->assertFileDoesNotExist($firstPath);
        $this->assertFileExists($secondPath);
        $served = $this->get('/api/storage/profiles/' . basename($secondPath), $headers);
        $served->assertOk();
    }
    public function test_senior_token_cannot_update_photo(): void
    {
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $senior->createToken('t')->plainTextToken];

        $response = $this->postJson(
            "/api/seniors/{$senior->osca_id}/photo",
            ['photo' => 'data:image/png;base64,' . self::PNG_1PX],
            $headers
        );

        $response->assertForbidden();
    }

    public function test_staff_can_delete_profile_photo(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $this->postJson("/api/seniors/{$senior->osca_id}/photo", ['photo' => 'data:image/png;base64,' . self::PNG_1PX], $headers)->assertOk();
        $diskPath = $this->photoPath($senior);
        $this->assertFileExists($diskPath);

        $response = $this->deleteJson("/api/seniors/{$senior->osca_id}/photo", [], $headers);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertFileDoesNotExist($diskPath);
        $this->assertNull($senior->fresh()->profile_photo_path);
        $this->assertDatabaseMissing('senior_documents', [
            'senior_id' => $senior->id,
            'document_type' => 'idPicture',
        ]);

        $served = $this->get('/api/storage/profiles/' . basename($diskPath), $headers);
        $served->assertNotFound();
    }

    public function test_delete_photo_is_idempotent_without_photo(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $response = $this->deleteJson("/api/seniors/{$senior->osca_id}/photo", [], $headers);

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_senior_token_cannot_delete_photo(): void
    {
        $senior = $this->makeSenior();
        $headers = ['Authorization' => 'Bearer ' . $senior->createToken('t')->plainTextToken];

        $response = $this->deleteJson("/api/seniors/{$senior->osca_id}/photo", [], $headers);

        $response->assertForbidden();
    }

    public function test_guest_cannot_delete_photo(): void
    {
        $senior = $this->makeSenior();

        $response = $this->deleteJson("/api/seniors/{$senior->osca_id}/photo");

        $response->assertUnauthorized();
    }
}
