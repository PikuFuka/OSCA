<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'oscaId' => 'required|string',
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'extensionName' => 'nullable|string|max:10',
            'dateOfBirth' => 'required|date',
            'age' => 'required|integer|min:60',
            'placeOfBirth' => 'nullable|string|max:255',
            'sex' => 'required|in:Male,Female',
            'mothersMaidenName' => 'nullable|string|max:255',
            'pensionStatus' => 'required|string',
            'barangay' => 'required|string|max:255',
            'streetAddress' => 'required|string',
            'contactNumber' => 'nullable|string|max:20',
            'emergencyName' => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:20',
            'rrn' => 'nullable|string|max:50',
            'nationalId' => 'nullable|string|max:50',
            'familyMembers' => 'nullable',
        ];
    }
}
