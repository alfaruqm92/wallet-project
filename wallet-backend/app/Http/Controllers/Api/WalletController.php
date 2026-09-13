<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\InsufficientBalanceException;
use App\Exceptions\RecipientNotFoundException;
use App\Exceptions\SelfTransferException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TopupRequest;
use App\Http\Requests\TransferRequest;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    /**
     * GET /api/wallet - Lihat saldo saat ini milik user yang sedang login.
     */
    public function balance(Request $request)
    {
        $wallet = $request->user()->wallet;

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $wallet->balance,
            ],
        ]);
    }

    /**
     * POST /api/topup - Tambah saldo milik user yang sedang login.
     */
    public function topup(TopupRequest $request)
    {
        $amount = (int) $request->validated()['amount'];
        $user = $request->user();

        $wallet = DB::transaction(function () use ($user, $amount) {
            // Lock baris wallet supaya aman dari race condition kalau ada
            // request top-up yang datang bersamaan.
            $wallet = $user->wallet()->lockForUpdate()->first();

            $wallet->balance += $amount;
            $wallet->save();

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'topup',
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'description' => 'Top up saldo',
            ]);

            return $wallet;
        });

        return response()->json([
            'success' => true,
            'message' => 'Top up berhasil.',
            'data' => [
                'balance' => $wallet->balance,
            ],
        ]);
    }

    /**
     * POST /api/transfer - Kirim saldo ke user lain berdasarkan email/nomor HP.
     *
     * Wajib pakai Database Transaction: kalau saldo pengirim sudah terpotong
     * tapi proses menambah saldo penerima gagal, seluruh proses di-rollback
     * sehingga tidak ada uang yang hilang.
     */
    public function transfer(TransferRequest $request)
    {
        $data = $request->validated();
        $amount = (int) $data['amount'];
        $sender = $request->user();

        try {
            $result = DB::transaction(function () use ($sender, $data, $amount) {
                $recipient = User::where('email', $data['recipient'])
                    ->orWhere('phone', $data['recipient'])
                    ->first();

                if (! $recipient) {
                    throw new RecipientNotFoundException();
                }

                if ($recipient->id === $sender->id) {
                    throw new SelfTransferException();
                }

                // Lock kedua wallet dengan urutan id yang konsisten supaya
                // tidak terjadi deadlock ketika ada transfer berlawanan arah
                // yang berjalan bersamaan (A->B dan B->A di saat yang sama).
                $ids = collect([$sender->id, $recipient->id])->sort()->values();
                $wallets = \App\Models\Wallet::whereIn('user_id', $ids)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('user_id');

                $senderWallet = $wallets[$sender->id];
                $recipientWallet = $wallets[$recipient->id];

                if ($senderWallet->balance < $amount) {
                    throw new InsufficientBalanceException();
                }

                $senderWallet->balance -= $amount;
                $senderWallet->save();

                $recipientWallet->balance += $amount;
                $recipientWallet->save();

                Transaction::create([
                    'user_id' => $sender->id,
                    'type' => 'transfer_out',
                    'amount' => $amount,
                    'balance_after' => $senderWallet->balance,
                    'related_user_id' => $recipient->id,
                    'description' => 'Transfer ke ' . $recipient->username,
                ]);

                Transaction::create([
                    'user_id' => $recipient->id,
                    'type' => 'transfer_in',
                    'amount' => $amount,
                    'balance_after' => $recipientWallet->balance,
                    'related_user_id' => $sender->id,
                    'description' => 'Transfer dari ' . $sender->username,
                ]);

                return [
                    'balance' => $senderWallet->balance,
                    'recipient' => $recipient->username,
                ];
            });
        } catch (InsufficientBalanceException|RecipientNotFoundException|SelfTransferException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transfer berhasil.',
            'data' => $result,
        ]);
    }

    /**
     * GET /api/transfers/recent - Daftar penerima transfer terakhir (unik, terbaru dulu).
     * Diambil otomatis dari riwayat transaksi milik user yang sedang login,
     * tidak perlu tabel/penyimpanan tambahan.
     */
    public function recentRecipients(Request $request)
    {
        $userId = $request->user()->id;

        $recentIds = Transaction::where('user_id', $userId)
            ->where('type', 'transfer_out')
            ->whereNotNull('related_user_id')
            ->orderByDesc('created_at')
            ->pluck('related_user_id')
            ->unique()
            ->take(8)
            ->values();

        $users = User::whereIn('id', $recentIds)->get()->keyBy('id');

        $result = $recentIds
            ->filter(fn ($id) => $users->has($id))
            ->map(fn ($id) => [
                'id' => $users[$id]->id,
                'username' => $users[$id]->username,
                'identifier' => $users[$id]->email,
            ])
            ->values();

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * GET /api/transactions - Riwayat mutasi milik user yang sedang login saja.
     * User A tidak boleh melihat mutasi User B (dijamin lewat $request->user()).
     */
    public function transactions(Request $request)
    {
        $transactions = $request->user()
            ->transactions()
            ->with('relatedUser:id,username')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }
}
