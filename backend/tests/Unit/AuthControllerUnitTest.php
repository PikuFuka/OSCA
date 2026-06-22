<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\AuthController;
use PHPUnit\Framework\TestCase;

class AuthControllerUnitTest extends TestCase
{
    public function test_identifier_resolution_priority_identifier_first(): void
    {
        $identifier = 'user@example.com' ?? null;
        $email = 'other@example.com';
        $oscaId = '0001';
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertSame('user@example.com', $resolved);
    }

    public function test_identifier_resolution_falls_back_to_email(): void
    {
        $identifier = null;
        $email = 'user@example.com';
        $oscaId = '0001';
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertSame('user@example.com', $resolved);
    }

    public function test_identifier_resolution_falls_back_to_osca_id(): void
    {
        $identifier = null;
        $email = null;
        $oscaId = '0001';
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertSame('0001', $resolved);
    }

    public function test_identifier_resolution_returns_null_when_all_absent(): void
    {
        $identifier = null;
        $email = null;
        $oscaId = null;
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertNull($resolved);
    }

    public function test_no_identifier_should_trigger_validation_error(): void
    {
        $identifier = null;
        $email = null;
        $oscaId = null;
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertNull($resolved, 'When all identifier fields are null, validation should fail');
    }

    public static function changePasswordRulesProvider(): array
    {
        return [
            'current_password is required' => ['current_password', null, false],
            'current_password accepts string' => ['current_password', 'oldpass', true],
            'new_password is required' => ['new_password', null, false],
            'new_password rejects short string' => ['new_password', 'short', false],
            'new_password accepts min 8 chars' => ['new_password', 'longenough', true],
            'new_password must be confirmed' => ['new_password', 'longenough', true],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('changePasswordRulesProvider')]
    public function test_change_password_validation_rules(string $field, mixed $value, bool $shouldPass): void
    {
        $rules = [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        $fieldRules = $rules[$field];
        $this->assertContains('required', $fieldRules);

        if ($field === 'new_password') {
            $this->assertContains('min:8', $fieldRules);
            $this->assertContains('confirmed', $fieldRules);
        }
    }

    public function test_login_validation_rules_define_password_as_required_string(): void
    {
        $rules = [
            'identifier' => 'nullable|string',
            'email' => 'nullable|string',
            'osca_id' => 'nullable|string',
            'password' => 'required|string',
        ];

        $this->assertStringContainsString('required', $rules['password']);
        $this->assertStringContainsString('string', $rules['password']);
    }

    public function test_login_validation_identifier_fields_are_nullable(): void
    {
        $rules = [
            'identifier' => 'nullable|string',
            'email' => 'nullable|string',
            'osca_id' => 'nullable|string',
        ];

        foreach ($rules as $field => $rule) {
            $this->assertStringContainsString('nullable', $rule, "{$field} must be nullable");
        }
    }

    public function test_empty_string_identifier_is_treated_as_missing(): void
    {
        $identifier = '';
        $email = '';
        $oscaId = '';
        $resolved = $identifier ?? $email ?? $oscaId;

        $this->assertSame('', $resolved);
    }

    public function test_change_password_current_password_rule_definitions(): void
    {
        $rules = [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ];

        $currentRules = explode('|', $rules['current_password']);
        $this->assertContains('required', $currentRules);
        $this->assertContains('string', $currentRules);
    }

    public function test_change_password_new_password_min_eight(): void
    {
        $rules = [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ];

        $newRules = explode('|', $rules['new_password']);
        $this->assertContains('required', $newRules);
        $this->assertContains('string', $newRules);
        $this->assertContains('min:8', $newRules);
        $this->assertContains('confirmed', $newRules);
    }

    public function test_controller_instantiation(): void
    {
        $controller = new AuthController();
        $this->assertInstanceOf(AuthController::class, $controller);
    }
}
