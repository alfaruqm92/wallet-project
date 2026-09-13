<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidationValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Boleh isi email ATAU nomor HP milik user yang mau disimpan.
            'identifier' => ['required', 'string'],
            'nickname' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'Email atau nomor HP wajib diisi.',
            'nickname.max' => 'Nama panggilan maksimal 50 karakter.',
        ];
    }

    protected function failedValidation(ValidationValidator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
            'errors' => $validator->errors(),
        ], 422));
    }
}
