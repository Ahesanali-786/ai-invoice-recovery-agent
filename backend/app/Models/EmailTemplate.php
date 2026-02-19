<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_type',
        'name',
        'subject',
        'body',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForType($query, string $type)
    {
        return $query->where('template_type', $type);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function parseVariables(array $variables): string
    {
        $body = $this->body;

        foreach ($variables as $key => $value) {
            $placeholder = '{{ ' . $key . ' }}';
            $body = str_replace($placeholder, $value, $body);
        }

        return $body;
    }

    public static function getCustomOrDefault(int $userId, string $templateType): ?self
    {
        return self::where('user_id', $userId)
            ->where('template_type', $templateType)
            ->where('is_active', true)
            ->first();
    }
}
