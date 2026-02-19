<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientBehaviorAnalysis extends Model
{
    use HasFactory;

    protected $table = 'client_behavior_analysis';

    protected $fillable = [
        'client_id',
        'organization_id',
        'avg_payment_days',
        'total_invoices',
        'paid_on_time_count',
        'late_payment_count',
        'on_time_payment_rate',
        'optimal_send_hour',
        'optimal_send_day',
        'preferred_channel',
        'email_open_rate',
        'reminder_response_rate',
        'avg_reminders_needed',
        'effective_discount_rate',
        'responds_to_discounts',
        'churn_risk_score',
        'risk_category',
        'last_analyzed_at',
    ];

    protected $casts = [
        'on_time_payment_rate' => 'decimal:2',
        'churn_risk_score' => 'decimal:2',
        'effective_discount_rate' => 'decimal:2',
        'responds_to_discounts' => 'boolean',
        'email_open_rate' => 'integer',
        'reminder_response_rate' => 'integer',
        'last_analyzed_at' => 'datetime',
        'optimal_send_hour' => 'integer',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    // Scope for high-risk clients
    public function scopeHighRisk($query)
    {
        return $query->where('risk_category', 'high');
    }

    // Scope for discount-responsive clients
    public function scopeRespondsToDiscounts($query)
    {
        return $query->where('responds_to_discounts', true);
    }

    // Get optimal send time in format for scheduling
    public function getOptimalSendTime(): array
    {
        return [
            'hour' => $this->optimal_send_hour,
            'day' => $this->optimal_send_day,
            'channel' => $this->preferred_channel,
        ];
    }

    // Calculate if client qualifies for early payment discount
    public function qualifiesForDiscount(): bool
    {
        return $this->responds_to_discounts && $this->effective_discount_rate > 0;
    }

    // Get recommended discount rate
    public function getRecommendedDiscount(): float
    {
        if (!$this->qualifiesForDiscount()) {
            return 0;
        }
        return min($this->effective_discount_rate, 10); // Cap at 10%
    }
}
