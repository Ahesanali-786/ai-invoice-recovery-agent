<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_agent_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // chat, task_completed, insight, action_executed
            $table->string('description');
            $table->string('status')->nullable(); // processing, completed, failed
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'type', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agent_activities');
    }
};
