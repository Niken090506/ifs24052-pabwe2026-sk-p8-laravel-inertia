<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

// Auto-initialize SQLite database if using SQLite and table is missing
if (config('database.default') === 'sqlite') {
    $dbPath = config('database.connections.sqlite.database') ?: database_path('database.sqlite');
    if (! file_exists($dbPath)) {
        @touch($dbPath);
    }
    try {
        if (! \Illuminate\Support\Facades\Schema::hasTable('users')) {
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);
        }
    } catch (\Throwable $e) {
        // Fallback or ignore
    }
}

$app->handleRequest(Request::capture());
