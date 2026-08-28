<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Senior extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $fillable = [
        'osca_id',
        'first_name',
        'middle_name',
        'last_name',
        'extension_name',
        'date_of_birth',
        'age',
        'place_of_birth',
        'sex',
        'mothers_maiden_name',
        'pension_status',
        'barangay',
        'street_address',
        'contact_number',
        'emergency_name',
        'emergency_contact',
        'rrn',
        'national_id',
        'profile_photo_path',
        'id_config',
        'status',
        'password',
        'force_password_change'
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'id_config' => 'array',
        'password' => 'hashed',
    ];

    protected $appends = ['full_name'];

    protected static function booted(): void
    {
        static::saving(function (self $senior) {
            // Normalize osca_id: trim, empty -> null
            if (array_key_exists('osca_id', $senior->getAttributes()) || $senior->isDirty('osca_id')) {
                $trimmed = trim((string) $senior->osca_id);
                $senior->osca_id = $trimmed === '' ? null : $trimmed;
            }
            // Keep osca_id_trim in sync for fallback regular column (VIRTUAL columns auto-sync)
            try {
                if (\Illuminate\Support\Facades\Schema::hasColumn('seniors', 'osca_id_trim')) {
                    // Only set if column is not VIRTUAL (check via column type)
                    $colType = \Illuminate\Support\Facades\DB::selectOne(
                        "SELECT EXTRA FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'seniors' AND column_name = 'osca_id_trim'"
                    );
                    if ($colType && stripos($colType->EXTRA ?? '', 'VIRTUAL GENERATED') === false && stripos($colType->EXTRA ?? '', 'STORED GENERATED') === false) {
                        $senior->setAttribute('osca_id_trim', $senior->osca_id ? trim($senior->osca_id) : null);
                        if ($senior->osca_id_trim === '') $senior->setAttribute('osca_id_trim', null);
                    }
                }
            } catch (\Throwable $e) {
                // Ignore offline/schema errors
            }
        });
    }

    public function familyMembers()
    {
        return $this->hasMany(\App\Models\FamilyMember::class);
    }

    public function documents()
    {
        return $this->hasMany(\App\Models\SeniorDocument::class);
    }

    public function requests()
    {
        return $this->hasMany(\App\Models\Request::class);
    }

    // Helper to get full name
    public function getFullNameAttribute()
    {
        $name = $this->first_name;
        if ($this->middle_name) {
            $name .= ' ' . $this->middle_name;
        }
        $name .= ' ' . $this->last_name;
        if ($this->extension_name) {
            $name .= ' ' . $this->extension_name;
        }
        return $name;
    }
}
