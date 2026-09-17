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
            // Auto-calculate exact age from date_of_birth
            if ($senior->date_of_birth) {
                $senior->age = \Illuminate\Support\Carbon::parse($senior->date_of_birth)->age;
            }
            // Keep osca_id_trim in sync for fallback regular columns (MySQL
            // VIRTUAL columns auto-sync and reject writes). The writability
            // probe (Schema + information_schema) is memoized per process —
            // it must not run on every save (1.6).
            static $trimWritable = null;
            if ($trimWritable === null) {
                $trimWritable = false;
                try {
                    if (\Illuminate\Support\Facades\Schema::hasColumn('seniors', 'osca_id_trim')) {
                        $driver = \Illuminate\Support\Facades\DB::getDriverName();
                        if ($driver === 'sqlite') {
                            // PRAGMA table_xinfo: hidden 2 = VIRTUAL, 3 = STORED.
                            $trimWritable = true;
                            foreach (\Illuminate\Support\Facades\DB::select('PRAGMA table_xinfo(seniors)') as $col) {
                                if (($col->name ?? null) === 'osca_id_trim') {
                                    $trimWritable = ((int) ($col->hidden ?? 0)) === 0;
                                    break;
                                }
                            }
                        } elseif ($driver === 'mysql') {
                            $colType = \Illuminate\Support\Facades\DB::selectOne(
                                "SELECT EXTRA FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'seniors' AND column_name = 'osca_id_trim'"
                            );
                            $extra = $colType->EXTRA ?? '';
                            $trimWritable = stripos($extra, 'VIRTUAL GENERATED') === false
                                && stripos($extra, 'STORED GENERATED') === false;
                        } else {
                            // Other drivers: migration fallback is a plain column.
                            $trimWritable = true;
                        }
                    }
                } catch (\Throwable $e) {
                    // Ignore offline/schema errors
                    $trimWritable = false;
                }
            }
            if ($trimWritable) {
                $senior->setAttribute('osca_id_trim', $senior->osca_id ? trim($senior->osca_id) : null);
                if ($senior->osca_id_trim === '') $senior->setAttribute('osca_id_trim', null);
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
        $parts = array_filter([
            trim((string) $this->first_name),
            trim((string) $this->middle_name),
            trim((string) $this->last_name),
            trim((string) $this->extension_name),
        ], fn($p) => $p !== '');

        return implode(' ', $parts);
    }
}
