<?php

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

// Ensure sqlite database exists with permissions
$dbPath = __DIR__.'/../database/database.sqlite';
if (! file_exists($dbPath)) {
    @touch($dbPath);
}
@chmod($dbPath, 0666);

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
