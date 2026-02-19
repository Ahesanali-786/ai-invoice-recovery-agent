<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomatedReminder extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'client_id',
        'organization_id',
        'user_id',
        'current_stage',
        'reminder_count',
        'last_reminder_sent_at',
        'next_scheduled_at',
        'scheduled_hour',
        'scheduled_day',
        'channel',
        'used_personalized_strategy',
        'discount_offered',
        'status',
        'stopped_at',
        'stop_reason',
        'payment_received',
        'payment_received_at',
        'total_reminders_sent',
    ];

    protected $casts = [
        'last_reminder_sent_at' => 'datetime',
        'next_scheduled_at' => 'datetime',
        'stopped_at' => 'datetime',
        'payment_received_at' => 'datetime',
        'discount_offered' => 'decimal:2',
        'used_personalized_strategy' => 'boolean',
        'payment_received' => 'boolean',
        'reminder_count' => 'integer',
        'total_reminders_sent' => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

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

    // Scope for active reminders that need to be sent
    public function scopeReadyToSend($query)
    {
        return $query->where('status', 'active')
            ->where('next_scheduled_at', '<=', now())
            ->whereNull('stopped_at');
    }

    // Scope for active reminders
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Check if can escalate to next stage
    public function canEscalate(): bool
    {
        $stages = ['gentle', 'standard', 'urgent', 'final'];
        $currentIndex = array_search($this->current_stage, $stages);
        
        return $currentIndex !== false && $currentIndex < count($stages) - 1;
    }

    // Escalate to next stage
    public function escalate(): void
    {
        $stages = ['gentle', 'standard', 'urgent', 'final'];
        $currentIndex = array_search($this->current_stage, $stages);
        
        if ($currentIndex !== false && $currentIndex < count($stages) - 1) {
            $this->update([
                'current_stage' => $stages[$currentIndex + 1],
                'reminder_count' => $this->reminder_count + 1,
            ]);
        }
    }

    // Stop reminder sequence
    public function stop(string $reason): void
    {
        $this->update([
            'status' => 'completed',
            'stopped_at' => now(),
            'stop_reason' => $reason,
        ]);
    }

    // Mark payment received
    public function markPaymentReceived(): void
    {
        $this->update([
            'payment_received' => true,
            'payment_received_at' => now(),
            'status' => 'completed',
            'stopped_at' => now(),
            'stop_reason' => 'payment_received',
        ]);
    }

    // Get next stage name
    public function getNextStage(): ?string
    {
        $stages = ['gentle', 'standard', 'urgent', 'final'];
        $currentIndex = array_search($this->current_stage, $stages);
        
        if ($currentIndex !== false && $currentIndex < count($stages) - 1) {
            return $stages[$currentIndex + 1];
        }
        
        return null;
    }
}
