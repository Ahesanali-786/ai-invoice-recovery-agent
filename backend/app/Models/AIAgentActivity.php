<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class AIAgentActivity extends Model
{
    use HasFactory;

    protected $table = 'ai_agent_activities';

    protected $fillable = [
        'organization_id',
        'user_id',
        'type',
        'description',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
