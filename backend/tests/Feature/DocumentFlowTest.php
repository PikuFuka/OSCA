<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @var array{local: string[], public: string[]} */
    private array $trackedFiles = ['local' => [], 'public' => []];

    protected function tearDown(): void
    {
        foreach ($this->trackedFiles['local'] as $path) {
            Storage::disk('local')->delete($path);
        }
        foreach ($this->trackedFiles['public'] as $path) {
            Storage::disk('public')->delete($path);
        }
        parent::tearDown();
    }

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Doc Staff',
            'email' => 'doc-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Doc',
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

    private function staffHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . $this->makeStaff()->createToken('t')->plainTextToken];
    }

    public function test_upload_document_stores_file_and_record(): void
    {
        $senior = $this->makeSenior();
        $headers = $this->staffHeaders();
        $file = UploadedFile::fake()->create('birth.pdf', 100, 'application/pdf');

        $response = $this->post(
            "/api/seniors/{$senior->osca_id}/documents",
            ['document' => $file, 'documentType' => 'birthCert'],
            $headers
        );

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $doc = SeniorDocument::where('senior_id', $senior->id)->where('document_type', 'birthCert')->firstOrFail();
        $this->assertTrue(Storage::disk('local')->exists($doc->file_path));
        Storage::disk('local')->delete($doc->file_path);
    }

    public function test_upload_id_picture_also_sets_profile_photo_path(): void
    {
        $senior = $this->makeSenior();
        $headers = $this->staffHeaders();
        $file = UploadedFile::fake()->image('photo.jpg', 200, 200);

        $response = $this->post(
            "/api/seniors/{$senior->osca_id}/documents",
            ['document' => $file, 'documentType' => 'idPicture'],
            $headers
        );

        $response->assertOk();

        $photoPath = $senior->fresh()->profile_photo_path;
        $this->assertNotNull($photoPath);
        $this->assertTrue(Storage::disk('public')->exists($photoPath));
        Storage::disk('public')->delete($photoPath);

        $doc = SeniorDocument::where('senior_id', $senior->id)->where('document_type', 'idPicture')->firstOrFail();
        $this->assertTrue(Storage::disk('local')->exists($doc->file_path));
        Storage::disk('local')->delete($doc->file_path);
    }

    public function test_delete_id_picture_removes_file_and_clears_photo_path(): void
    {
        $photoPath = 'profile_photos/del_test_' . uniqid() . '.png';
        Storage::disk('public')->put($photoPath, 'fake-image');
        $this->trackedFiles['public'][] = $photoPath;

        $senior = $this->makeSenior(['profile_photo_path' => $photoPath]);
        $filePath = 'documents/' . $senior->id . '/del_test.pdf';
        Storage::disk('local')->put($filePath, 'fake-pdf');
        $doc = SeniorDocument::create([
            'senior_id' => $senior->id,
            'document_type' => 'idPicture',
            'file_content' => '',
            'file_path' => $filePath,
            'file_name' => 'del_test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
        ]);

        $response = $this->deleteJson(
            "/api/seniors/{$senior->osca_id}/documents/{$doc->id}",
            [],
            $this->staffHeaders()
        );

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertDatabaseMissing('senior_documents', ['id' => $doc->id]);
        $this->assertNull($senior->fresh()->profile_photo_path);
        $this->assertFalse(Storage::disk('local')->exists($filePath));
        $this->assertFalse(Storage::disk('public')->exists($photoPath));
    }

    public function test_get_document_guest_gets_401(): void
    {
        $senior = $this->makeSenior();
        $doc = SeniorDocument::create([
            'senior_id' => $senior->id,
            'document_type' => 'birthCert',
            'file_path' => null,
            'file_content' => 'db-bytes',
            'file_name' => 'birth.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 8,
        ]);

        $this->getJson("/api/seniors/{$senior->osca_id}/documents/{$doc->id}")->assertUnauthorized();
    }

    public function test_get_document_other_senior_gets_403(): void
    {
        $filePath = 'documents/other_' . uniqid() . '.pdf';
        Storage::disk('local')->put($filePath, '%PDF-owner-bytes');
        $this->trackedFiles['local'][] = $filePath;

        $owner = $this->makeSenior(['osca_id' => 'OSCA-OWN-' . uniqid()]);
        $other = $this->makeSenior(['osca_id' => 'OSCA-OTH-' . uniqid()]);
        $doc = SeniorDocument::create([
            'senior_id' => $owner->id,
            'document_type' => 'birthCert',
            'file_content' => '',
            'file_path' => $filePath,
            'file_name' => 'birth.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 16,
        ]);

        $otherHeaders = ['Authorization' => 'Bearer ' . $other->createToken('t')->plainTextToken];
        $this->getJson("/api/seniors/{$owner->osca_id}/documents/{$doc->id}", $otherHeaders)->assertForbidden();
    }

    public function test_get_document_owner_gets_200(): void
    {
        $filePath = 'documents/owner_' . uniqid() . '.pdf';
        Storage::disk('local')->put($filePath, '%PDF-owner-bytes');
        $this->trackedFiles['local'][] = $filePath;

        $owner = $this->makeSenior(['osca_id' => 'OSCA-OWN-' . uniqid()]);
        $doc = SeniorDocument::create([
            'senior_id' => $owner->id,
            'document_type' => 'birthCert',
            'file_content' => '',
            'file_path' => $filePath,
            'file_name' => 'birth.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 16,
        ]);

        $ownerHeaders = ['Authorization' => 'Bearer ' . $owner->createToken('t')->plainTextToken];
        $response = $this->get("/api/seniors/{$owner->osca_id}/documents/{$doc->id}", $ownerHeaders);
        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}
