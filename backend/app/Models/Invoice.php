<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'organization_id',
        'client_id',
        'invoice_number',
        'amount',
        'currency',
        'issue_date',
        'due_date',
        'status',
        'description',
        'file_path',
        'ai_extracted_data',
        'reminder_count',
        'last_reminder_sent_at',
        'escalation_level',
        'paid_at',
        'payment_method',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'last_reminder_sent_at' => 'datetime',
        'ai_extracted_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class);
    }

    public function isOverdue(): bool
    {
        return $this->due_date < now()->startOfDay() && $this->status !== 'paid';
    }

    public function daysOverdue(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }
        return $this->due_date->diffInDays(now());
    }

    public function getStatusBadgeColor(): string
    {
        return match ($this->status) {
            'paid' => 'green',
            'pending' => $this->isOverdue() ? 'red' : 'yellow',
            'cancelled' => 'gray',
            default => 'gray',
        };
    }
}
