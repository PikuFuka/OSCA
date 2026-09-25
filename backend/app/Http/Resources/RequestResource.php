<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pendingData = $this->pending_data ?? [];
        return [
            'id' => $this->id,
            'name' => $this->senior ? $this->senior->full_name : 'Unknown',
            'type' => $this->type,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'date' => $this->created_at?->format('Y-m-d H:i'),
            'senior_id' => $this->senior_id,
            'senior_osca_id' => $this->senior?->osca_id,
            'pending_data' => $pendingData,
            'details' => [
                // Served by the authenticated /api/storage/profiles controller
                // (the public /storage symlink is intentionally blocked).
                'profilePicture' => ($photoPath = ($pendingData['profile_photo_path'] ?? $this->senior?->profile_photo_path))
                    ? '/api/storage/profiles/' . basename($photoPath)
                    : null,
                'age' => $pendingData['age'] ?? $this->senior?->age,
                'dateOfBirth' => $pendingData['dateOfBirth'] ?? $this->senior?->date_of_birth?->format('Y-m-d'),
                'gender' => $pendingData['sex'] ?? $this->senior?->sex,
                'barangay' => $pendingData['barangay'] ?? $this->senior?->barangay,
                'status' => $this->status,
            ],
        ];
    }
}
