<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OscaIdVacancy extends Model
{
    public const REASON_DECEASED = 'Deceased';
    public const REASON_DELETED = 'Deleted';

    protected $fillable = [
        'osca_id',
        'senior_id',
        'past_holder_name',
        'reason',
        'vacated_at',
    ];

    protected $casts = [
        'vacated_at' => 'datetime',
    ];

    public function senior()
    {
        return $this->belongsTo(Senior::class);
    }
}
