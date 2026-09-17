<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'osca_id' => 'nullable|string|max:50',
            'reason' => 'nullable|string|max:500',
            // Optional initial password for accounts that have none (e.g. imported
            // records). The owner must still change it on first sign-in.
            'password' => 'nullable|string|min:8|max:255',
        ];
    }
}
