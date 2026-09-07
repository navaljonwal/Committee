<?php

namespace App\Providers;

use App\Services\IdEncoder;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')) {
            URL::forceScheme('https');
        }

        Route::bind('id', fn ($value) => IdEncoder::decode($value));
        Route::bind('committeeId', fn ($value) => IdEncoder::decode($value));
        Route::bind('scheduleId', fn ($value) => IdEncoder::decode($value));
        Route::bind('paymentId', fn ($value) => IdEncoder::decode($value));
        Route::bind('bidId', fn ($value) => IdEncoder::decode($value));
    }
}
