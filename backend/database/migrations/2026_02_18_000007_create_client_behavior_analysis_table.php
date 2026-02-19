<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_behavior_analysis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            
            // Payment behavior metrics
            $table->integer('avg_payment_days')->default(0); // Average days to pay
            $table->integer('total_invoices')->default(0);
            $table->integer('paid_on_time_count')->default(0);
            $table->integer('late_payment_count')->default(0);
            $table->decimal('on_time_payment_rate', 5, 2)->default(0); // Percentage
            
            // Optimal engagement times (learned from data)
            $table->integer('optimal_send_hour')->default(9); // 0-23
            $table->string('optimal_send_day')->default('Tuesday'); // Monday-Sunday
            $table->enum('preferred_channel', ['email', 'whatsapp', 'both'])->default('email');
            
            // Response patterns
            $table->integer('email_open_rate')->default(0); // Percentage
            $table->integer('reminder_response_rate')->default(0); // Percentage
            $table->integer('avg_reminders_needed')->default(1); // Before payment
            
            // Discount effectiveness
            $table->decimal('effective_discount_rate', 5, 2)->nullable(); // Best discount % for this client
            $table->boolean('responds_to_discounts')->default(false);
            
            // Risk scoring
            $table->decimal('churn_risk_score', 3, 2)->default(0.0); // 0-1 scale
            $table->enum('risk_category', ['low', 'medium', 'high'])->default('low');
            
            // Last analyzed
            $table->timestamp('last_analyzed_at')->nullable();
            $table->timestamps();
            
            $table->unique(['client_id', 'organization_id']);
            $table->index('risk_category');
            $table->index('churn_risk_score');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_behavior_analysis');
    }
};
