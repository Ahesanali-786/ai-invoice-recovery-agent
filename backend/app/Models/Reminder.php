<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'type',
        'channel',
        'content',
        'status',
        'sent_at',
        'delivered_at',
        'read_at',
        'response_received',
        'response_content',
        'escalation_level',
        'error_message',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
        'response_received' => 'boolean',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function markAsSent(): void
    {
        $this->update(['status' => 'sent', 'sent_at' => now()]);
    }

    public function markAsDelivered(): void
    {
        $this->update(['status' => 'delivered', 'delivered_at' => now()]);
    }

    public function markAsRead(): void
    {
        $this->update(['status' => 'read', 'read_at' => now()]);
    }

    public function markAsFailed(string $error): void
    {
        $this->update(['status' => 'failed', 'error_message' => $error]);
    }

    public function recordResponse(string $content): void
    {
        $this->update([
            'response_received' => true,
            'response_content' => $content,
        ]);
    }
}
