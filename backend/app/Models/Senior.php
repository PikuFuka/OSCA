<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Senior extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    /**
     * Imported records without a real birthdate all share this date.
     * It must never be treated as a real age source.
     */
    public const PLACEHOLDER_DATE_OF_BIRTH = '1900-01-01';

    /**
     * Oldest verified human lifespan. Stored ages above this are data errors,
     * not a basis for demographic counts.
     */
    public const MAX_VERIFIED_HUMAN_AGE = 122;

    protected $fillable = [
        'osca_id',
        'former_osca_id',
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
        'community_tax_number',
        'issued_on',
        'issued_at',
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
        'issued_on' => 'date',
        'id_config' => 'array',
        'password' => 'hashed',
    ];

    protected $appends = ['full_name'];

    protected static function booted(): void
    {
        static::saving(function (self $senior) {
            if (is_string($senior->status) && strtolower(trim($senior->status)) === 'approved') {
                $senior->status = 'Active';
            }
            // Normalize osca_id: trim, empty -> null
            if (array_key_exists('osca_id', $senior->getAttributes()) || $senior->isDirty('osca_id')) {
                $trimmed = trim((string) $senior->osca_id);
                $senior->osca_id = $trimmed === '' ? null : $trimmed;
            }
            // Auto-calculate exact age from a real date_of_birth. The shared
            // 1900-01-01 placeholder means "unknown"; recalculating from it
            // would turn ordinary seniors into impossible centenarians.
            if ($senior->hasKnownDateOfBirth()) {
                $senior->age = $senior->date_of_birth->age;
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

    /**
     * Identifier to show on historical records. A deceased/deleted member
     * releases their live OSCA ID for reuse, but keeps it for reports.
     */
    public function displayOscaId(): ?string
    {
        return $this->osca_id ?? $this->former_osca_id;
    }

    /**
     * A real birthdate exists. 1900-01-01 is the historic import placeholder
     * and carries no age information.
     */
    public function hasKnownDateOfBirth(): bool
    {
        return $this->date_of_birth !== null
            && $this->date_of_birth->format('Y-m-d') !== self::PLACEHOLDER_DATE_OF_BIRTH;
    }

    /**
     * Age used by the API, exports and reports. Real birthdates win; the
     * placeholder falls back to the stored age only when it is plausible.
     */
    public function resolvedAge(): ?int
    {
        if ($this->hasKnownDateOfBirth()) {
            return (int) $this->date_of_birth->age;
        }

        $storedAge = $this->age;

        if ($storedAge === null || $storedAge < 0 || $storedAge > self::MAX_VERIFIED_HUMAN_AGE) {
            return null;
        }

        return (int) $storedAge;
    }

    /**
     * A living 100+ senior whose age can be trusted. Placeholder birthdates
     * are excluded so unverified imports never become centenarians.
     */
    public function isCentenarian(): bool
    {
        if (!$this->hasKnownDateOfBirth()) {
            return false;
        }

        $age = $this->resolvedAge();

        return $age !== null && $age >= 100;
    }

    /**
     * Restrict a query to seniors with a real birthdate aged 100 or more.
     */
    public function scopeCentenarians(Builder $query): Builder
    {
        $cutoff = \Illuminate\Support\Carbon::today()->subYears(100)->toDateString();

        return $query
            ->whereNotNull('date_of_birth')
            ->whereDate('date_of_birth', '>', self::PLACEHOLDER_DATE_OF_BIRTH)
            ->whereDate('date_of_birth', '<=', $cutoff);
    }

    /**
     * Keep age-based aggregates free of impossible placeholder ages while
     * retaining real birthdates and plausible stored fallbacks.
     */
    public function scopePlausibleAge(Builder $query): Builder
    {
        return $query->where(function (Builder $query) {
            $query->whereDate('date_of_birth', '>', self::PLACEHOLDER_DATE_OF_BIRTH)
                ->orWhere(function (Builder $query) {
                    $query->whereDate('date_of_birth', self::PLACEHOLDER_DATE_OF_BIRTH)
                        ->where('age', '<=', self::MAX_VERIFIED_HUMAN_AGE);
                });
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

    public function vacancyRecord()
    {
        return $this->hasOne(OscaIdVacancy::class);
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
