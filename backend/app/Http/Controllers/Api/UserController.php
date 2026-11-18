<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Get all users (admin/staff)
     */
    public function index(Request $request)
    {
        // Only admins can view users
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $search = trim((string) $request->get('search', ''));
        $tab = (string) $request->get('tab', 'All');
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(max((int) $request->get('per_page', 15), 1), 100);

        $accountsQuery = null;

        if (in_array($tab, ['All', 'Admin', 'Staff'], true)) {
            $userQuery = DB::table('users')
                ->selectRaw("'User' as source")
                ->addSelect('id as record_id')
                ->selectRaw('NULL as osca_id')
                ->addSelect('name as display_name')
                ->addSelect('email')
                ->addSelect('role')
                ->selectRaw('barangay_assignment as barangay')
                ->selectRaw('status as record_status')
                ->selectRaw('NULL as first_name')
                ->selectRaw('NULL as last_name')
                ->selectRaw('NULL as profile_photo_path')
                ->selectRaw('LOWER(name) as sort_key');

            if ($tab === 'Admin') $userQuery->where('role', 'Admin');
            if ($tab === 'Staff') $userQuery->where('role', 'Staff');
            if ($search !== '') {
                $userQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%");
                });
            }

            $accountsQuery = $userQuery;
        }

        if (in_array($tab, ['All', 'Senior'], true)) {
            $displayName = $this->seniorDisplayNameExpression();

            $seniorQuery = DB::table('seniors')
                ->whereNull('deleted_at')
                ->selectRaw("'Senior' as source")
                ->addSelect('id as record_id')
                ->addSelect('osca_id')
                ->selectRaw("{$displayName} as display_name")
                ->selectRaw("'' as email")
                ->selectRaw("'Senior Citizen' as role")
                ->addSelect('barangay')
                ->addSelect('status as record_status')
                ->addSelect('first_name')
                ->addSelect('last_name')
                ->addSelect('profile_photo_path')
                ->selectRaw("LOWER({$displayName}) as sort_key");

            if ($search !== '') {
                $seniorQuery->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('osca_id', 'like', "%{$search}%");
                });
            }

            $accountsQuery = $accountsQuery
                ? $accountsQuery->unionAll($seniorQuery)
                : $seniorQuery;
        }

        $seniorCount = DB::table('seniors')->whereNull('deleted_at')->count();
        $allCount = DB::table('users')->count() + $seniorCount;
        $adminCount = DB::table('users')->where('role', 'Admin')->count();
        $staffCount = DB::table('users')->where('role', 'Staff')->count();
        $tabCounts = [
            'All' => $allCount,
            'Admin' => $adminCount,
            'Staff' => $staffCount,
            'Senior' => $seniorCount,
        ];

        if ($accountsQuery === null) {
            $pageItems = [];
            $total = 0;
        } else {
            // Count and page the union inside the database so the endpoint never
            // hydrates the whole registry just to show one page. Without a
            // search term the tab counts already give the exact total.
            $total = $search === ''
                ? (int) match ($tab) {
                    'All' => $allCount,
                    'Senior' => $seniorCount,
                    'Admin' => $adminCount,
                    'Staff' => $staffCount,
                    default => 0,
                }
                : (int) DB::query()->fromSub(clone $accountsQuery, 'accounts')->count();

            $pageItems = DB::query()
                ->fromSub(clone $accountsQuery, 'accounts')
                ->orderBy('sort_key')
                ->orderBy('source')
                ->orderBy('record_id')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get()
                ->map(fn ($row) => $this->formatAccountRow($row))
                ->values()
                ->all();
        }

        return response()->json([
            'data' => $pageItems,
            'meta' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / $perPage)),
                'per_page' => $perPage,
                'total' => $total,
                'from' => $total ? (($page - 1) * $perPage) + 1 : 0,
                'to' => $total ? min($page * $perPage, $total) : 0,
                'tabCounts' => $tabCounts,
            ],
        ]);
    }

    /**
     * Portable SQL expression for a senior's display name.
     */
    private function seniorDisplayNameExpression(): string
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return "TRIM("
                . "COALESCE(first_name, '') || ' ' || "
                . "CASE WHEN COALESCE(middle_name, '') = '' THEN '' ELSE middle_name || ' ' END || "
                . "CASE WHEN COALESCE(last_name, '') = '' THEN '' ELSE last_name || ' ' END || "
                . "COALESCE(extension_name, '')"
                . ")";
        }

        return "TRIM(CONCAT_WS(' ', first_name, NULLIF(middle_name, ''), NULLIF(last_name, ''), NULLIF(extension_name, '')))";
    }

    /**
     * Shape a row produced by the accounts union into the public payload.
     */
    private function formatAccountRow(object $row): array
    {
        if ($row->source === 'User') {
            $status = $row->record_status ?: 'Active';

            return [
                'id' => 'user-' . $row->record_id,
                'name' => $row->display_name,
                'role' => $row->role,
                'barangay' => $row->barangay ?: 'All',
                'status' => $status,
                'email' => $row->email,
                'type' => 'User',
                'originalData' => [
                    'id' => $row->record_id,
                    'name' => $row->display_name,
                    'email' => $row->email,
                    'role' => $row->role,
                    'barangay_assignment' => $row->barangay,
                    'status' => $status,
                ],
            ];
        }

        $name = trim((string) $row->display_name);
        $status = in_array(strtolower((string) $row->record_status), ['active', 'approved'], true)
            ? 'Active'
            : ($row->record_status ?: 'Pending');
        $idPhoto = $row->profile_photo_path
            ? '/api/storage/profiles/' . basename($row->profile_photo_path)
            : null;

        return [
            'id' => 'senior-' . ($row->osca_id ?: $row->record_id),
            'name' => $name,
            'role' => 'Senior Citizen',
            'barangay' => $row->barangay ?: 'Unknown',
            'status' => $status,
            'email' => '',
            'type' => 'Senior',
            'originalData' => [
                'id' => $row->record_id,
                'osca_id' => $row->osca_id,
                'name' => $name,
                'firstName' => $row->first_name,
                'lastName' => $row->last_name,
                'barangay' => $row->barangay,
                'status' => $row->record_status,
                'idPhoto' => $idPhoto,
            ],
        ];
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        // Only admins can create users
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:Admin,Staff',
            'barangay' => 'nullable|string|max:255',
            'barangay_assignment' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'barangay_assignment' => $validated['barangay_assignment'] ?? $validated['barangay'] ?? null,
            'status' => 'Active',
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'CREATED_USER',
            'target_type' => 'User',
            'target_id' => $user->id,
            'details' => ['name' => $user->name, 'role' => $user->role],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'user' => $user,
        ], 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        // Only admins can update users
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|in:Admin,Staff',
            'barangay' => 'nullable|string|max:255',
            'barangay_assignment' => 'nullable|string|max:255',
            'status' => 'sometimes|in:Active,Inactive',
        ]);

        $barangayValue = $validated['barangay_assignment'] ?? $validated['barangay'] ?? $user->barangay_assignment;

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'role' => $validated['role'] ?? $user->role,
            'barangay_assignment' => $barangayValue,
            'status' => $validated['status'] ?? $user->status,
        ]);

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATED_USER',
            'target_type' => 'User',
            'target_id' => $user->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
        ]);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, $id)
    {
        // Only admins can delete users
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $user = User::findOrFail($id);

        // Prevent self-deletion
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete your own account',
            ], 400);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DELETED_USER',
            'target_type' => 'User',
            'target_id' => $user->id,
            'details' => ['name' => $user->name],
            'ip_address' => $request->ip(),
        ]);

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}
