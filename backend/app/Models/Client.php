<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'organization_id',
        'name',
        'email',
        'phone',
        'whatsapp_number',
        'company',
        'address',
        'tax_id',
        'preferred_contact_method',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function getTotalOutstanding(): float
    {
        return $this
            ->invoices()
            ->where('status', '!=', 'paid')
            ->sum('amount');
    }

    public function getOverdueInvoicesCount(): int
    {
        return $this
            ->invoices()
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->count();
    }
}
