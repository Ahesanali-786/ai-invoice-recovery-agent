<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['gentle', 'standard', 'urgent', 'final', 'escalation'])->default('gentle');
            $table->enum('channel', ['email', 'whatsapp', 'sms'])->default('email');
            $table->text('content');
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->boolean('response_received')->default(false);
            $table->text('response_content')->nullable();
            $table->integer('escalation_level')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['invoice_id', 'status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
