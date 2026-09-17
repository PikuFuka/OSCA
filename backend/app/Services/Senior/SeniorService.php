<?php

namespace App\Services\Senior;

use App\Models\Senior;
use App\Models\FamilyMember;
use App\Models\SeniorDocument;
use App\Models\Request as SeniorRequest;
use App\Models\ActivityLog;
use App\Repositories\SeniorRepository;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SeniorService
{
    public function __construct(
        private SeniorRepository $repo,
        private DocumentService $documents
    ) {}

    public function findForDisplay(string $oscaId): Senior
    {
        return $this->repo->applyValidOscaScope(Senior::query())->where('osca_id', $oscaId)->firstOrFail();
    }

    /**
     * Thin-controller entry for registration — moves 50 lines from SeniorController::store
     */
    public function register(array $validated, HttpRequest $httpRequest, $user = null): Senior
    {
        return DB::transaction(function () use ($validated, $httpRequest, $user) {
            // Duplicate check across ALL live records (including Pending ones
            // without an OSCA ID yet). Scoping to valid osca_id here would let
            // identical pending applications through, creating duplicate
            // approvals. Soft-deleted records stay excludable for re-entry.
            $duplicateExists = Senior::where('first_name', $validated['firstName'])
                ->where('last_name', $validated['lastName'])
                ->whereDate('date_of_birth', $validated['dateOfBirth'])
                ->exists();
            if ($duplicateExists) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'A senior with the same name and date of birth already exists. Please use the "Existing Member" option to update their record instead.',
                ], 409));
            }

            $senior = Senior::create([
                'osca_id' => null,
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

            $familyMembers = $validated['familyMembers'] ?? [];
            if (is_string($familyMembers)) $familyMembers = json_decode($familyMembers, true);
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

            foreach (['birthCert','cedula','brgyCert','idPicture'] as $type) {
                if ($httpRequest->hasFile($type)) {
                    $this->documents->store($senior->id, $type, $httpRequest->file($type));
                    if ($type === 'idPicture') {
                        $path = $httpRequest->file($type)->store('profile_photos', 'public');
                        $senior->update(['profile_photo_path' => $path]);
                    }
                }
            }

            SeniorRequest::create(['senior_id' => $senior->id, 'type' => 'New Application', 'status' => 'Pending']);

            $isUser = $user instanceof \App\Models\User;
            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action' => 'REGISTERED_SENIOR',
                'target_type' => 'Senior',
                'target_id' => $senior->id,
                'details' => ['name' => $senior->full_name],
                'ip_address' => $httpRequest->ip(),
            ]);

            return $senior;
        });
    }

    public function updateSenior(Senior $senior, array $validated, $user = null): Senior
    {
        $normalizedExtension = $senior->extension_name;
        if (array_key_exists('extensionName', $validated)) {
            $raw = trim((string) ($validated['extensionName'] ?? ''));
            $normalizedExtension = in_array(strtolower($raw), ['', 'none', 'n/a', 'na'], true) ? null : $raw;
        }

        $dob = $senior->date_of_birth;
        if (array_key_exists('dateOfBirth', $validated)) {
            $dob = \Illuminate\Support\Carbon::parse($validated['dateOfBirth']);
        }

        $normalizedOsca = $senior->osca_id;
        if (array_key_exists('oscaId', $validated)) {
            $t = trim((string) ($validated['oscaId'] ?? ''));
            $normalizedOsca = $t === '' ? null : $t;
        }

        if ($normalizedOsca !== $senior->osca_id) {
            $exists = $this->repo->applyValidOscaScope(Senior::query())
                ->where('osca_id', $normalizedOsca)->where('id','!=',$senior->id)->exists();
            if ($exists) abort(response()->json(['success'=>false,'message'=>'The provided OSCA ID is already in use by another member.'], 422));
        }

        $senior->update([
            'osca_id' => $normalizedOsca,
            'first_name' => $validated['firstName'] ?? $senior->first_name,
            'middle_name' => $validated['middleName'] ?? $senior->middle_name,
            'last_name' => $validated['lastName'] ?? $senior->last_name,
            'extension_name' => $normalizedExtension,
            'date_of_birth' => $dob,
            'age' => $dob ? \Illuminate\Support\Carbon::parse($dob)->age : $senior->age,
            'status' => $validated['status'] ?? $senior->status,
            'pension_status' => $validated['pensionStatus'] ?? $senior->pension_status,
            'barangay' => $validated['barangay'] ?? $senior->barangay,
            'street_address' => $validated['streetAddress'] ?? $senior->street_address,
            'contact_number' => $validated['contactNumber'] ?? $senior->contact_number,
            'id_config' => $validated['idConfig'] ?? $senior->id_config,
        ]);

        return $senior;
    }
}
