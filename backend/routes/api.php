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

// ==========================================
// Public routes
// ==========================================
Route::get('/login', function() {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/register', [SeniorController::class, 'store'])->middleware('throttle:10,1');
Route::get('/seniors/next-id', [SeniorController::class, 'getNextId']);

// ==========================================
// Signature-or-session media routes.
// Served WITHOUT an Authorization header when the URL carries a valid
// short-lived signature (see App\Support\MediaUrls). The controllers ALSO
// accept a normal Sanctum bearer header, and re-check ownership. A bearer
// token passed as ?token= is stripped globally and never works.
// ==========================================
Route::get('/storage/profiles/{filename}', [SeniorController::class, 'getProfilePhoto'])->name('media.photo');
Route::get('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'getDocument'])->name('media.document');

// ==========================================
// Authenticated routes (Requires valid token)
// ==========================================
Route::middleware(['auth:sanctum', 'password.changed'])->group(function () {

    // ----------------------------------------------------------------------
    // Common / Self-Service (Admin, Staff, and Senior Citizens)
    // ----------------------------------------------------------------------
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::post('/requests/update', [RequestController::class, 'storeUpdate']);

    // ----------------------------------------------------------------------
    // Staff & Administrative Routes (Admin and Staff only)
    // NOTE: These MUST be registered before GET /seniors/{id} to avoid
    //       "statistics", "birthdays", "deleted", "deceased" being matched
    //       as dynamic {id} values by the wildcard route below.
    // ----------------------------------------------------------------------
    Route::middleware('role:Admin,Staff')->group(function () {
        // Seniors Registry Management
        Route::get('/seniors', [SeniorController::class, 'index']);
        Route::get('/seniors/deleted', [SeniorController::class, 'deleted']);
        Route::get('/seniors/deceased', [SeniorController::class, 'deceased']);
        Route::get('/seniors/statistics', [SeniorController::class, 'statistics']);
        Route::get('/seniors/birthdays', [SeniorController::class, 'birthdays']);
        Route::post('/seniors', [SeniorController::class, 'store']);
        Route::put('/seniors/{id}', [SeniorController::class, 'update']);
        Route::post('/seniors/{id}/deceased', [SeniorController::class, 'markDeceased']);
        Route::post('/seniors/{id}/photo', [SeniorController::class, 'updatePhoto']);

        // Applications & Approvals
        Route::get('/requests', [RequestController::class, 'index']);
        Route::put('/requests/{id}/approve', [RequestController::class, 'approve']);
        Route::put('/requests/{id}/reject', [RequestController::class, 'reject']);

        // Reports (Registry Export)
        Route::get('/reports/senior-citizens', [ReportController::class, 'seniorCitizens']);

        // Activity Logs (Viewing & Logging)
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
        Route::post('/activity-logs', [ActivityLogController::class, 'store']);
    });

    // ----------------------------------------------------------------------
    // Admin-Only Routes (Strictly Admin only + Cloudflare Access second
    // factor when CLOUDFLARE_ACCESS_TEAM/_AUD are configured; the middleware
    // passes through otherwise so LAN operation is unaffected).
    // ----------------------------------------------------------------------
    Route::middleware(['role:Admin', 'cloudflare.access'])->group(function () {
        // Critical Senior Actions (Deletion / Restores)
        Route::delete('/seniors/{id}', [SeniorController::class, 'destroy']);
        Route::post('/seniors/{id}/restore', [SeniorController::class, 'restore']);
        Route::post('/seniors/{id}/un-deceased', [SeniorController::class, 'unDeceased']);

        // User / Staff Management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // System Maintenance & Audit Log Clearing
        Route::delete('/activity-logs', [ActivityLogController::class, 'clear']);
        Route::get('/backup/export', [BackupController::class, 'export']);
        Route::post('/backup/import', [BackupController::class, 'import']);
    });

    // ----------------------------------------------------------------------
    // Senior Self-Service — Dynamic routes registered LAST so static routes
    // above take precedence over wildcard {id} / {seniorId} segments.
    // Ownership is enforced in the controller for the Senior role.
    // NOTE: GET /seniors/{seniorId}/documents/{documentId} lives in the
    // public section above (signature-or-auth); only mutations stay here.
    // ----------------------------------------------------------------------
    Route::get('/seniors/{id}', [SeniorController::class, 'show']);
    Route::post('/seniors/{id}/documents', [SeniorController::class, 'uploadDocument']);
    Route::delete('/seniors/{seniorId}/documents/{documentId}', [SeniorController::class, 'deleteDocument']);
});
