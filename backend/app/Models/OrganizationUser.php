<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationUser extends Model
{
    use HasFactory;

    protected $table = 'organization_user';

    protected $fillable = [
        'organization_id',
        'user_id',
        'role',
        'permissions',
        'joined_at',
        'last_accessed_at',
    ];

    protected $casts = [
        'permissions' => 'array',
        'joined_at' => 'datetime',
        'last_accessed_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function getAvailableRoles(): array
    {
        return [
            'owner' => 'Full access to everything',
            'admin' => 'Can manage team and settings',
            'manager' => 'Can create invoices and manage clients',
            'accountant' => 'Can view reports and manage payments',
            'viewer' => 'View only access',
        ];
    }

    public static function getRolePermissions(): array
    {
        return [
            'owner' => ['*'],
            'admin' => [
                'view_dashboard',
                'manage_clients',
                'manage_invoices',
                'send_reminders',
                'view_reports',
                'manage_team',
                'manage_settings',
            ],
            'manager' => [
                'view_dashboard',
                'manage_clients',
                'manage_invoices',
                'send_reminders',
                'view_reports',
            ],
            'accountant' => [
                'view_dashboard',
                'view_clients',
                'view_invoices',
                'record_payments',
                'view_reports',
            ],
            'viewer' => [
                'view_dashboard',
                'view_clients',
                'view_invoices',
            ],
        ];
    }
}
