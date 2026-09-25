<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'name' => "Backup {$role}",
            'email' => 'backup-' . strtolower($role) . '-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function makeSenior(): Senior
    {
        return Senior::create([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Backup',
            'last_name' => 'Senior',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ]);
    }

    private function headers($model): array
    {
        return ['Authorization' => 'Bearer ' . $model->createToken('t')->plainTextToken];
    }

    public function test_guest_cannot_export(): void
    {
        $this->getJson('/api/backup/export')->assertUnauthorized();
    }

    public function test_staff_cannot_export(): void
    {
        $this->getJson('/api/backup/export', $this->headers($this->makeUser('Staff')))->assertForbidden();
    }

    public function test_senior_cannot_export(): void
    {
        $this->getJson('/api/backup/export', $this->headers($this->makeSenior()))->assertForbidden();
    }

    public function test_guest_cannot_import(): void
    {
        $this->postJson('/api/backup/import', [])->assertUnauthorized();
    }

    public function test_staff_cannot_import(): void
    {
        $this->postJson('/api/backup/import', [], $this->headers($this->makeUser('Staff')))->assertForbidden();
    }

    public function test_import_rejects_non_sql_file(): void
    {
        $admin = $this->makeUser('Admin');

        $response = $this->postJson('/api/backup/import', [
            'file' => UploadedFile::fake()->create('backup.txt', 10, 'text/plain'),
        ], $this->headers($admin));

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
    }

    public function test_import_requires_file(): void
    {
        $admin = $this->makeUser('Admin');

        $this->postJson('/api/backup/import', [], $this->headers($admin))->assertStatus(422);
    }
}
