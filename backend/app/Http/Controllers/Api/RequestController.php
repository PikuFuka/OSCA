<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\ApproveRequestRequest;
use App\Http\Resources\RequestResource;
use App\Services\Request\RequestService;

class RequestController extends Controller
{
    /**
     * Get all pending requests
     */
    public function index(Request $request)
    {
        // Pure read. Pending-request reconciliation runs as a scheduled
        // queued job (see routes/console.php) — never on the request path.
        $query = SeniorRequest::with(['senior', 'senior.documents' => fn($q) => $q->select(['id','senior_id','document_type','file_name'])]);

        $query->when($request->has('status'), fn($q) => $q->where('status', $request->status), fn($q) => $q->where('status','Pending'));

        $requests = $query->orderBy('created_at','desc')->paginate($this->perPage($request, 50));
        // Modular resource keeps controller thin
        return RequestResource::collection($requests)->response();
    }

    /**
     * Clamp client-controlled page size (1.2: unbounded per_page = memory bomb).
     */
    private function perPage(Request $request, int $default = 50, int $max = 100): int
    {
        return \App\Support\Pagination::perPage($request, $default, $max);
    }

    /**
     * Submit an update request — thin via FormRequest
     */
    public function storeUpdate(\App\Http\Requests\StoreUpdateRequest $request)
    {
        $validated = $request->validated();

        // Find the existing senior by OSCA ID
        $senior = Senior::where('osca_id', $validated['oscaId'])->first();

        if (!$senior) {
            return response()->json([
                'success' => false,
                'message' => 'Senior with OSCA ID ' . $validated['oscaId'] . ' not found.',
            ], 404);
        }

        $authUser = $request->user();
        if ($authUser instanceof Senior) {
            if ((string)$authUser->id !== (string)$senior->id && (string)$authUser->osca_id !== (string)$senior->osca_id) {
                return response()->json(['message' => 'Forbidden. You cannot submit update requests for other members.'], 403);
            }
        }

        // Create an update request with the proposed changes stored as pending_data
        $pendingData = $validated;

        // Handle file uploads attached to the update request — filesystem first.
        // NOTE: these are pending-attachment rows (one per request), NOT the
        // senior's live documents, so they must not go through
        // DocumentService::store (which replaces same-type rows). storeAs
        // streams the upload straight to disk (1.4: no double-buffer).
        $documentTypes = ['birthCert', 'cedula', 'brgyCert', 'idPicture'];
        foreach ($documentTypes as $type) {
            if ($request->hasFile($type)) {
                $file = $request->file($type);
                $fileName = $file->getClientOriginalName();
                $safeName = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
                $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
                $filePath = $file->storeAs(
                    "documents/{$senior->id}",
                    time() . "_{$type}_{$safeName}.{$ext}",
                    'local'
                );

                SeniorDocument::create([
                    'senior_id'     => $senior->id,
                    'document_type' => $type,
                    'file_content'  => '',
                    'file_path'     => $filePath,
                    'file_name'     => $fileName,
                    'mime_type'     => $file->getMimeType(),
                    'file_size'     => $file->getSize(),
                ]);

                if ($type === 'idPicture') {
                    $path = $file->store('profile_photos', 'public');
                    $pendingData['profile_photo_path'] = $path;
                }
            }
        }

        $seniorRequest = SeniorRequest::create([
            'senior_id'    => $senior->id,
            'type'         => 'Information Update',
            'status'       => 'Pending',
            'pending_data' => $pendingData,
        ]);

        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;

        ActivityLog::create([
            'user_id'     => $isUser ? $user->id : null,
            'action'      => 'SUBMITTED_UPDATE_REQUEST',
            'target_type' => 'Senior',
            'target_id'   => $senior->id,
            'details'     => ['osca_id' => $senior->osca_id, 'name' => $senior->full_name],
            'ip_address'  => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Update request submitted for approval.',
        ], 201);
    }

    /**
     * Approve a request — thin controller, logic in RequestService
     */
    public function approve(ApproveRequestRequest $request, $id, RequestService $service)
    {
        $seniorRequest = SeniorRequest::with('senior')->findOrFail($id);
        try {
            $validated = $request->validated();
            $service->approve($seniorRequest, $validated['osca_id'] ?? null, $request->user(), $validated['password'] ?? null);
            return response()->json([
                'success' => true,
                'message' => $seniorRequest->type === 'Information Update' ? 'Update approved – member record has been updated.' : 'New application approved – member is now active.',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Approval failed: '.$e->getMessage()], 500);
        }
    }

    /**
     * Reject a request — thin controller
     */
    public function reject(ApproveRequestRequest $request, $id, RequestService $service)
    {
        $seniorRequest = SeniorRequest::with('senior')->findOrFail($id);
        try {
            $service->reject($seniorRequest, $request->validated()['reason'] ?? null, $request->user());
            return response()->json(['success'=>true,'message'=>'Request rejected']);
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Rejection failed: '.$e->getMessage()], 500);
        }
    }
}
