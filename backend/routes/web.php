<?php

use Illuminate\Support\Facades\Route;

// Serve React frontend for root path
Route::get('/', function () {
    return file_exists(public_path('index.html'))
        ? file_get_contents(public_path('index.html'))
        : view('welcome');
});

// Catch-all route for React Router (all non-API routes)
Route::get('/{any}', function () {
    return file_exists(public_path('index.html'))
        ? file_get_contents(public_path('index.html'))
        : view('welcome');
})->where('any', '^(?!api).*$');
