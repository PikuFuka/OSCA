<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use App\Http\Requests\ActivityLogStoreRequest;
use App\Http\Resources\ActivityLogResource;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs
     */
    public function index(Request $request)
    {
        // Prune logs older than the configured retention window (0 = keep all).
        $retentionDays = (int) config('audit.retention_days', 90);
        if ($retentionDays > 0) {
            ActivityLog::where('created_at', '<', now()->subDays($retentionDays))->delete();
        }

        $query = ActivityLog::with('user');

        // Search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhere('details->name', 'like', "%{$search}%")
                  ->orWhere('details->senior_name', 'like', "%{$search}%")
                  ->orWhere('details->osca_id', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%");

                // Special case for translated terms
                if (stripos('Approved', $search) !== false) $q->orWhere('action', 'APPROVED_REQUEST');
                if (stripos('Rejected', $search) !== false) $q->orWhere('action', 'REJECTED_REQUEST');
                if (stripos('Senior', $search) !== false) $q->orWhereIn('action', ['REGISTERED_SENIOR', 'UPDATED_SENIOR', 'MARKED_DECEASED', 'PRINTED_ID']);
            });
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date range
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 50));
        // Modular: Resource handles transform (was 20 lines inline)
        return ActivityLogResource::collection($logs);
    }

    /**
     * Store a new activity log — thin via FormRequest + Resource
     */
    public function store(ActivityLogStoreRequest $request)
    {

        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;

        $log = ActivityLog::create([
            'user_id'     => $isUser ? $user->id : null,
            'action'      => $request->action,
            'target_type' => $request->target_type,
            'target_id'   => $request->target_id,
            'details'     => $request->details,
            'ip_address'  => $request->ip(),
        ]);

        return (new ActivityLogResource($log))->additional(['success'=>true])->response()->setStatusCode(201);
    }

    /**
     * Clear all activity logs
     */
    public function clear(Request $request)
    {
        // Only admins can clear logs
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $count = ActivityLog::count();
        ActivityLog::truncate();

        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;

        // Log this action itself (will be the only log remaining)
        ActivityLog::create([
            'user_id'     => $isUser ? $user->id : null,
            'action'      => 'CLEARED_LOGS',
            'target_type' => 'System',
            'target_id'   => null,
            'details'     => ['cleared_count' => $count],
            'ip_address'  => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "All activity logs cleared ({$count} entries removed).",
        ]);
    }
}
