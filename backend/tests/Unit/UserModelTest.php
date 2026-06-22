<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use PHPUnit\Framework\TestCase;

class UserModelTest extends TestCase
{
    private User $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new User();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = ['name', 'email', 'password', 'role', 'barangay_assignment', 'status', 'force_password_change', 'last_active_at'];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_count(): void
    {
        $this->assertCount(8, $this->model->getFillable());
    }

    public function test_hidden_contains_password(): void
    {
        $this->assertContains('password', $this->model->getHidden());
    }

    public function test_hidden_contains_remember_token(): void
    {
        $this->assertContains('remember_token', $this->model->getHidden());
    }

    public function test_hidden_only_contains_password_and_remember_token(): void
    {
        $hidden = $this->model->getHidden();
        sort($hidden);
        $this->assertEquals(['password', 'remember_token'], $hidden);
    }

    public function test_casts_email_verified_at_as_datetime(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('email_verified_at', $casts);
        $this->assertEquals('datetime', $casts['email_verified_at']);
    }

    public function test_casts_last_active_at_as_datetime(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('last_active_at', $casts);
        $this->assertEquals('datetime', $casts['last_active_at']);
    }

    public function test_casts_password_as_hashed(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('password', $casts);
        $this->assertEquals('hashed', $casts['password']);
    }

    public function test_custom_casts_count(): void
    {
        $customCasts = array_filter(
            $this->model->getCasts(),
            fn(string $key) => $key !== 'id',
            ARRAY_FILTER_USE_KEY
        );
        $this->assertCount(3, $customCasts);
    }

    public function test_uses_has_api_tokens_trait(): void
    {
        $this->assertTrue(in_array(HasApiTokens::class, class_uses(User::class)));
    }

    public function test_uses_has_factory_trait(): void
    {
        $this->assertTrue(in_array(HasFactory::class, class_uses(User::class)));
    }

    public function test_uses_notifiable_trait(): void
    {
        $this->assertTrue(in_array(Notifiable::class, class_uses(User::class)));
    }

    public function test_does_not_use_soft_deletes(): void
    {
        $this->assertFalse(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(User::class)));
    }
}
