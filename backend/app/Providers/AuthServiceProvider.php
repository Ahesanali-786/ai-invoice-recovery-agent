<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        \App\Models\Client::class => \App\Policies\ClientPolicy::class,
        \App\Models\Invoice::class => \App\Policies\InvoicePolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}
