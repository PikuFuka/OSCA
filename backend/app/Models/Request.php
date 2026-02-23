<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Request extends Model
{
    use HasFactory;

    protected $fillable = [
        'senior_id',
        'type',
        'status',
        'pending_data',
        'rejection_reason',
        'action_by'
    ];

    protected $casts = [
        'pending_data' => 'array',
    ];

    public function senior()
    {
        return $this->belongsTo(Senior::class);
    }

    public function actionBy()
    {
        return $this->belongsTo(User::class, 'action_by');
    }
}
