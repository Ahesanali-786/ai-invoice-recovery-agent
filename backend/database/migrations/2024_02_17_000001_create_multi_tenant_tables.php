<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Organizations table
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('tax_number')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->string('timezone', 50)->default('UTC');
            $table->json('settings')->nullable();
            $table->enum('status', ['active', 'suspended', 'cancelled'])->default('active');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_ends_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Organization members (pivot table)
        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'manager', 'accountant', 'viewer'])->default('viewer');
            $table->json('permissions')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('last_accessed_at')->nullable();
            $table->unique(['organization_id', 'user_id']);
            $table->timestamps();
        });

        // Add organization_id to existing tables
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_organization_id')->nullable()->after('id')->constrained('organizations')->nullOnDelete();
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
        });

        // Analytics cache table
        Schema::create('analytics_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->string('type'); // revenue_forecast, at_risk, payment_behavior
            $table->json('data');
            $table->timestamp('calculated_at');
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['organization_id', 'type']);
        });

        // Audit logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // create, update, delete, view, export
            $table->string('entity_type'); // invoice, client, payment
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('analytics_cache');
        
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_organization_id']);
            $table->dropColumn('current_organization_id');
        });

        Schema::dropIfExists('organization_user');
        Schema::dropIfExists('organizations');
    }
};
