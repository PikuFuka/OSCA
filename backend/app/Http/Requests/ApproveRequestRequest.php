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
        ];
    }
}
