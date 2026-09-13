<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // topup        : saldo bertambah dari top-up
            // transfer_out : saldo berkurang karena mengirim ke user lain
            // transfer_in  : saldo bertambah karena menerima dari user lain
            $table->enum('type', ['topup', 'transfer_out', 'transfer_in']);
            $table->unsignedBigInteger('amount');
            $table->unsignedBigInteger('balance_after');
            $table->foreignId('related_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
