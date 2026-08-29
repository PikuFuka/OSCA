<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeniorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->osca_id ?? $this->id,
            'oscaId' => $this->osca_id,
            'name' => $this->full_name,
            'age' => $this->age,
            'gender' => $this->sex,
            'status' => $this->status,
            'joinedDate' => $this->created_at?->format('M d, Y') ?? 'N/A',
            'pensionStatus' => $this->pension_status,
            'barangay' => $this->barangay,
            'idPhoto' => $this->profile_photo_path ? '/api/storage/profiles/' . basename($this->profile_photo_path) : null,
            'familyMembersCount' => $this->family_members_count ?? 0,
        ];
    }
}
