<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/app');
});

Route::get('/app/{any?}', function () {
    $frontendIndex = public_path('app/index.html');

    abort_unless(file_exists($frontendIndex), 503, 'Frontend build not found. Run the frontend production build first.');

    return response()->file($frontendIndex);
})->where('any', '^(?!api).*$');
