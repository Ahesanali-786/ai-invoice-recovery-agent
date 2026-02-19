<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('email_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');
            $table->string('subject');
            $table->string('message_id')->unique()->nullable();  // Original email message ID
            $table->string('thread_id')->index()->nullable();  // For grouping email threads
            $table->enum('status', ['active', 'closed', 'spam'])->default('active');
            $table->timestamp('last_reply_at')->nullable();
            $table->integer('reply_count')->default(0);
            $table->timestamps();

            $table->index(['client_id', 'organization_id']);
        });

        Schema::create('email_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('email_conversations')->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->enum('direction', ['incoming', 'outgoing']);
            $table->string('from_email');
            $table->string('to_email');
            $table->string('subject');
            $table->text('body');
            $table->text('body_html')->nullable();
            $table->json('attachments')->nullable();
            $table->string('message_id')->nullable()->index();
            $table->string('in_reply_to')->nullable()->index();  // References parent message
            $table->timestamp('sent_at');
            $table->enum('status', ['sent', 'delivered', 'failed', 'bounce'])->default('delivered');
            $table->boolean('is_read')->default(false);
            $table->timestamps();

            $table->index(['conversation_id', 'direction']);
            $table->index('direction');
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_messages');
        Schema::dropIfExists('email_conversations');
    }
};
