<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Senior;
use App\Models\FamilyMember;
use App\Models\SeniorDocument;
use App\Models\Request as SeniorRequest;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SeniorController extends Controller
{
    /**
     * Get all seniors with optional filtering
     */
    public function index(Request $request)
    {
        $query = Senior::withCount('familyMembers');

        // Search by name or OSCA ID
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('osca_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        // Filter by barangay
        if ($request->has('barangay') && $request->barangay !== 'All Barangays') {
            $query->where('barangay', $request->barangay);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        
        if ($perPage == -1) {
            // Safety cap - don't allow literal unlimited, but enough for most LGU lists
            $seniors = $query->orderBy('last_name')->limit(1000)->get();
            $transformed = $seniors->map(function($senior) {
                return $this->transformSenior($senior);
            });
            return response()->json(['data' => $transformed]);
        }

        $perPage = min((int) $perPage, 100);
        $seniors = $query->orderBy('last_name')->paginate($perPage);

        $seniors->getCollection()->transform(function($senior) {
            return $this->transformSenior($senior);
        });

        return response()->json($seniors);
    }

    /**
     * Helper to transform senior model to frontend format
     */
    private function transformSenior($senior) {
        return [
            'id' => $senior->osca_id ?? $senior->id,
            'name' => $senior->full_name,
            'age' => $senior->age,
            'gender' => $senior->sex,
            'status' => in_array($senior->status, ['deceased', 'Deceased']) ? 'Deceased' : (in_array($senior->status, ['approved', 'Active']) ? 'Active' : $senior->status),
            'joinedDate' => $senior->created_at->format('M d, Y'),
            'pensionStatus' => $senior->pension_status,
            'barangay' => $senior->barangay,
            'idConfig' => $senior->id_config,
            'idPhoto' => $senior->profile_photo_path ? '/api/storage/profiles/' . basename($senior->profile_photo_path) : null,
            'dateOfBirth' => $senior->date_of_birth?->format('Y-m-d'),
            'firstName' => $senior->first_name,
            'middleName' => $senior->middle_name,
            'lastName' => $senior->last_name,
            'extensionName' => $senior->extension_name,
            'placeOfBirth' => $senior->place_of_birth,
            'mothersMaidenName' => $senior->mothers_maiden_name,
            'streetAddress' => $senior->street_address,
            'contactNumber' => $senior->contact_number,
            'emergencyName' => $senior->emergency_name,
            'emergencyContact' => $senior->emergency_contact,
            'rrn' => $senior->rrn,
            'nationalId' => $senior->national_id,
            'familyMembersCount' => $senior->family_members_count ?? 0,
        ];
    }

    /**
     * Get all deleted seniors
     */
    public function deleted(Request $request)
    {
        $query = Senior::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('osca_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $seniors = $query->orderBy('deleted_at', 'desc')->get();
        $transformed = $seniors->map(function($senior) {
            $data = $this->transformSenior($senior);
            $data['deleted_at'] = $senior->deleted_at->format('M d, Y H:i');
            return $data;
        });

        return response()->json(['data' => $transformed]);
    }

    /**
     * Get all deceased seniors
     */
    public function deceased(Request $request)
    {
        $query = Senior::where('status', 'Deceased');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('osca_id', 'like', "%{$search}%")
                  ->orWhere('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $seniors = $query->orderBy('updated_at', 'desc')->get();
        $transformed = $seniors->map(function($senior) {
            return $this->transformSenior($senior);
        });

        return response()->json(['data' => $transformed]);
    }

    /**
     * Restore a deleted senior
     */
    public function restore($id)
    {
        $senior = Senior::onlyTrashed()->where('osca_id', $id)->orWhere('id', $id)->firstOrFail();
        $senior->restore();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'RESTORED_SENIOR',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
            'details' => ['osca_id' => $senior->osca_id, 'name' => $senior->full_name]
        ]);

        return response()->json(['message' => 'Senior restored successfully', 'senior' => $this->transformSenior($senior)]);
    }

    /**
     * Get the next available OSCA ID
     */
    public function getNextId()
    {
        $nextId = $this->generateOscaId();
        return response()->json([
            'nextId' => $nextId,
            'next_id' => $nextId,
        ]);
    }

    /**
     * Get a single senior by ID
     */
    public function show($id)
    {
        $senior = Senior::with(['familyMembers', 'documents' => function($query) {
                            $query->select(['id', 'senior_id', 'document_type', 'file_name', 'mime_type', 'file_size']);
                        }])
                        ->where('osca_id', $id)
                        ->orWhere('id', $id)
                        ->firstOrFail();

        return response()->json([
            'id' => $senior->osca_id ?? $senior->id,
            'oscaId' => $senior->osca_id,
            'firstName' => $senior->first_name,
            'middleName' => $senior->middle_name,
            'lastName' => $senior->last_name,
            'extensionName' => $senior->extension_name,
            'name' => $senior->full_name,
            'dateOfBirth' => $senior->date_of_birth->format('Y-m-d'),
            'age' => $senior->age,
            'placeOfBirth' => $senior->place_of_birth,
            'sex' => $senior->sex,
            'mothersMaidenName' => $senior->mothers_maiden_name,
            'pensionStatus' => $senior->pension_status,
            'barangay' => $senior->barangay,
            'streetAddress' => $senior->street_address,
            'contactNumber' => $senior->contact_number,
            'emergencyName' => $senior->emergency_name,
            'emergencyContact' => $senior->emergency_contact,
            'rrn' => $senior->rrn,
            'nationalId' => $senior->national_id,
            'status' => $senior->status,
            'familyMembersCount' => $senior->familyMembers->count(),
            'joinedDate' => $senior->created_at->format('M d, Y'),
            'idConfig' => $senior->id_config,
            'idPhoto' => $senior->profile_photo_path ? '/api/storage/profiles/' . basename($senior->profile_photo_path) : null,
            'familyMembers' => $senior->familyMembers,
            'documents' => $senior->documents->map(function($doc) use ($senior) {
                return [
                    'id' => $doc->id,
                    'type' => $doc->document_type,
                    'fileName' => $doc->file_name,
                    'mimeType' => $doc->mime_type,
                    'url' => "/api/seniors/{$senior->osca_id}/documents/{$doc->id}",
                ];
            }),
        ]);
    }

    /**
     * Get profile photo directly (bypassing public link issues)
     */
    public function getProfilePhoto($filename)
    {
        $path = storage_path('app/public/profile_photos/' . $filename);
        
        if (!file_exists($path)) {
            abort(404);
        }

        $lastModified = filemtime($path);
        $etag = md5($filename . $lastModified);

        // Return 304 Not Modified if the client already has the current version
        if (
            request()->header('If-None-Match') === $etag ||
            (request()->header('If-Modified-Since') && strtotime(request()->header('If-Modified-Since')) >= $lastModified)
        ) {
            return response('', 304);
        }

        return response()->file($path, [
            'Cache-Control' => 'public, max-age=86400, immutable',
            'ETag'          => $etag,
            'Last-Modified' => gmdate('D, d M Y H:i:s', $lastModified) . ' GMT',
        ]);
    }

    /**
     * Create a new senior (registration)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'oscaId' => 'nullable|string',
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'required|string|max:255',
            'extensionName' => 'nullable|string|max:10',
            'dateOfBirth' => 'required|date',
            'age' => 'required|integer|min:60',
            'placeOfBirth' => 'nullable|string|max:255',
            'sex' => 'required|in:Male,Female',
            'mothersMaidenName' => 'nullable|string|max:255',
            'pensionStatus' => 'required|string',
            'barangay' => 'required|string|max:255',
            'streetAddress' => 'required|string',
            'contactNumber' => 'nullable|string|max:20',
            'emergencyName' => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:20',
            'rrn' => 'nullable|string|max:50',
            'nationalId' => 'nullable|string|max:50',
            'password' => 'nullable|string|min:6',
            'familyMembers' => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            // ---- Duplicate detection: same name + date of birth ----
            $duplicate = Senior::where('first_name', $validated['firstName'])
                ->where('last_name', $validated['lastName'])
                ->where('date_of_birth', $validated['dateOfBirth'])
                ->first();

            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A senior with the same name and date of birth already exists (OSCA ID: ' . $duplicate->osca_id . '). Please use the "Existing Member" option to update their record instead.',
                ], 409);
            }

            // Generate OSCA ID if not provided or empty
            $oscaId = (!empty($validated['oscaId'])) ? $validated['oscaId'] : $this->generateOscaId();
            
            // Check if already exists (anti-collision)
            while (Senior::where('osca_id', $oscaId)->exists()) {
                $oscaId = $this->generateOscaId();
            }

            $senior = Senior::create([
                'osca_id' => $oscaId,
                'first_name' => $validated['firstName'],
                'middle_name' => $validated['middleName'] ?? null,
                'last_name' => $validated['lastName'],
                'extension_name' => $validated['extensionName'] ?? null,
                'date_of_birth' => $validated['dateOfBirth'],
                'age' => $validated['age'],
                'place_of_birth' => $validated['placeOfBirth'] ?? null,
                'sex' => $validated['sex'] ?? 'Male',
                'mothers_maiden_name' => $validated['mothersMaidenName'] ?? null,
                'pension_status' => $validated['pensionStatus'],
                'barangay' => $validated['barangay'],
                'street_address' => $validated['streetAddress'],
                'contact_number' => $validated['contactNumber'] ?? null,
                'emergency_name' => $validated['emergencyName'] ?? null,
                'emergency_contact' => $validated['emergencyContact'] ?? null,
                'rrn' => $validated['rrn'] ?? null,
                'national_id' => $validated['nationalId'] ?? null,
                'password' => isset($validated['password']) ? Hash::make($validated['password']) : null,
                'status' => 'Pending',
            ]);

            // Handle family members (could be JSON string from FormData)
            $familyMembers = $validated['familyMembers'] ?? [];
            if (is_string($familyMembers)) {
                $familyMembers = json_decode($familyMembers, true);
            }

            if (!empty($familyMembers)) {
                foreach ($familyMembers as $member) {
                    FamilyMember::create([
                        'senior_id' => $senior->id,
                        'name' => $member['name'],
                        'relationship' => $member['relationship'],
                        'age' => $member['age'] ?? null,
                        'civil_status' => $member['civilStatus'] ?? null,
                        'occupation' => $member['occupation'] ?? null,
                        'income' => $member['income'] ?? null,
                    ]);
                }
            }

            // Handle file uploads
            $documentTypes = ['birthCert', 'cedula', 'brgyCert', 'idPicture'];
            foreach ($documentTypes as $type) {
                if ($request->hasFile($type)) {
                    $file = $request->file($type);
                    SeniorDocument::create([
                        'senior_id' => $senior->id,
                        'document_type' => $type,
                        'file_content' => file_get_contents($file->getRealPath()),
                        'file_name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'file_size' => $file->getSize(),
                    ]);

                    if ($type === 'idPicture') {
                        $path = $file->store('profile_photos', 'public');
                        $senior->update(['profile_photo_path' => $path]);
                    }
                }
            }

            // Create approval request
            SeniorRequest::create([
                'senior_id' => $senior->id,
                'type' => 'New Application',
                'status' => 'Pending',
            ]);

            // Log activity
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'REGISTERED_SENIOR',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['osca_id' => $oscaId, 'name' => $senior->full_name],
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Senior registered successfully',
                'senior' => [
                    'id' => $senior->osca_id,
                    'name' => $senior->full_name,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a senior
     */
    public function update(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();

        $validated = $request->validate([
            'firstName' => 'sometimes|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'lastName' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:Active,Pending,Deceased,Inactive',
            'pensionStatus' => 'sometimes|in:Indigent,Pensioner,National Social Pensioner,Local Social Pensioner',
            'barangay' => 'sometimes|string|max:255',
            'streetAddress' => 'sometimes|string',
            'contactNumber' => 'nullable|string|max:20',
            'idConfig' => 'nullable|array',
        ]);

        $senior->update([
            'first_name' => $validated['firstName'] ?? $senior->first_name,
            'middle_name' => $validated['middleName'] ?? $senior->middle_name,
            'last_name' => $validated['lastName'] ?? $senior->last_name,
            'status' => $validated['status'] ?? $senior->status,
            'pension_status' => $validated['pensionStatus'] ?? $senior->pension_status,
            'barangay' => $validated['barangay'] ?? $senior->barangay,
            'street_address' => $validated['streetAddress'] ?? $senior->street_address,
            'contact_number' => $validated['contactNumber'] ?? $senior->contact_number,
            'id_config' => $validated['idConfig'] ?? $senior->id_config,
        ]);

        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;
            
            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'UPDATED_SENIOR',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => $validated,
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Senior updated successfully',
        ]);
    }

    /**
     * Delete a senior
     */
    public function destroy(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();
        
        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'DELETED_SENIOR',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['osca_id' => $senior->osca_id, 'name' => $senior->full_name],
                'ip_address' => $request->ip(),
            ]);
        }

        // We are using SoftDeletes, so we don't delete the profile photo from storage.
        // if ($senior->profile_photo_path) {
        //     \Illuminate\Support\Facades\Storage::disk('public')->delete($senior->profile_photo_path);
        // }

        $senior->delete();

        return response()->json([
            'success' => true,
            'message' => 'Senior deleted successfully',
        ]);
    }

    /**
     * Mark senior as deceased
     */
    public function markDeceased(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();
        $senior->update(['status' => 'Deceased']);

        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'MARKED_DECEASED',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['osca_id' => $senior->osca_id, 'name' => $senior->full_name],
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Senior marked as deceased',
        ]);
    }

    /**
     * Revert deceased status to Active
     */
    public function unDeceased(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();
        $senior->update(['status' => 'Active']);

        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'REVERTED_DECEASED',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['osca_id' => $senior->osca_id, 'name' => $senior->full_name],
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Senior record reverted to Active status',
        ]);
    }

    /**
     * Upload document for a senior
     */
    public function uploadDocument(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();

        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
            'documentType' => 'required|string|in:birthCert,cedula,brgyCert,idPicture',
        ]);

        $file = $request->file('document');

        // Update existing document of this type or create new one to save space
        SeniorDocument::updateOrCreate(
            ['senior_id' => $senior->id, 'document_type' => $request->documentType],
            [
                'file_content' => file_get_contents($file->getRealPath()),
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]
        );

        $path = null;
        if ($request->documentType === 'idPicture') {
            // Delete old photo if it exists
            if ($senior->profile_photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($senior->profile_photo_path);
            }

            $path = $file->store('profile_photos', 'public');
            $senior->update(['profile_photo_path' => $path]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded successfully',
            'path' => $request->documentType === 'idPicture' ? '/api/storage/profiles/' . basename($path) : null,
        ]);
    }

    /**
     * Upload or update profile photo (supports file or base64)
     */
    public function updatePhoto(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->orWhere('id', $id)->firstOrFail();

        $request->validate([
            'photo' => 'required|string', // base64
        ]);

        $photoData = $request->photo;
        $filename = 'profile_' . $senior->osca_id . '_' . time() . '.png';

        if (str_starts_with($photoData, 'data:image')) {
            // Handle Base64
            $imageParts = explode(";base64,", $photoData);
            $image = str_replace(' ', '+', $imageParts[1]);
            
            // Delete old photo if it exists
            if ($senior->profile_photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($senior->profile_photo_path);
            }

            \Illuminate\Support\Facades\Storage::disk('public')->put('profile_photos/' . $filename, base64_decode($image));
            $path = 'profile_photos/' . $filename;
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid photo format'], 422);
        }

        $senior->update(['profile_photo_path' => $path]);

        // Also save to documents as idPicture
        SeniorDocument::updateOrCreate(
            ['senior_id' => $senior->id, 'document_type' => 'idPicture'],
            [
                'file_content' => base64_decode($image),
                'file_name' => $filename,
                'mime_type' => 'image/png',
                'file_size' => strlen(base64_decode($image)),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile photo updated successfully',
            'path' => $path,
            'url' => '/api/storage/profiles/' . $filename
        ]);
    }

    /**
     * Get document content
     */
    public function getDocument(Request $request, $seniorId, $documentId)
    {
        // Optional manual token check if middleware didn't catch it
        // This helps when opening in a new tab via ?token=
        if (!auth('sanctum')->check() && $request->has('token')) {
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->query('token'));
            if ($token && $token->tokenable) {
                // Manually authenticate the user for this request
                auth()->setUser($token->tokenable);
                $request->setUserResolver(fn() => $token->tokenable);
            }
        }

        if (!auth('sanctum')->check() && !auth()->check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $document = SeniorDocument::where('id', $documentId)
                                  ->whereHas('senior', function($q) use ($seniorId) {
                                      $q->where('osca_id', $seniorId)->orWhere('id', $seniorId);
                                  })
                                  ->firstOrFail();

        return response($document->file_content)
            ->header('Content-Type', $document->mime_type)
            ->header('Content-Disposition', 'inline; filename="' . $document->file_name . '"');
    }

    /**
     * Delete a document
     */
    public function deleteDocument($seniorId, $documentId)
    {
        $document = SeniorDocument::where('id', $documentId)
                                  ->whereHas('senior', function($q) use ($seniorId) {
                                      $q->where('osca_id', $seniorId)->orWhere('id', $seniorId);
                                  })
                                  ->firstOrFail();

        // If it's an idPicture, we might want to also clear the profile_photo_path
        if ($document->document_type === 'idPicture') {
            $senior = Senior::where('osca_id', $seniorId)->orWhere('id', $seniorId)->first();
            if ($senior && $senior->profile_photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($senior->profile_photo_path);
                $senior->update(['profile_photo_path' => null]);
            }
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document deleted successfully',
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function statistics(Request $request)
    {
        $barangay = $request->query('barangay');
        $year = $request->query('year');
        
        $isAllYears = !$year || $year === 'All Years';
        
        // Base query for the WHOLE TOWN or selected BARANGAY
        $populationQuery = Senior::query();
        
        // Growth query for registrations (for charts)
        $growthQuery = Senior::query();

        if (!$isAllYears) {
            $endOfYear = "$year-12-31 23:59:59";
            $populationQuery->where('created_at', '<=', $endOfYear);
            $growthQuery->whereYear('created_at', $year);
        }

        if ($barangay && $barangay !== 'All Barangays') {
            $populationQuery->where('barangay', $barangay);
            $growthQuery->where('barangay', $barangay);
        }

        $monthlyStats = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthName = date('M', mktime(0, 0, 0, $m, 1));
            
            // Extract the base queries to avoid repetitive cloning logic complexity
            $baseForMonth = (clone $growthQuery)->whereMonth('created_at', $m);

            $monthlyStats[] = [
                'name' => $monthName,
                'male' => (clone $baseForMonth)->where(function($q) {
                    $q->where('sex', 'like', 'M%')->orWhere('sex', 'like', 'm%');
                })->count(),
                'female' => (clone $baseForMonth)->where(function($q) {
                    $q->where('sex', 'like', 'F%')->orWhere('sex', 'like', 'f%');
                })->count(),
                'deceased' => (clone $baseForMonth)->where(function($q) {
                    $q->where('status', 'like', 'D%')->orWhere('status', 'like', 'd%');
                })->count(),
            ];
        }

        // Heatmap: Show population based on filters
        $heatmapQuery = clone $populationQuery;
        $allBarangayStats = $heatmapQuery->select('barangay as name', DB::raw('count(*) as count'))
                                ->groupBy('barangay')
                                ->orderByDesc('count')
                                ->get();

        $maxDensity = $allBarangayStats->max('count') ?: 1;
        $allBarangayStats = $allBarangayStats->map(function($stat) use ($maxDensity) {
            $stat->intensity = $stat->count / $maxDensity;
            return $stat;
        });

        $stats = [
            'total' => (clone $populationQuery)->count(),
            'active' => (clone $populationQuery)->whereIn('status', ['Active', 'active', 'approved'])->count(),
            'pending' => (clone $populationQuery)->whereIn('status', ['Pending', 'pending'])->count(),
            'deceased' => (clone $populationQuery)->whereIn('status', ['Deceased', 'deceased'])->count(),
            'centenarians' => (clone $populationQuery)->where('age', '>=', 100)->whereNotIn('status', ['Deceased', 'deceased'])->count(),
            'monthlyStats' => $monthlyStats,
            'ageRanges' => [
                ['range' => '60-65', 'count' => (clone $populationQuery)->whereBetween('age', [60, 65])->count()],
                ['range' => '66-70', 'count' => (clone $populationQuery)->whereBetween('age', [66, 70])->count()],
                ['range' => '71-75', 'count' => (clone $populationQuery)->whereBetween('age', [71, 75])->count()],
                ['range' => '76-80', 'count' => (clone $populationQuery)->whereBetween('age', [76, 80])->count()],
                ['range' => '81-85', 'count' => (clone $populationQuery)->whereBetween('age', [81, 85])->count()],
                ['range' => '86-90', 'count' => (clone $populationQuery)->whereBetween('age', [86, 90])->count()],
                ['range' => '91+', 'count' => (clone $populationQuery)->where('age', '>', 90)->count()],
            ],
            'genders' => [
                ['name' => 'Male', 'value' => (clone $populationQuery)->where(function($q) {
                    $q->where('sex', 'like', 'M%')->orWhere('sex', 'like', 'm%');
                })->count()],
                ['name' => 'Female', 'value' => (clone $populationQuery)->where(function($q) {
                    $q->where('sex', 'like', 'F%')->orWhere('sex', 'like', 'f%');
                })->count()],
            ],
            'topBarangays' => $allBarangayStats->take(5),
            'allBarangayStats' => $allBarangayStats,
        ];

        return response()->json($stats);
    }


    /**
     * Generate unique OSCA ID
     */
    private function generateOscaId()
    {
        // Find the max ID that is strictly 4 digits to avoid year-prefixed ones
        $maxId = Senior::whereRaw('LENGTH(osca_id) = 4')->max('osca_id');
        
        $sequence = 1;
        if ($maxId) {
            $sequence = (int)$maxId + 1;
        }
        
        return str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
}
