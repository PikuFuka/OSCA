<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SeniorController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/login', function() {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [SeniorController::class, 'store']);
// Public endpoint to fetch the next available OSCA ID for registration
Route::get('/seniors/next-id', [SeniorController::class, 'getNextId']);

// ----------------------------------------------------------------------
// Staff & admin routes (Admin and Staff only).
// NOTE: registered BEFORE the self-service GET /seniors/{id} below so
// static segments (deleted, statistics, ...) are never swallowed by it.
// ----------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'role:Admin,Staff'])->group(function () {
    // Seniors registry management
    Route::get('/seniors', [SeniorController::class, 'index']);
    Route::get('/seniors/deleted', [SeniorController::class, 'deleted']);
    Route::get('/seniors/deceased', [SeniorController::class, 'deceased']);
    Route::post('/seniors/{id}/restore', [SeniorController::class, 'restore']);
    Route::get('/seniors/statistics', [SeniorController::class, 'statistics']);
    Route::get('/seniors/birthdays', [SeniorController::class, 'birthdays']);
    Route::post('/seniors', [SeniorController::class, 'store']);
    Route::put('/seniors/{id}', [SeniorController::class, 'update']);
    Route::delete('/seniors/{id}', [SeniorController::class, 'destroy']);
    Route::post('/seniors/{id}/deceased', [SeniorController::class, 'markDeceased']);
    Route::post('/seniors/{id}/un-deceased', [SeniorController::class, 'unDeceased']);
    Route::post('/seniors/{id}/photo', [SeniorController::class, 'updatePhoto']);
    Route::delete('/seniors/{id}/photo', [SeniorController::class, 'deletePhoto']);
    Route::post('/seniors/{id}/documents', [SeniorController::class, 'uploadDocument']);
    Route::delete('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'deleteDocument']);

    // Approval Requests
    Route::get('/requests', [RequestController::class, 'index']);
    Route::put('/requests/{id}/approve', [RequestController::class, 'approve']);
    Route::put('/requests/{id}/reject', [RequestController::class, 'reject']);

    // Activity Logs (reading & logging; clearing stays Admin-only below)
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [ActivityLogController::class, 'store']);

    // Reports
    Route::get('/reports/senior-citizens', [ReportController::class, 'seniorCitizens']);
});

// ----------------------------------------------------------------------
// Admin-only routes (destructive / full-database scope)
// ----------------------------------------------------------------------
Route::middleware(['auth:sanctum', 'role:Admin'])->group(function () {
    // Users (Admin only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Activity Logs
    Route::delete('/activity-logs', [ActivityLogController::class, 'clear']);

    // Backup
    Route::get('/backup/export', [BackupController::class, 'export']);
    Route::post('/backup/import', [BackupController::class, 'import']);
});

// ----------------------------------------------------------------------
// Self-service routes (any authenticated account, incl. Senior citizens).
// Ownership (own record / own photo / own documents) is enforced inside
// the controllers. Registered LAST so staff statics above take precedence
// over the GET /seniors/{id} wildcard.
// ----------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Senior self-service: own record + own update requests
    Route::get('/seniors/{id}', [SeniorController::class, 'show']);
    Route::post('/requests/update', [RequestController::class, 'storeUpdate']);

    // Media: photos and documents (Senior actors limited to their own)
    Route::get('/storage/profiles/{filename}', [SeniorController::class, 'getProfilePhoto']);
    Route::get('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'getDocument']);
});
