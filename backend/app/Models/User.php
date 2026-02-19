<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'company_name',
        'phone',
        'timezone',
        'currency',
        'reminder_settings',
        'whatsapp_enabled',
        'current_organization_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'reminder_settings' => 'array',
        'whatsapp_enabled' => 'boolean',
    ];

    protected $attributes = [
        'reminder_settings' => '[]',
        'whatsapp_enabled' => false,
    ];

    public function clients(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function emailTemplates(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EmailTemplate::class);
    }

    public function invoices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function organizations(): BelongsToMany
    {
        return $this
            ->belongsToMany(Organization::class, 'organization_user')
            ->withPivot(['role', 'permissions', 'joined_at', 'last_accessed_at'])
            ->withTimestamps();
    }

    public function currentOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'current_organization_id');
    }

    public function organizationMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    public function auditLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function getCurrentOrganization(): ?Organization
    {
        return $this->currentOrganization ?? $this->organizations->first();
    }

    public function setCurrentOrganization(int $organizationId): void
    {
        if ($this->organizations()->where('organizations.id', $organizationId)->exists()) {
            $this->update(['current_organization_id' => $organizationId]);

            // Update last accessed
            OrganizationUser::where('organization_id', $organizationId)
                ->where('user_id', $this->id)
                ->update(['last_accessed_at' => now()]);
        }
    }

    public function hasRole(int $organizationId, string $role): bool
    {
        return $this
            ->organizations()
            ->where('organizations.id', $organizationId)
            ->wherePivot('role', $role)
            ->exists();
    }

    public function hasPermission(int $organizationId, string $permission): bool
    {
        $membership = OrganizationUser::where('organization_id', $organizationId)
            ->where('user_id', $this->id)
            ->first();

        if (!$membership) {
            return false;
        }

        // Owner has all permissions
        if ($membership->role === 'owner') {
            return true;
        }

        // Admin has specific permissions
        if ($membership->role === 'admin' && !in_array($permission, ['delete_organization', 'manage_billing'])) {
            return true;
        }

        // Check specific permissions
        $permissions = $membership->permissions ?? [];
        return in_array($permission, $permissions);
    }

    public function isOwner(int $organizationId): bool
    {
        return $this->hasRole($organizationId, 'owner');
    }

    public function getTotalRevenue(): float
    {
        return $this->invoices()->where('status', 'paid')->sum('amount');
    }

    public function getOutstandingAmount(): float
    {
        return $this->invoices()->where('status', '!=', 'paid')->sum('amount');
    }

    public function getOverdueAmount(): float
    {
        return $this
            ->invoices()
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->sum('amount');
    }
}
