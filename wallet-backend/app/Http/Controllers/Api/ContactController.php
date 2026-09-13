<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * GET /api/contacts - Daftar kontak tersimpan milik user yang sedang login saja.
     */
    public function index(Request $request)
    {
        $contacts = $request->user()->contacts()
            ->with('contactUser:id,username,email,phone')
            ->orderBy('nickname')
            ->get()
            ->map(fn (Contact $contact) => [
                'id' => $contact->id,
                'nickname' => $contact->nickname,
                'username' => $contact->contactUser->username,

                'identifier' => $contact->contactUser->email,
            ]);

        return response()->json([
            'success' => true,
            'data' => $contacts,
        ]);
    }

    /**
     * POST /api/contacts - Simpan user lain (by email/HP) sebagai kontak.
     */
    public function store(StoreContactRequest $request)
    {
        $data = $request->validated();
        $user = $request->user();

        $contactUser = User::where('email', $data['identifier'])
            ->orWhere('phone', $data['identifier'])
            ->first();

        if (! $contactUser) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna dengan email/nomor HP tersebut tidak ditemukan.',
            ], 422);
        }

        if ($contactUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak bisa menyimpan akun sendiri sebagai kontak.',
            ], 422);
        }

        $exists = Contact::where('user_id', $user->id)
            ->where('contact_user_id', $contactUser->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak ini sudah tersimpan sebelumnya.',
            ], 422);
        }

        $contact = Contact::create([
            'user_id' => $user->id,
            'contact_user_id' => $contactUser->id,
            'nickname' => $data['nickname'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kontak berhasil disimpan.',
            'data' => [
                'id' => $contact->id,
                'nickname' => $contact->nickname,
                'username' => $contactUser->username,
                'identifier' => $contactUser->email,
            ],
        ], 201);
    }

    /**
     * DELETE /api/contacts/{contact} - Hapus kontak tersimpan.
     * Query di-scope ke user yang sedang login supaya user lain tidak
     * bisa menghapus kontak milik orang lain.
     */
    public function destroy(Request $request, Contact $contact)
    {
        if ($contact->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Kontak tidak ditemukan.',
            ], 404);
        }

        $contact->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kontak dihapus.',
        ]);
    }
}
