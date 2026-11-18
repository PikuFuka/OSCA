<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AccountListingTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, string $name, ?string $email = null): User
    {
        return User::create([
            'name' => $name,
            'email' => $email ?? strtolower(str_replace(' ', '.', $name)) . '-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => $role,
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

    public function test_account_listing_is_paginated_in_the_database_instead_of_loading_every_senior(): void
    {
        $admin = $this->makeUser('Admin', 'Test Admin');

        for ($i = 1; $i <= 20; $i++) {
            $this->makeUser('Staff', sprintf('Account A%02d', $i * 2 - 1));
        }
        for ($i = 1; $i <= 20; $i++) {
            $this->makeSenior(sprintf('Account A%02d', $i * 2));
        }

        DB::enableQueryLog();
        $response = $this->getJson(
            '/api/users?tab=All&page=1&per_page=15',
            $this->headers($admin)
        );
        $queries = collect(DB::getQueryLog())->pluck('query');
        DB::disableQueryLog();

        $response->assertOk();
        $this->assertCount(15, $response->json('data'));
        $this->assertSame(41, $response->json('meta.total'));
        $this->assertSame(3, $response->json('meta.last_page'));

        $names = collect($response->json('data'))->pluck('name')->all();
        $sorted = $names;
        sort($sorted, SORT_FLAG_CASE | SORT_STRING);
        $this->assertSame($sorted, $names, 'Accounts should stay sorted by name across both sources.');

        $types = collect($response->json('data'))->pluck('type')->unique()->values()->all();
        $this->assertContains('User', $types);
        $this->assertContains('Senior', $types);

        $this->assertFalse(
            $queries->contains(fn (string $sql) => preg_match('/select\s+\*\s+from\s+["`]?seniors/i', $sql) === 1),
            'The accounts endpoint must not hydrate the entire seniors table.'
        );
        $this->assertTrue(
            $queries->contains(
                fn (string $sql) => str_contains(strtolower($sql), 'union all')
                    && str_contains(strtolower($sql), 'limit')
            ),
            'The accounts page should be produced by a single limited union query.'
        );
    }

    public function test_account_listing_keeps_search_and_tab_filters_working(): void
    {
        $admin = $this->makeUser('Admin', 'Test Admin');
        $this->makeUser('Staff', 'Searchable Staff');
        $this->makeSenior('Searchable Senior');

        $headers = $this->headers($admin);

        $seniorResponse = $this->getJson('/api/users?tab=Senior&search=Searchable', $headers);
        $seniorResponse->assertOk();
        $this->assertCount(1, $seniorResponse->json('data'));
        $this->assertSame('Senior', $seniorResponse->json('data.0.type'));

        $staffResponse = $this->getJson('/api/users?tab=Staff&search=Searchable', $headers);
        $staffResponse->assertOk();
        $this->assertCount(1, $staffResponse->json('data'));
        $this->assertSame('User', $staffResponse->json('data.0.type'));
    }

    public function test_account_listing_excludes_soft_deleted_seniors(): void
    {
        $admin = $this->makeUser('Admin', 'Test Admin');
        $deleted = $this->makeSenior('Deleted Senior');
        $deleted->delete();
        $this->makeSenior('Visible Senior');

        $response = $this->getJson('/api/users?tab=Senior', $this->headers($admin));

        $response->assertOk();
        $names = collect($response->json('data'))->pluck('name')->all();
        $this->assertContains('Visible Senior', $names);
        $this->assertNotContains('Deleted Senior', $names);
    }
}
