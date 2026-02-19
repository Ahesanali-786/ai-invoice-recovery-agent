<?php

return [
    /*
     * |--------------------------------------------------------------------------
     * | Application Name
     * |--------------------------------------------------------------------------
     */
    'name' => env('APP_NAME', 'Laravel'),

    /*
     * |--------------------------------------------------------------------------
     * | Application Environment
     * |--------------------------------------------------------------------------
     */
    'env' => env('APP_ENV', 'production'),

    /*
     * |--------------------------------------------------------------------------
     * | Application Debug Mode
     * |--------------------------------------------------------------------------
     */
    'debug' => (bool) env('APP_DEBUG', false),

    /*
     * |--------------------------------------------------------------------------
     * | Application URL
     * |--------------------------------------------------------------------------
     */
    'url' => env('APP_URL', 'http://localhost'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'asset_url' => env('ASSET_URL', 'http://localhost:3000'),

    /*
     * |--------------------------------------------------------------------------
     * | Application Timezone
     * |--------------------------------------------------------------------------
     */
    'timezone' => 'UTC',

    /*
     * |--------------------------------------------------------------------------
     * | Application Locale Configuration
     * |--------------------------------------------------------------------------
     */
    'locale' => env('APP_LOCALE', 'en'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
     * |--------------------------------------------------------------------------
     * | Encryption Key
     * |--------------------------------------------------------------------------
     */
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',

    /*
     * |--------------------------------------------------------------------------
     * | Maintenance Mode Driver
     * |--------------------------------------------------------------------------
     */
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

    /*
     * |--------------------------------------------------------------------------
     * | Autoloaded Service Providers
     * |--------------------------------------------------------------------------
     */
    'providers' => [
        Illuminate\Auth\AuthServiceProvider::class,
        Illuminate\Broadcasting\BroadcastServiceProvider::class,
        Illuminate\Bus\BusServiceProvider::class,
        Illuminate\Cache\CacheServiceProvider::class,
        Illuminate\Foundation\Providers\ConsoleSupportServiceProvider::class,
        Illuminate\Cookie\CookieServiceProvider::class,
        Illuminate\Database\DatabaseServiceProvider::class,
        Illuminate\Encryption\EncryptionServiceProvider::class,
        Illuminate\Filesystem\FilesystemServiceProvider::class,
        Illuminate\Foundation\Providers\FoundationServiceProvider::class,
        Illuminate\Hashing\HashServiceProvider::class,
        Illuminate\Mail\MailServiceProvider::class,
        Illuminate\Notifications\NotificationServiceProvider::class,
        Illuminate\Pagination\PaginationServiceProvider::class,
        Illuminate\Pipeline\PipelineServiceProvider::class,
        Illuminate\Queue\QueueServiceProvider::class,
        Illuminate\Redis\RedisServiceProvider::class,
        Illuminate\Auth\Passwords\PasswordResetServiceProvider::class,
        Illuminate\Session\SessionServiceProvider::class,
        Illuminate\Translation\TranslationServiceProvider::class,
        Illuminate\Validation\ValidationServiceProvider::class,
        Illuminate\View\ViewServiceProvider::class,
        App\Providers\AppServiceProvider::class,
        App\Providers\AuthServiceProvider::class,
        App\Providers\EventServiceProvider::class,
        App\Providers\RouteServiceProvider::class,
    ],

    /*
     * |--------------------------------------------------------------------------
     * | Class Aliases
     * |--------------------------------------------------------------------------
     */
    'aliases' => [],
];
