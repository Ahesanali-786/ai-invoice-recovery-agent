<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('email');
            $table->string('role')->default('member');
            $table->string('token', 64)->unique();
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'token']);
            $table->index('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_invitations');
    }
};
