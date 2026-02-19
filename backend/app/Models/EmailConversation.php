<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'organization_id',
        'user_id',
        'invoice_id',
        'subject',
        'message_id',
        'thread_id',
        'status',
        'last_reply_at',
        'reply_count',
    ];

    protected $casts = [
        'last_reply_at' => 'datetime',
        'reply_count' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'conversation_id')->orderBy('sent_at');
    }

    public function incomingMessages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'conversation_id')
            ->where('direction', 'incoming')
            ->orderBy('sent_at');
    }

    public function outgoingMessages(): HasMany
    {
        return $this->hasMany(EmailMessage::class, 'conversation_id')
            ->where('direction', 'outgoing')
            ->orderBy('sent_at');
    }

    public function latestMessage(): ?EmailMessage
    {
        return $this->messages()->latest('sent_at')->first();
    }

    public function markAsRead(): void
    {
        $this->messages()
            ->where('direction', 'incoming')
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function getUnreadCount(): int
    {
        return $this->messages()
            ->where('direction', 'incoming')
            ->where('is_read', false)
            ->count();
    }
}
