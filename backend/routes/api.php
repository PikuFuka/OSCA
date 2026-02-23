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
Route::get('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'getDocument']);
Route::get('/storage/profiles/{filename}', [SeniorController::class, 'getProfilePhoto']);
// Public endpoint to fetch the next available OSCA ID for registration
Route::get('/seniors/next-id', [SeniorController::class, 'getNextId']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Seniors
    Route::get('/seniors', [SeniorController::class, 'index']);
    Route::get('/seniors/deleted', [SeniorController::class, 'deleted']);
    Route::get('/seniors/deceased', [SeniorController::class, 'deceased']);
    Route::post('/seniors/{id}/restore', [SeniorController::class, 'restore']);
    Route::get('/seniors/statistics', [SeniorController::class, 'statistics']);
    Route::get('/seniors/{id}', [SeniorController::class, 'show']);
    Route::post('/seniors', [SeniorController::class, 'store']);
    Route::put('/seniors/{id}', [SeniorController::class, 'update']);
    Route::delete('/seniors/{id}', [SeniorController::class, 'destroy']);
    Route::post('/seniors/{id}/deceased', [SeniorController::class, 'markDeceased']);
    Route::post('/seniors/{id}/un-deceased', [SeniorController::class, 'unDeceased']);
    Route::post('/seniors/{id}/photo', [SeniorController::class, 'updatePhoto']);
    Route::post('/seniors/{id}/documents', [SeniorController::class, 'uploadDocument']);
    Route::delete('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'deleteDocument']);
    
    // Approval Requests
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests/update', [RequestController::class, 'storeUpdate']);
    Route::put('/requests/{id}/approve', [RequestController::class, 'approve']);
    Route::put('/requests/{id}/reject', [RequestController::class, 'reject']);

    // Users (Admin only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    Route::post('/activity-logs', [ActivityLogController::class, 'store']);
    Route::delete('/activity-logs', [ActivityLogController::class, 'clear']);

    // Backup
    Route::get('/backup/export', [BackupController::class, 'export']);
    Route::post('/backup/import', [BackupController::class, 'import']);

    // Reports
    Route::get('/reports/senior-citizens', [ReportController::class, 'seniorCitizens']);
});
