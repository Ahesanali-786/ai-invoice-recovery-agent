<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automated_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Who configured this
            
            // Escalation tracking
            $table->enum('current_stage', ['gentle', 'standard', 'urgent', 'final', 'stopped'])->default('gentle');
            $table->integer('reminder_count')->default(0);
            $table->timestamp('last_reminder_sent_at')->nullable();
            $table->timestamp('next_scheduled_at')->nullable();
            
            // Smart scheduling data
            $table->integer('scheduled_hour')->nullable(); // Hour when reminder should be sent
            $table->string('scheduled_day')->nullable(); // Day preference
            $table->enum('channel', ['email', 'whatsapp', 'both'])->default('email');
            
            // AI analysis used
            $table->boolean('used_personalized_strategy')->default(false);
            $table->decimal('discount_offered', 5, 2)->nullable(); // If discount was offered
            
            // Status tracking
            $table->enum('status', ['active', 'paused', 'completed', 'failed'])->default('active');
            $table->timestamp('stopped_at')->nullable(); // When payment received or manually stopped
            $table->string('stop_reason')->nullable(); // 'payment_received', 'manual', 'max_attempts'
            
            // Results
            $table->boolean('payment_received')->default(false);
            $table->timestamp('payment_received_at')->nullable();
            $table->integer('total_reminders_sent')->default(0);
            
            $table->timestamps();
            
            $table->index('next_scheduled_at');
            $table->index(['status', 'next_scheduled_at']);
            $table->index('current_stage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automated_reminders');
    }
};
