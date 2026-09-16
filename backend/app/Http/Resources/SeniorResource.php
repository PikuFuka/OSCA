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
            'status' => in_array($this->status, ['deceased', 'Deceased']) ? 'Deceased' : (in_array($this->status, ['approved', 'Active']) ? 'Active' : $this->status),
            'joinedDate' => $this->created_at?->format('M d, Y') ?? 'N/A',
            'pensionStatus' => $this->pension_status,
            'barangay' => $this->barangay,
            'streetAddress' => $this->street_address,
            'dateOfBirth' => $this->date_of_birth?->format('Y-m-d'),
            'firstName' => $this->first_name,
            'middleName' => $this->middle_name,
            'lastName' => $this->last_name,
            'extensionName' => $this->extension_name,
            'placeOfBirth' => $this->place_of_birth,
            'mothersMaidenName' => $this->mothers_maiden_name,
            'rrn' => $this->rrn,
            'nationalId' => $this->national_id,
            'contactNumber' => $this->contact_number,
            'emergencyName' => $this->emergency_name,
            'emergencyContact' => $this->emergency_contact,
            'idConfig' => $this->id_config,
            'idPhoto' => $this->profile_photo_path ? '/api/storage/profiles/' . basename($this->profile_photo_path) : null,
            'familyMembersCount' => $this->family_members_count ?? 0,
            'updatedAt' => $this->updated_at?->format('M d, Y h:i A') ?? null,
        ];
    }
}
