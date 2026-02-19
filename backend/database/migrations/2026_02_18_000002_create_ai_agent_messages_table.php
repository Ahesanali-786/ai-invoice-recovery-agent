<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_agent_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant']);
            $table->text('content');
            $table->json('actions')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_agent_messages');
    }
};
