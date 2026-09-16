<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Senior;
use App\Models\FamilyMember;
use App\Models\SeniorDocument;
use App\Models\Request as SeniorRequest;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Http\Requests\SeniorStoreRequest;
use App\Http\Requests\SeniorUpdateRequest;
use App\Http\Resources\SeniorResource;
use App\Services\Senior\SeniorService;
use App\Services\Senior\DocumentService;

class SeniorController extends Controller
{
    private function applyValidOscaIdScope($query)
    {
        static $hasTrim = null;
        if ($hasTrim === null) {
            try {
                $hasTrim = \Illuminate\Support\Facades\Schema::hasColumn('seniors', 'osca_id_trim');
            } catch (\Throwable $e) {
                $hasTrim = false;
            }
        }
        if ($hasTrim) {
            return $query->whereNotNull('osca_id_trim')->where('osca_id_trim', '<>', '');
        }
        return $query->whereNotNull('osca_id')->whereRaw("TRIM(osca_id) <> ''");
    }

    private function hasFulltextIndex(): bool
    {
        static $hasFt = null;
        if ($hasFt !== null) return $hasFt;
        try {
            $hasFt = (bool) \Illuminate\Support\Facades\DB::selectOne(
                "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'seniors' AND index_name = 'seniors_ft_name' LIMIT 1"
            );
        } catch (\Throwable $e) {
            $hasFt = false;
        }
        return $hasFt;
    }

    private function applySeniorSearch($query, string $search): void
    {
        $search = trim($search);
        if ($search === '') {
            return;
        }

        $terms = preg_split('/\s+/', $search) ?: [];
        $terms = array_values(array_filter($terms, fn($t) => $t !== ''));

        $query->where(function ($q) use ($search, $terms) {
            $q->where('osca_id', 'like', "%{$search}%");

            if ($terms === []) return;

            // Prefer FULLTEXT boolean mode for name search (uses seniors_ft_name index)
            if ($this->hasFulltextIndex() && count($terms) <= 5) {
                $boolean = implode(' ', array_map(function ($t) {
                    $clean = preg_replace('/[^\p{L}\p{N}]/u', '', $t);
                    if ($clean === '' || mb_strlen($clean) < 2) return '';
                    return '+' . $clean . '*';
                }, $terms));
                $boolean = trim($boolean);
                if ($boolean !== '' && $boolean !== '+' && $boolean !== '+*') {
                    $q->orWhereRaw("MATCH(first_name, middle_name, last_name) AGAINST(? IN BOOLEAN MODE)", [$boolean]);
                    return;
                }
            }

            // Fallback: LIKE per-term (original behavior) — kept for when FT not yet migrated or boolean empty
            $q->orWhere(function ($nameQuery) use ($terms) {
                foreach ($terms as $term) {
                    $nameQuery->where(function ($termQuery) use ($term) {
                        $termQuery->where('first_name', 'like', "%{$term}%")
                            ->orWhere('middle_name', 'like', "%{$term}%")
                            ->orWhere('last_name', 'like', "%{$term}%")
                            ->orWhere('extension_name', 'like', "%{$term}%");
                    });
                }
            });
        });
    }

    private function findSeniorByIdentifier($identifier): Senior
    {
        $senior = $this->applyValidOscaIdScope(Senior::query())
            ->where('osca_id', (string) $identifier)
            ->first();

        if (!$senior && is_numeric($identifier)) {
            $senior = Senior::find($identifier);
        }

        if (!$senior) {
            abort(404, 'Senior not found.');
        }

        return $senior;
    }

    /**
     * Get all seniors with optional filtering — optimized for fast search
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->get('search', ''));
        $hasSearch = $search !== '';
        $barangay = $request->get('barangay');
        $status = $request->get('status');
        $minAge = $request->get('min_age');
        $maxAge = $request->get('max_age');
        $category = $request->get('category');
        $page = (int) $request->get('page', 1);
        $perPageRaw = $request->get('per_page', 15);
        $sortBy = $request->get('sort', 'last_name');
        $sortOrder = $request->get('order', 'asc');
        $allowedSortColumns = ['last_name', 'first_name', 'created_at', 'updated_at', 'barangay', 'status', 'age'];
        if (!in_array($sortBy, $allowedSortColumns)) $sortBy = 'last_name';
        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        // Fast-path: cache paginated search results for 45s (file cache, offline-friendly)
        $cacheVersion = Cache::get('seniors:cache_version', 1);
        $cacheKey = sprintf(
            'seniors:index:v%s:%s:%s:%s:%s:%s:%s:%s:%s:%s:%s',
            $cacheVersion,
            $hasSearch ? md5($search) : 'nosearch',
            $barangay ?? 'all',
            $status ?? ($request->has('status') ? $status : 'default-active'),
            $minAge ?? 'nomin',
            $maxAge ?? 'nomax',
            $category ?? 'allcat',
            $perPageRaw,
            $sortBy,
            $sortOrder,
            $page
        );
        $shouldCache = $hasSearch || $request->has('barangay') || $request->has('page') || $request->has('min_age') || $request->has('max_age') || $request->has('category');

        $exec = function () use ($request, $search, $hasSearch, $barangay, $status, $minAge, $maxAge, $category, $perPageRaw, $sortBy, $sortOrder) {
            $query = Senior::withCount('familyMembers')
                ->select(['id','osca_id','first_name','middle_name','last_name','extension_name','date_of_birth','age','place_of_birth','sex','mothers_maiden_name','pension_status','barangay','street_address','contact_number','emergency_name','emergency_contact','rrn','national_id','profile_photo_path','id_config','status','created_at','updated_at']);

            if (!$request->has('status')) {
                $query->where('status', 'Active');
            } elseif ($status && $status !== 'All') {
                $query->where('status', $status);
            }

            if ($hasSearch) {
                $this->applySeniorSearch($query, $search);
            }

            if ($barangay && $barangay !== 'All Barangays') {
                $query->where('barangay', $barangay);
            }

            if (is_numeric($minAge) && (int) $minAge >= 0) {
                $query->where('age', '>=', (int) $minAge);
            }

            if (is_numeric($maxAge) && (int) $maxAge >= 0) {
                $query->where('age', '<=', (int) $maxAge);
            }

            if ($category && $category !== 'All Categories') {
                $query->where(function ($q) use ($category) {
                    $lower = strtolower(trim((string) $category));
                    if ($lower === 'national') {
                        $q->whereRaw('LOWER(pension_status) LIKE ?', ['%national%']);
                    } elseif ($lower === 'local') {
                        $q->whereRaw('LOWER(pension_status) LIKE ?', ['%local%']);
                    } elseif ($lower === 'pensioner') {
                        $q->whereRaw('LOWER(pension_status) LIKE ?', ['%pensioner%'])
                          ->whereRaw('LOWER(pension_status) NOT LIKE ?', ['%social%']);
                    } elseif ($lower === 'indigent') {
                        $q->whereRaw('LOWER(pension_status) LIKE ?', ['%indigent%']);
                    } elseif ($lower === 'none') {
                        $q->where('pension_status', 'None')->orWhereNull('pension_status');
                    } else {
                        $q->where('pension_status', $category);
                    }
                });
            }

            if ((int) $perPageRaw == -1) {
                // Allow full export for Accounts/BatchPrint — select is limited to 23 columns so 5k+ rows is ~2MB
                $seniors = $query->orderBy($sortBy, $sortOrder)->get();
                $transformed = $seniors->map(fn($s) => $this->transformSenior($s));
                return response()->json(['data' => $transformed, 'total' => $transformed->count()]);
            }

            $perPage = min((int) $perPageRaw, 100);
            $seniors = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
            // Modular: use Resource instead of inline transformSenior (legacy kept for reference)
            return \App\Http\Resources\SeniorResource::collection($seniors);
        };

        if ($shouldCache) {
            $cached = Cache::remember($cacheKey, now()->addSeconds(45), $exec);
            return $cached;
        }

        return $exec();
    }

    /**
     * Helper to transform senior model to frontend format
     */
    private function transformSenior($senior) {
        return [
            'id' => $senior->osca_id ?? $senior->id,
            'oscaId' => $senior->osca_id,
            'name' => $senior->full_name,
            'age' => $senior->age,
            'gender' => $senior->sex,
            'status' => in_array($senior->status, ['deceased', 'Deceased']) ? 'Deceased' : (in_array($senior->status, ['approved', 'Active']) ? 'Active' : $senior->status),
            'joinedDate' => $senior->created_at?->format('M d, Y') ?? 'N/A',
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
            'updatedAt' => $senior->updated_at?->format('M d, Y h:i A') ?? null,
        ];
    }

    /**
     * Get all deleted seniors
     */
    public function deleted(Request $request)
    {
        $query = Senior::onlyTrashed();

        if ($request->has('search')) {
            $this->applySeniorSearch($query, (string) $request->search);
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
            $this->applySeniorSearch($query, (string) $request->search);
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
        $senior = Senior::onlyTrashed()->where('osca_id', $id)->firstOrFail();
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
        // OSCA ID is now assigned by admin during approval
        return response()->json([
            'message' => 'OSCA ID is assigned by admin during approval.',
        ]);
    }

    /**
     * Get a single senior by ID
     */
    public function show($id)
    {
        $senior = Senior::with(['familyMembers', 'documents' => function($query) {
                            $query->select(['id', 'senior_id', 'document_type', 'file_path', 'file_name', 'mime_type', 'file_size']);
                        }])
                        ->whereNotNull('osca_id')
                        ->whereRaw("TRIM(osca_id) <> ''")
                        ->where('osca_id', $id)
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
     * Create a new senior (registration) — thin controller, logic in SeniorService
     */
    public function store(SeniorStoreRequest $request, SeniorService $service)
    {
        try {
            $senior = $service->register($request->validated(), $request, $request->user());
            return response()->json([
                'success' => true,
                'message' => 'Senior registered successfully. OSCA ID will be assigned upon approval.',
                'senior' => new SeniorResource($senior),
            ], 201);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a senior — thin controller via FormRequest + Service + Resource
     */
    public function update(SeniorUpdateRequest $request, $id, SeniorService $service)
    {
        $senior = $this->findSeniorByIdentifier($id);
        $updated = $service->updateSenior($senior, $request->validated(), $request->user());

        if ($request->user()) {
            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;
            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'UPDATED_SENIOR',
                'target_type' => 'Senior',
                'target_id' => $updated->id,
                'details' => $request->validated(),
                'ip_address' => $request->ip(),
            ]);
        }

        if (Cache::has('seniors:cache_version')) {
            Cache::increment('seniors:cache_version');
        } else {
            Cache::forever('seniors:cache_version', 2);
        }

        return response()->json([
            'success' => true,
            'message' => 'Senior updated successfully',
            'senior' => new SeniorResource($updated),
        ]);
    }

    /**
     * Delete a senior
     */
    public function destroy(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->firstOrFail();
        
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
        $senior = Senior::where('osca_id', $id)->firstOrFail();
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
        $senior = Senior::where('osca_id', $id)->firstOrFail();
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
        $senior = $this->findSeniorByIdentifier($id);

        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
            'documentType' => 'required|string|in:birthCert,cedula,brgyCert,idPicture',
        ]);

        try {
            $file = $request->file('document');
            $binary = file_get_contents($file->getRealPath());
            $fileName = $file->getClientOriginalName();
            $safeName = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
            $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
            $docFileName = $safeName . '.' . $ext;
            $filePath = "documents/{$senior->id}/" . time() . "_{$request->documentType}_{$docFileName}";

            // Clean up previous document's filesystem file if replacing
            $existing = SeniorDocument::where('senior_id', $senior->id)->where('document_type', $request->documentType)->first();
            if ($existing && $existing->file_path) {
                Storage::disk('local')->delete($existing->file_path);
            }

            Storage::disk('local')->put($filePath, $binary);

            SeniorDocument::updateOrCreate(
                ['senior_id' => $senior->id, 'document_type' => $request->documentType],
                [
                    'file_content' => null,
                    'file_path' => $filePath,
                    'file_name' => $fileName,
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                ]
            );

            $path = null;
            if ($request->documentType === 'idPicture') {
                // Delete old photo if it exists
                if ($senior->profile_photo_path) {
                    Storage::disk('public')->delete($senior->profile_photo_path);
                }

                $path = $file->store('profile_photos', 'public');
                $senior->update(['profile_photo_path' => $path]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'path' => $request->documentType === 'idPicture' ? '/api/storage/profiles/' . basename($path) : null,
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            // Log database error (stripped of binary/bindings) to prevent JSON encoding crashes
            \Log::error("Database error during document upload: " . $e->getMessage());
            
            // Check for max_allowed_packet error
            if (str_contains($e->getMessage(), 'packet') || str_contains($e->getMessage(), 'too large')) {
                 return response()->json(['success' => false, 'message' => 'File too large for database setting (max_allowed_packet). Try a smaller file.'], 413);
            }
            return response()->json(['success' => false, 'message' => 'Database error while saving document.'], 500);

        } catch (\Exception $e) {
            \Log::error("Document upload failed: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Upload failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Upload or update profile photo (supports file or base64)
     */
    public function updatePhoto(Request $request, $id)
    {
        $senior = Senior::where('osca_id', $id)->firstOrFail();

        $request->validate([
            'photo' => 'required|string', // base64
        ]);

        try {
            $photoData = $request->photo;
            $filename = 'profile_' . $senior->osca_id . '_' . time() . '.png';
            $image = null;
            $path = null;

            if (str_starts_with($photoData, 'data:image')) {
                // Handle Base64
                $imageParts = explode(";base64,", $photoData);
                $image = str_replace(' ', '+', $imageParts[1]);
                $binaryImage = base64_decode($image);
                
                // Delete old photo if it exists
                if ($senior->profile_photo_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($senior->profile_photo_path);
                }

                \Illuminate\Support\Facades\Storage::disk('public')->put('profile_photos/' . $filename, $binaryImage);
                $path = 'profile_photos/' . $filename;
            } else {
                return response()->json(['success' => false, 'message' => 'Invalid photo format'], 422);
            }

            $senior->update(['profile_photo_path' => $path]);

            // Also save to documents as idPicture — filesystem first
            $docFilePath = "documents/{$senior->id}/" . time() . "_idPicture_{$filename}";
            // Remove previous file if replacing
            $prev = SeniorDocument::where('senior_id', $senior->id)->where('document_type', 'idPicture')->first();
            if ($prev && $prev->file_path) {
                Storage::disk('local')->delete($prev->file_path);
            }
            Storage::disk('local')->put($docFilePath, $binaryImage);

            SeniorDocument::updateOrCreate(
                ['senior_id' => $senior->id, 'document_type' => 'idPicture'],
                [
                    'file_content' => null,
                    'file_path' => $docFilePath,
                    'file_name' => $filename,
                    'mime_type' => 'image/png',
                    'file_size' => strlen($binaryImage),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Profile photo updated successfully',
                'path' => $path,
                'url' => '/api/storage/profiles/' . $filename
            ]);

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error("Database error updating photo: " . $e->getMessage());
            
            if (str_contains($e->getMessage(), 'packet') || str_contains($e->getMessage(), 'too large')) {
                 return response()->json(['success' => false, 'message' => 'Image too large for database. Try a smaller one.'], 413);
            }
            return response()->json(['success' => false, 'message' => 'Database error while saving photo.'], 500);

        } catch (\Exception $e) {
             \Log::error("Photo update failed: " . $e->getMessage());
             return response()->json(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()], 500);
        }
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

        $senior = $this->findSeniorByIdentifier($seniorId);

        $document = SeniorDocument::where('id', $documentId)
                                  ->where('senior_id', $senior->id)
                                  ->firstOrFail();

        $binary = $document->getFileBinary();
        if ($binary === null) {
            abort(404, 'Document file not found.');
        }

        return response($binary)
            ->header('Content-Type', $document->mime_type)
            ->header('Content-Disposition', 'inline; filename="' . $document->file_name . '"');
    }

    /**
     * Delete a document
     */
    public function deleteDocument($seniorId, $documentId)
    {
        $senior = $this->findSeniorByIdentifier($seniorId);

        $document = SeniorDocument::where('id', $documentId)
                                  ->where('senior_id', $senior->id)
                                  ->firstOrFail();

        // If it's an idPicture, we might want to also clear the profile_photo_path
        if ($document->document_type === 'idPicture') {
            if ($senior && $senior->profile_photo_path) {
                Storage::disk('public')->delete($senior->profile_photo_path);
                $senior->update(['profile_photo_path' => null]);
            }
        }

        if ($document->file_path) {
            Storage::disk('local')->delete($document->file_path);
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
    public function statistics(Request $request, \App\Services\Senior\StatisticsService $statsService)
    {
        $barangay = $request->query('barangay');
        $year = $request->query('year');
        // Delegated to modular service — controller is now thin (see app/Services/Senior/StatisticsService.php)
        $stats = $statsService->get($barangay, $year);
        return response()->json($stats);
    }

    // Legacy inline implementation kept for reference — now in StatisticsService
    private function legacyStatistics(Request $request)
    {
        $barangay = $request->query('barangay');
        $year = $request->query('year');

        $cacheKey = sprintf(
            'dashboard_stats:%s:%s',
            $barangay && $barangay !== 'All Barangays' ? $barangay : 'all-barangays',
            $year && $year !== 'All Years' ? $year : 'all-years'
        );

        $stats = Cache::remember($cacheKey, now()->addSeconds(30), function () use ($barangay, $year) {
            $isAllYears = !$year || $year === 'All Years';

            // Base query for the WHOLE TOWN or selected BARANGAY
            $populationQuery = Senior::query();

            // Growth query for registrations (for charts)
            $growthQuery = Senior::query();

            if (!$isAllYears) {
                $endOfYear = "$year-12-31 23:59:59";
                $populationQuery->where(function($q) use ($endOfYear) {
                    $q->where('created_at', '<=', $endOfYear)->orWhereNull('created_at');
                });
                $growthQuery->whereYear('created_at', $year);
            }

            if ($barangay && $barangay !== 'All Barangays') {
                $populationQuery->where('barangay', $barangay);
                $growthQuery->where('barangay', $barangay);
            }

            $monthlyStats = [];
            for ($m = 1; $m <= 12; $m++) {
                $monthName = date('M', mktime(0, 0, 0, $m, 1));

                $baseForMonth = (clone $growthQuery)->whereMonth('created_at', $m);

                $monthlyStats[] = [
                    'name' => $monthName,
                    'male' => (clone $baseForMonth)->where('sex', 'Male')->count(),
                    'female' => (clone $baseForMonth)->where('sex', 'Female')->count(),
                    'deceased' => (clone $baseForMonth)->where('status', 'Deceased')->count(),
                ];
            }

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

            return [
                'total' => (clone $populationQuery)->count(),
                'active' => (clone $populationQuery)->where('status', 'Active')->count(),
                'pending' => (clone $populationQuery)->where('status', 'Pending')->count(),
                'deceased' => (clone $populationQuery)->where('status', 'Deceased')->count(),
                'centenarians' => (clone $populationQuery)->where('age', '>=', 100)->where('status', '!=', 'Deceased')->count(),
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
                    ['name' => 'Male', 'value' => (clone $populationQuery)->where('sex', 'Male')->count()],
                    ['name' => 'Female', 'value' => (clone $populationQuery)->where('sex', 'Female')->count()],
                ],
                'topBarangays' => $allBarangayStats->take(5),
                'allBarangayStats' => $allBarangayStats,
            ];
        });

        return response()->json($stats);
    }

    /**
     * Get seniors whose birthday is today + auto-correct their age.
     */
    public function birthdays()
    {
        $today = Carbon::today();
        $month = $today->month;
        $day = $today->day;

        $seniors = Senior::whereMonth('date_of_birth', $month)
            ->whereDay('date_of_birth', $day)
            ->whereNotNull('date_of_birth')
            ->where('status', '!=', 'Deceased')
            ->orderBy('last_name')
            ->get();

        // Lazily correct ages
        $updated = 0;
        foreach ($seniors as $senior) {
            $correctAge = Carbon::parse($senior->date_of_birth)->age;
            if ((int) $senior->age !== $correctAge) {
                $senior->timestamps = false;
                $senior->update(['age' => $correctAge]);
                $senior->age = $correctAge;
                $updated++;
            }
        }

        if ($updated > 0) {
            Cache::forget('stats:v2:all:all');
            if (Cache::has('seniors:cache_version')) {
                Cache::increment('seniors:cache_version');
            } else {
                Cache::forever('seniors:cache_version', 2);
            }
        }

        $mapped = $seniors->map(function ($s) {
            $photoUrl = $s->profile_photo_path ? '/api/storage/profiles/' . basename($s->profile_photo_path) : null;
            return [
                'id' => $s->id,
                'oscaId' => $s->osca_id,
                'firstName' => $s->first_name,
                'middleName' => $s->middle_name,
                'lastName' => $s->last_name,
                'extensionName' => $s->extension_name,
                'name' => $s->full_name,
                'fullName' => $s->full_name,
                'age' => (int) $s->age,
                'sex' => $s->sex,
                'gender' => $s->sex,
                'barangay' => $s->barangay,
                'idPhoto' => $photoUrl,
                'profilePhotoPath' => $photoUrl,
                'dateOfBirth' => $s->date_of_birth?->format('Y-m-d'),
            ];
        });

        return response()->json([
            'count' => $seniors->count(),
            'date' => $today->format('F j, Y'),
            'seniors' => $mapped,
        ]);
    }
}
