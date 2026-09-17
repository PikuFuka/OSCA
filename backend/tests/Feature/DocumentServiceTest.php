<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Services\Senior\DocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class DocumentServiceTest extends TestCase
{
    use RefreshDatabase;

    private function makeSenior(): Senior
    {
        return Senior::create([
            'first_name' => 'Doc', 'last_name' => 'Probe-' . uniqid(),
            'date_of_birth' => '1950-06-15', 'age' => 76, 'sex' => 'Female',
            'barangay' => 'Test Barangay', 'street_address' => '1 Test St',
            'status' => 'Pending',
        ]);
    }

    public function test_store_writes_file_to_disk_and_keeps_db_light(): void
    {
        Storage::fake('local');
        $senior = $this->makeSenior();
        $file = UploadedFile::fake()->create('birth.pdf', 100, 'application/pdf');

        $doc = (new DocumentService)->store($senior->id, 'birthCert', $file);

        // Empty marker (never null): portable across MySQL-nullable and
        // sqlite-NOT-NULL schemas; file_path is the source of truth.
        $this->assertSame('', $doc->file_content);
        $this->assertSame(100 * 1024, $doc->file_size);
        Storage::disk('local')->assertExists($doc->file_path);
        $this->assertSame(
            file_get_contents($file->getRealPath()),
            Storage::disk('local')->get($doc->file_path)
        );
    }

    public function test_store_replaces_previous_file_of_same_type(): void
    {
        Storage::fake('local');
        $senior = $this->makeSenior();
        $service = new DocumentService;

        $first = $service->store($senior->id, 'cedula', UploadedFile::fake()->create('a.pdf', 10, 'application/pdf'));
        $service->store($senior->id, 'cedula', UploadedFile::fake()->create('b.pdf', 10, 'application/pdf'));

        Storage::disk('local')->assertMissing($first->file_path);
        $this->assertSame(1, SeniorDocument::where('senior_id', $senior->id)->where('document_type', 'cedula')->count());
    }

    public function test_stream_serves_disk_file_without_loading_it(): void
    {
        Storage::fake('local');
        $senior = $this->makeSenior();
        $doc = (new DocumentService)->store($senior->id, 'brgyCert', UploadedFile::fake()->create('c.pdf', 10, 'application/pdf'));

        $response = (new DocumentService)->stream($doc->fresh());

        $this->assertInstanceOf(BinaryFileResponse::class, $response);
        $this->assertTrue($doc->fresh()->hasFile());
    }

    public function test_stream_falls_back_to_db_blob(): void
    {
        Storage::fake('local');
        $senior = $this->makeSenior();
        $doc = SeniorDocument::create([
            'senior_id' => $senior->id, 'document_type' => 'birthCert',
            'file_content' => 'legacy-bytes', 'file_path' => null,
            'file_name' => 'old.pdf', 'mime_type' => 'application/pdf', 'file_size' => 12,
        ]);

        $response = (new DocumentService)->stream($doc);

        $this->assertInstanceOf(StreamedResponse::class, $response);
        $this->assertTrue($doc->hasFile());
    }

    public function test_has_file_is_false_when_nothing_stored(): void
    {
        Storage::fake('local');
        $senior = $this->makeSenior();
        $doc = SeniorDocument::create([
            'senior_id' => $senior->id, 'document_type' => 'birthCert',
            'file_content' => '', 'file_path' => 'documents/missing.pdf',
            'file_name' => 'x.pdf', 'mime_type' => 'application/pdf', 'file_size' => 0,
        ]);

        $this->assertFalse($doc->hasFile());
    }
}
