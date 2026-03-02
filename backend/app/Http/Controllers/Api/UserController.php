<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
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

        $users = User::orderBy('name')->get();

        return response()->json([
            'data' => $users->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'barangay_assignment' => $user->barangay_assignment,
                    'status' => $user->status ?? 'Active',
                    'lastActive' => $user->last_active_at?->format('Y-m-d H:i:s'),
                ];
            })
        ]);
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
