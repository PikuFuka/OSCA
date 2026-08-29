<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SeniorUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'oscaId' => 'sometimes|nullable|string|max:255',
            'firstName' => 'sometimes|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'sometimes|string|max:255',
            'extensionName' => 'sometimes|nullable|string|max:10',
            'dateOfBirth' => 'sometimes|date',
            'status' => 'sometimes|in:Active,Pending,Deceased,Inactive',
            'pensionStatus' => 'sometimes|in:Indigent,Pensioner,National Social Pensioner,Local Social Pensioner,None',
            'barangay' => 'sometimes|string|max:255',
            'streetAddress' => 'sometimes|string',
            'contactNumber' => 'nullable|string|max:20',
            'idConfig' => 'nullable|array',
        ];
    }
}
