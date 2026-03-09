<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Senior;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login for Admin/Staff users or Seniors
     */
    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'nullable|string',
            'email' => 'nullable|string',
            'osca_id' => 'nullable|string',
            'password' => 'required|string',
        ]);

        $identifier = $request->identifier ?? $request->email ?? $request->osca_id;

        if (!$identifier) {
            throw ValidationException::withMessages([
                'identifier' => ['An email or OSCA ID is required.'],
            ]);
        }

        // Try to find admin/staff user by email or ID
        $user = User::where('email', $identifier)
                    ->orWhere('id', $identifier)
                    ->first();

        if ($user && Hash::check($request->password, $user->password)) {
            // Update last active
            $user->update(['last_active_at' => now()]);
            
            // Create token
            $token = $user->createToken('auth-token')->plainTextToken;

            // Log the activity
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'LOGIN',
                'target_type' => 'User',
                'target_id' => $user->id,
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'barangay_assignment' => $user->barangay_assignment,
                ],
                'token' => $token,
            ]);
        }

        // Try senior citizen login
        $senior = Senior::where('osca_id', $identifier)->first();
        
        if ($senior && $senior->password && Hash::check($request->password, $senior->password)) {
            // Seniors use Sanctum too for API access if they have dashboards
            $token = $senior->createToken('senior-token')->plainTextToken;

            ActivityLog::create([
                'user_id' => null, // Senior doesn't have a record in `users` table
                'action' => 'LOGIN',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['osca_id' => $senior->osca_id],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $senior->osca_id,
                    'name' => $senior->full_name,
                    'role' => 'Senior',
                    'barangay' => $senior->barangay,
                    'idPhoto' => $senior->profile_photo_path ? asset('storage/' . $senior->profile_photo_path) : null,
                    'force_password_change' => (bool) $senior->force_password_change,
                ],
                'token' => $token,
            ]);
        }

        throw ValidationException::withMessages([
            'identifier' => ['The provided credentials are incorrect.'],
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user();
        
        if ($user instanceof User) {
            return response()->json([
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay_assignment,
            ]);
        }

        if ($user instanceof Senior) {
            return response()->json([
                'id' => $user->osca_id,
                'name' => $user->full_name,
                'role' => 'Senior',
                'barangay' => $user->barangay,
                'force_password_change' => (bool) $user->force_password_change,
            ]);
        }

        return response()->json(['error' => 'Unauthenticated'], 401);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'LOGOUT',
                'target_type' => $isUser ? 'User' : 'Senior',
                'target_id' => $user->id,
                'ip_address' => $request->ip(),
            ]);
            
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    }

    /**
     * Change password (for forced password change after first login)
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!$user || !Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $request->new_password,
            'force_password_change' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
        ]);
    }
}
