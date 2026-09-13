<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidationValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class TransferRequest extends FormRequest
{
    public const MAX_AMOUNT = 100_000_000;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Penerima diisi dengan email ATAU nomor HP
            'recipient' => ['bail', 'required', 'string'],
            'amount' => ['bail', 'required', 'numeric', 'integer', 'min:1', 'max:' . self::MAX_AMOUNT],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient.required' => 'Email atau nomor HP penerima wajib diisi.',
            'amount.required' => 'Nominal tidak boleh kosong.',
            'amount.numeric' => 'Nominal harus berupa angka.',
            'amount.integer' => 'Nominal harus berupa bilangan bulat, tidak boleh desimal.',
            'amount.min' => 'Nominal harus lebih besar dari 0, tidak boleh negatif atau nol.',
            'amount.max' => 'Nominal melebihi batas maksimum transaksi.',
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
