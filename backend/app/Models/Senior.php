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
        'password'
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

    public function familyMembers()
    {
        return $this->hasMany(FamilyMember::class);
    }

    public function documents()
    {
        return $this->hasMany(SeniorDocument::class);
    }

    public function requests()
    {
        return $this->hasMany(Request::class);
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
