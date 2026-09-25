<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
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
        // Reconciliation moved to queued job ReconcilePendingRequests (see app/Jobs) — kept sync for backward compat
        // \App\Jobs\ReconcilePendingRequests::dispatchSync();
        $this->ensurePendingApprovalRequests();

        $query = SeniorRequest::with(['senior', 'senior.documents' => fn($q) => $q->select(['id','senior_id','document_type','file_name'])]);

        $query->when($request->has('status'), fn($q) => $q->where('status', $request->status), fn($q) => $q->where('status','Pending'));

        $requests = $query->orderBy('created_at','desc')->paginate($request->get('per_page', 50));
        // Modular resource keeps controller thin
        return RequestResource::collection($requests)->response();
    }

    private function ensurePendingApprovalRequests(): void
    {
        // Force status to Pending if osca_id is null or empty
        Senior::where(function ($query) {
            $query->whereNull('osca_id')
                ->orWhereRaw("TRIM(osca_id) = ''");
        })->where('status', '!=', 'Pending')->update(['status' => 'Pending']);

        $pendingSeniorIdsWithRequests = SeniorRequest::query()
            ->where('status', 'Pending')
            ->pluck('senior_id')
            ->all();

        Senior::query()
            ->where('status', 'Pending')
            ->where(function ($query) {
                $query->whereNull('osca_id')
                    ->orWhereRaw("TRIM(osca_id) = ''");
            })
            ->when($pendingSeniorIdsWithRequests !== [], function ($query) use ($pendingSeniorIdsWithRequests) {
                $query->whereNotIn('id', $pendingSeniorIdsWithRequests);
            })
            ->orderBy('id')
            ->get(['id'])
            ->each(function (Senior $senior) {
                SeniorRequest::create([
                    'senior_id' => $senior->id,
                    'type' => 'New Application',
                    'status' => 'Pending',
                ]);
            });
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

        // Senior-citizen tokens may only file update requests for themselves.
        $actor = $request->user();
        if ($actor instanceof Senior && $senior->id !== $actor->id) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        // Create an update request with the proposed changes stored as pending_data
        $pendingData = $validated;

        // Handle file uploads attached to the update request — filesystem first
        $documentTypes = ['birthCert', 'cedula', 'brgyCert', 'idPicture'];
        foreach ($documentTypes as $type) {
            if ($request->hasFile($type)) {
                $file = $request->file($type);
                $binary = file_get_contents($file->getRealPath());
                $fileName = $file->getClientOriginalName();
                $safeName = Str::slug(pathinfo($fileName, PATHINFO_FILENAME)) ?: 'document';
                $ext = pathinfo($fileName, PATHINFO_EXTENSION) ?: 'bin';
                $docFileName = $safeName . '.' . $ext;
                $filePath = "documents/{$senior->id}/" . time() . "_{$type}_{$docFileName}";
                Storage::disk('local')->put($filePath, $binary);

                SeniorDocument::create([
                    'senior_id'     => $senior->id,
                    'document_type' => $type,
                    'file_content'  => null,
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
            $service->approve($seniorRequest, $request->validated()['osca_id'] ?? null, $request->user());
            return response()->json([
                'success' => true,
                'message' => $seniorRequest->type === 'Information Update' ? 'Update approved – member record has been updated.' : 'New application approved – member is now active.',
            ]);
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
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
        } catch (\Illuminate\Http\Exceptions\HttpResponseException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success'=>false,'message'=>'Rejection failed: '.$e->getMessage()], 500);
        }
    }
}
