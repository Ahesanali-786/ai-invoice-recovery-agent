<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('USD');
            $table->date('issue_date');
            $table->date('due_date');
            $table->enum('status', ['pending', 'paid', 'cancelled', 'disputed'])->default('pending');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->json('ai_extracted_data')->nullable();
            $table->integer('reminder_count')->default(0);
            $table->timestamp('last_reminder_sent_at')->nullable();
            $table->integer('escalation_level')->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'due_date']);
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
