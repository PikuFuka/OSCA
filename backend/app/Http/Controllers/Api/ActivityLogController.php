<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get activity logs
     */
    public function index(Request $request)
    {
        // Auto-delete logs older than 24 hours
        ActivityLog::where('created_at', '<', now()->subHours(24))->delete();

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

        $logs = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 50));

        $logs->getCollection()->transform(function($log) {
            // Determine the "User" to display. 
            // If user_id is null, it's likely a senior action (registration/request)
            $userName = 'System';
            if ($log->user) {
                $userName = $log->user->name;
            } else if (isset($log->details['name'])) {
                $userName = $log->details['name'];
            } else if (isset($log->details['senior_name'])) {
                $userName = $log->details['senior_name'];
            }

            // Append ID for seniors to be more specific
            if (!$log->user && isset($log->details['osca_id'])) {
                $userName .= " (#" . $log->details['osca_id'] . ")";
            }

            return [
                'id' => $log->id,
                'action' => $log->action,
                'timestamp' => $log->created_at->toIso8601String(),
                'user' => $userName,
                'details' => $log->details,
                'ip' => $log->ip_address,
            ];
        });

        return response()->json($logs);
    }

    /**
     * Store a new activity log
     */
    public function store(Request $request)
    {
        $request->validate([
            'action' => 'required|string',
        ]);

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

        return response()->json([
            'success' => true,
            'log' => $log
        ], 201);
    }

    /**
     * Clear all activity logs
     */
    public function clear(Request $request)
    {
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
