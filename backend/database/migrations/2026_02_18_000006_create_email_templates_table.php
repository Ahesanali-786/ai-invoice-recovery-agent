<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('template_type')->default('organization_invitation'); // type of email
            $table->string('name'); // template name for user reference
            $table->string('subject');
            $table->text('body'); // HTML content
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'template_type']);
            $table->index('template_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
