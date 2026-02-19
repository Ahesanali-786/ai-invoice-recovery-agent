<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'address',
        'phone',
        'email',
        'tax_number',
        'registration_number',
        'currency',
        'timezone',
        'settings',
        'status',
        'trial_ends_at',
        'subscription_ends_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($organization) {
            if (empty($organization->slug)) {
                $organization->slug = \Illuminate\Support\Str::slug($organization->name) . '-' . uniqid();
            }
        });
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot(['role', 'permissions', 'joined_at', 'last_accessed_at'])
            ->withTimestamps();
    }

    public function members(): HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function hasActiveSubscription(): bool
    {
        if ($this->isOnTrial()) {
            return true;
        }
        return $this->subscription_ends_at && $this->subscription_ends_at->isFuture();
    }

    public function getMemberRole(int $userId): ?string
    {
        $member = $this->members()->where('user_id', $userId)->first();
        return $member?->role;
    }

    public function hasPermission(int $userId, string $permission): bool
    {
        $member = $this->members()->where('user_id', $userId)->first();
        
        if (!$member) {
            return false;
        }

        // Owner has all permissions
        if ($member->role === 'owner') {
            return true;
        }

        // Admin has most permissions except billing/organization delete
        if ($member->role === 'admin' && !in_array($permission, ['delete_organization', 'manage_billing'])) {
            return true;
        }

        // Check specific permissions from pivot
        $permissions = $member->permissions ?? [];
        return in_array($permission, $permissions);
    }
}
