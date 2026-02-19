<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'client_id',
        'direction',
        'from_email',
        'to_email',
        'subject',
        'body',
        'body_html',
        'attachments',
        'message_id',
        'in_reply_to',
        'sent_at',
        'status',
        'is_read',
    ];

    protected $casts = [
        'attachments' => 'array',
        'sent_at' => 'datetime',
        'is_read' => 'boolean',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(EmailConversation::class, 'conversation_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }

    public function getSnippet(int $length = 100): string
    {
        $text = strip_tags($this->body);
        return strlen($text) > $length ? substr($text, 0, $length) . '...' : $text;
    }
}
