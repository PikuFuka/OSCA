<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\FamilyMember;
use App\Models\SeniorDocument;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RequestController extends Controller
{
    /**
     * Get all pending requests
     */
    public function index(Request $request)
    {
        $this->ensurePendingApprovalRequests();

        $query = SeniorRequest::with(['senior', 'senior.documents' => function($q) {
            $q->select(['id', 'senior_id', 'document_type', 'file_name']);
        }]);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'Pending');
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 50));

        // Transform for frontend compatibility
        $requests->getCollection()->transform(function($req) {
            // For update requests, merge pending_data into details so the reviewer sees proposed changes
            $pendingData = $req->pending_data ?? [];
            $photoPath = $pendingData['profile_photo_path'] ?? ($req->senior ? $req->senior->profile_photo_path : null);

            return [
                'id' => $req->id,
                'name' => $req->senior ? $req->senior->full_name : 'Unknown',
                'type' => $req->type,
                'created_at' => $req->created_at,
                'date' => $req->created_at->format('Y-m-d H:i'),
                'status' => $req->status,
                'senior_id' => $req->senior_id,
                'pending_data' => $pendingData,
                'details' => [
                    'profilePicture' => $photoPath ? asset('storage/' . $photoPath) : null,
                    'age' => $pendingData['age'] ?? ($req->senior ? $req->senior->age : null),
                    'dateOfBirth' => $pendingData['dateOfBirth'] ?? ($req->senior ? $req->senior->date_of_birth?->format('Y-m-d') : null),
                    'barangay' => $pendingData['barangay'] ?? ($req->senior ? $req->senior->barangay : null),
                    'streetAddress' => $pendingData['streetAddress'] ?? ($req->senior ? $req->senior->street_address : null),
                    'contact' => $pendingData['contactNumber'] ?? ($req->senior ? $req->senior->contact_number : null),
                    'rrn' => $pendingData['rrn'] ?? ($req->senior ? $req->senior->rrn : null),
                    'nationalId' => $pendingData['nationalId'] ?? ($req->senior ? $req->senior->national_id : null),
                    'emergency' => $pendingData['emergencyName'] ?? ($req->senior ? $req->senior->emergency_name : null),
                    'documents' => $req->senior && $req->senior->documents ? $req->senior->documents->map(function($doc) {
                        return [
                            'id' => $doc->id,
                            'type' => $doc->document_type,
                            'fileName' => $doc->file_name
                        ];
                    }) : []
                ]
            ];
        });

        return response()->json($requests);
    }

    private function ensurePendingApprovalRequests(): void
    {
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
     * Submit an update request for an existing senior (does NOT create a duplicate).
     */
    public function storeUpdate(Request $request)
    {
        $validated = $request->validate([
            'oscaId'           => 'required|string',
            'firstName'        => 'required|string|max:255',
            'middleName'       => 'nullable|string|max:255',
            'lastName'         => 'required|string|max:255',
            'extensionName'    => 'nullable|string|max:10',
            'dateOfBirth'      => 'required|date',
            'age'              => 'required|integer|min:60',
            'placeOfBirth'     => 'nullable|string|max:255',
            'sex'              => 'required|in:Male,Female',
            'mothersMaidenName'=> 'nullable|string|max:255',
            'pensionStatus'    => 'required|string',
            'barangay'         => 'required|string|max:255',
            'streetAddress'    => 'required|string',
            'contactNumber'    => 'nullable|string|max:20',
            'emergencyName'    => 'nullable|string|max:255',
            'emergencyContact' => 'nullable|string|max:20',
            'rrn'              => 'nullable|string|max:50',
            'nationalId'       => 'nullable|string|max:50',
            'familyMembers'    => 'nullable',
        ]);

        // Find the existing senior by OSCA ID
        $senior = Senior::where('osca_id', $validated['oscaId'])->first();

        if (!$senior) {
            return response()->json([
                'success' => false,
                'message' => 'Senior with OSCA ID ' . $validated['oscaId'] . ' not found.',
            ], 404);
        }

        // Create an update request with the proposed changes stored as pending_data
        $pendingData = $validated;

        // Handle file uploads attached to the update request
        $documentTypes = ['birthCert', 'cedula', 'brgyCert', 'idPicture'];
        foreach ($documentTypes as $type) {
            if ($request->hasFile($type)) {
                $file = $request->file($type);
                SeniorDocument::create([
                    'senior_id'     => $senior->id,
                    'document_type' => $type,
                    'file_content'  => file_get_contents($file->getRealPath()),
                    'file_name'     => $file->getClientOriginalName(),
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
     * Approve a request
     */
    public function approve(Request $request, $id)
    {
        $seniorRequest = SeniorRequest::with('senior')->findOrFail($id);
        $senior = $seniorRequest->senior;

        // Validate OSCA ID for new applications
        $validated = $request->validate([
            'osca_id' => 'nullable|string|max:50',
        ]);

        DB::beginTransaction();
        try {
            if ($seniorRequest->type === 'Information Update' && $seniorRequest->pending_data) {
                // ---- UPDATE existing record instead of creating a new one ----
                $data = $seniorRequest->pending_data;

                $senior->update([
                    'first_name'         => $data['firstName']        ?? $senior->first_name,
                    'middle_name'        => $data['middleName']       ?? $senior->middle_name,
                    'last_name'          => $data['lastName']         ?? $senior->last_name,
                    'extension_name'     => $data['extensionName']    ?? $senior->extension_name,
                    'date_of_birth'      => $data['dateOfBirth']      ?? $senior->date_of_birth,
                    'age'                => $data['age']              ?? $senior->age,
                    'place_of_birth'     => $data['placeOfBirth']     ?? $senior->place_of_birth,
                    'sex'                => $data['sex']              ?? $senior->sex,
                    'mothers_maiden_name'=> $data['mothersMaidenName']?? $senior->mothers_maiden_name,
                    'pension_status'     => $data['pensionStatus']    ?? $senior->pension_status,
                    'barangay'           => $data['barangay']         ?? $senior->barangay,
                    'street_address'     => $data['streetAddress']    ?? $senior->street_address,
                    'contact_number'     => $data['contactNumber']    ?? $senior->contact_number,
                    'emergency_name'     => $data['emergencyName']    ?? $senior->emergency_name,
                    'emergency_contact'  => $data['emergencyContact'] ?? $senior->emergency_contact,
                    'rrn'                => $data['rrn']              ?? $senior->rrn,
                    'national_id'        => $data['nationalId']       ?? $senior->national_id,
                    'profile_photo_path' => $data['profile_photo_path'] ?? $senior->profile_photo_path,
                    'status'             => 'Active',
                ]);

                // Sync family members if provided
                $familyMembers = $data['familyMembers'] ?? null;
                if (is_string($familyMembers)) $familyMembers = json_decode($familyMembers, true);
                if (!empty($familyMembers) && is_array($familyMembers)) {
                    $senior->familyMembers()->delete();
                    foreach ($familyMembers as $member) {
                        FamilyMember::create([
                            'senior_id'    => $senior->id,
                            'name'         => $member['name'],
                            'relationship' => $member['relationship'],
                            'age'          => $member['age'] ?? null,
                            'civil_status' => $member['civilStatus'] ?? null,
                            'occupation'   => $member['occupation'] ?? null,
                            'income'       => $member['income'] ?? null,
                        ]);
                    }
                }
            } else {
                // ---- NEW APPLICATION: activate and assign OSCA ID ----
                $updateData = ['status' => 'Active'];
                if (!empty($validated['osca_id'])) {
                    $updateData['osca_id'] = $validated['osca_id'];
                }
                $senior->update($updateData);
            }

            $seniorRequest->update([
                'status'    => 'Approved',
                'action_by' => $request->user()->id,
            ]);

            ActivityLog::create([
                'user_id'     => $request->user()->id,
                'action'      => 'APPROVED_REQUEST',
                'target_type' => 'Request',
                'target_id'   => $seniorRequest->id,
                'details'     => [
                    'type'        => $seniorRequest->type,
                    'senior_id'   => $senior->osca_id,
                    'senior_name' => $senior->full_name,
                ],
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $seniorRequest->type === 'Information Update'
                    ? 'Update approved – member record has been updated.'
                    : 'New application approved – member is now active.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a request
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $seniorRequest = SeniorRequest::findOrFail($id);
        
        $seniorRequest->update([
            'status' => 'Rejected',
            'rejection_reason' => $validated['reason'] ?? null,
            'action_by' => $request->user()->id,
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'REJECTED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $seniorRequest->id,
            'details' => [
                'senior_id' => $seniorRequest->senior->osca_id,
                'senior_name' => $seniorRequest->senior->full_name,
                'reason' => $validated['reason'] ?? 'No reason provided',
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request rejected',
        ]);
    }
}
