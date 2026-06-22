<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FamilyMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'senior_id',
        'name',
        'relationship',
        'age',
        'civil_status',
        'occupation',
        'income'
    ];

    public function senior()
    {
        return $this->belongsTo(\App\Models\Senior::class);
    }
}
