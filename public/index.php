<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Ensure essential runtime directories exist with full write permissions
$runtimeDirs = [
    __DIR__.'/../storage/framework/views',
    __DIR__.'/../storage/framework/cache/data',
    __DIR__.'/../storage/framework/sessions',
    __DIR__.'/../storage/framework/testing',
    __DIR__.'/../storage/logs',
    __DIR__.'/../bootstrap/cache',
    __DIR__.'/../database',
];
foreach ($runtimeDirs as $dir) {
    if (! is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    @chmod($dir, 0777);
}

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
    $dbPath = database_path('database.sqlite');
    if (! file_exists($dbPath)) {
        @touch($dbPath);
    }
    @chmod($dbPath, 0666);
    @chmod(dirname($dbPath), 0777);
    try {
        if (! \Illuminate\Support\Facades\Schema::hasTable('users')) {
            \Illuminate\Support\Facades\Artisan::call('migrate:fresh', [
                '--database' => 'sqlite',
                '--seed' => true,
                '--force' => true,
            ]);
        }
    } catch (\Throwable $e) {
        // Fallback or ignore
    }
}

$app->handleRequest(Request::capture());
