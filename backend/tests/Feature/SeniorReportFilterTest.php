<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SeniorReportFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function makeAdmin(): User
    {
        return User::create([
            'name' => 'Report Admin',
            'email' => 'report.admin-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Admin',
        ]);
    }

    private function makeSenior(string $name, array $overrides = []): Senior
    {
        [$first, $last] = explode(' ', $name, 2) + [1 => 'Senior'];

        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => $first,
            'middle_name' => '',
            'last_name' => $last,
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ], $overrides));
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer ' . $user->createToken('t')->plainTextToken];
    }

    public function test_centenarians_filter_returns_only_verified_centenarians_even_after_a_cached_plain_list(): void
    {
        $admin = $this->makeAdmin();
        $headers = $this->headers($admin);

        $this->makeSenior('Centenarian One', [
            'date_of_birth' => '1920-01-01',
            'age' => 106,
            'barangay' => 'Anibong',
        ]);
        $this->makeSenior('Centenarian Two', [
            'date_of_birth' => '1918-06-15',
            'age' => 108,
        ]);
        $this->makeSenior('Placeholder Import', [
            'date_of_birth' => Senior::PLACEHOLDER_DATE_OF_BIRTH,
            'age' => 126,
        ]);
        $this->makeSenior('Seventy Year Old', [
            'date_of_birth' => '1956-01-01',
            'age' => 70,
        ]);
        $this->makeSenior('Ordinary Senior');

        // Warm the cache with an unfiltered page first: the centenarian flag
        // must be part of the cache identity, not silently reuse this result.
        $plain = $this->getJson('/api/seniors?page=1&per_page=10', $headers);
        $plain->assertOk();
        $this->assertSame(5, $plain->json('meta.total'));

        $response = $this->getJson('/api/seniors?centenarians=1&page=1&per_page=10', $headers);

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        sort($names);

        $this->assertSame(['Centenarian One', 'Centenarian Two'], $names);
        $this->assertSame(2, $response->json('meta.total'));
        $this->assertSame([true], collect($response->json('data'))->pluck('isCentenarian')->unique()->values()->all());
    }

    public function test_centenarians_filter_respects_barangay_and_pagination(): void
    {
        $admin = $this->makeAdmin();
        $headers = $this->headers($admin);

        $this->makeSenior('Anibong Centenarian A', [
            'date_of_birth' => '1921-02-02',
            'age' => 105,
            'barangay' => 'Anibong',
        ]);
        $this->makeSenior('Anibong Centenarian B', [
            'date_of_birth' => '1922-03-03',
            'age' => 104,
            'barangay' => 'Anibong',
        ]);
        $this->makeSenior('Other Barangay Centenarian', [
            'date_of_birth' => '1920-04-04',
            'age' => 106,
            'barangay' => 'Poblacion I (Barangay I)',
        ]);
        $this->makeSenior('Anibong Ordinary Senior', [
            'barangay' => 'Anibong',
        ]);

        $firstPage = $this->getJson(
            '/api/seniors?centenarians=1&barangay=Anibong&page=1&per_page=1',
            $headers
        );

        $firstPage->assertOk();
        $this->assertCount(1, $firstPage->json('data'));
        $this->assertSame(2, $firstPage->json('meta.total'));
        $this->assertSame(2, $firstPage->json('meta.last_page'));
        $this->assertSame('Anibong', $firstPage->json('data.0.barangay'));

        $secondPage = $this->getJson(
            '/api/seniors?centenarians=1&barangay=Anibong&page=2&per_page=1',
            $headers
        );

        $secondPage->assertOk();
        $this->assertCount(1, $secondPage->json('data'));
        $this->assertSame('Anibong', $secondPage->json('data.0.barangay'));
        $this->assertNotSame(
            $firstPage->json('data.0.name'),
            $secondPage->json('data.0.name')
        );
    }
}
