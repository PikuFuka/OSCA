<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ActivityLogStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['action' => 'required|string']; }
}
