<?php

namespace App\Services\Request;

use App\Models\Senior;
use App\Models\Request as SeniorRequest;
use App\Models\ActivityLog;
use App\Models\FamilyMember;
use Illuminate\Support\Facades\DB;

class RequestService
{
    public function approve(SeniorRequest $req, ?string $oscaId, $actor, ?string $password = null): SeniorRequest
    {
        $senior = $req->senior;
        if ($oscaId) {
            $exists = Senior::where('osca_id', $oscaId)->whereNotNull('osca_id')->whereRaw("TRIM(osca_id) <> ''")->where('id','!=',$senior->id)->exists();
            if ($exists) abort(response()->json(['success'=>false,'message'=>'The provided OSCA ID is already in use by another member.'], 422));
        }

        return DB::transaction(function() use ($req, $senior, $oscaId, $actor, $password) {
            if ($req->type === 'Information Update' && $req->pending_data) {
                $data = $req->pending_data;
                $senior->update([
                    'osca_id' => $oscaId ?: $senior->osca_id,
                    'first_name' => $data['firstName'] ?? $senior->first_name,
                    'middle_name' => $data['middleName'] ?? $senior->middle_name,
                    'last_name' => $data['lastName'] ?? $senior->last_name,
                    'extension_name' => $data['extensionName'] ?? $senior->extension_name,
                    'date_of_birth' => $data['dateOfBirth'] ?? $senior->date_of_birth,
                    'age' => $data['age'] ?? $senior->age,
                    'place_of_birth' => $data['placeOfBirth'] ?? $senior->place_of_birth,
                    'sex' => $data['sex'] ?? $senior->sex,
                    'mothers_maiden_name' => $data['mothersMaidenName'] ?? $senior->mothers_maiden_name,
                    'pension_status' => $data['pensionStatus'] ?? $senior->pension_status,
                    'barangay' => $data['barangay'] ?? $senior->barangay,
                    'street_address' => $data['streetAddress'] ?? $senior->street_address,
                    'contact_number' => $data['contactNumber'] ?? $senior->contact_number,
                    'emergency_name' => $data['emergencyName'] ?? $senior->emergency_name,
                    'emergency_contact' => $data['emergencyContact'] ?? $senior->emergency_contact,
                    'rrn' => $data['rrn'] ?? $senior->rrn,
                    'national_id' => $data['nationalId'] ?? $senior->national_id,
                    'profile_photo_path' => $data['profile_photo_path'] ?? $senior->profile_photo_path,
                    'status' => 'Active',
                ]);
                $familyMembers = $data['familyMembers'] ?? null;
                if (is_string($familyMembers)) $familyMembers = json_decode($familyMembers, true);
                if (!empty($familyMembers) && is_array($familyMembers)) {
                    $senior->familyMembers()->delete();
                    foreach ($familyMembers as $m) {
                        FamilyMember::create(['senior_id'=>$senior->id,'name'=>$m['name'],'relationship'=>$m['relationship'],'age'=>$m['age']??null,'civil_status'=>$m['civilStatus']??null,'occupation'=>$m['occupation']??null,'income'=>$m['income']??null]);
                    }
                }
            } else {
                $updateData = ['status'=>'Active'];
                if ($oscaId) $updateData['osca_id']=$oscaId;
                if ($password !== null && $password !== '') {
                    // 'password' cast (hashed) on the model hashes this automatically.
                    $updateData['password'] = $password;
                    $updateData['force_password_change'] = true;
                }
                $senior->update($updateData);
            }

            $req->update(['status'=>'Approved','action_by'=>$actor->id]);
            ActivityLog::create(['user_id'=>$actor->id,'action'=>'APPROVED_REQUEST','target_type'=>'Request','target_id'=>$req->id,'details'=>['type'=>$req->type,'senior_id'=>$senior->osca_id,'senior_name'=>$senior->full_name],'ip_address'=>request()->ip()]);
            return $req;
        });
    }

    public function reject(SeniorRequest $req, ?string $reason, $actor): SeniorRequest
    {
        return DB::transaction(function() use ($req, $reason, $actor) {
            $senior = $req->senior;
            $req->update(['status'=>'Rejected','rejection_reason'=>$reason,'action_by'=>$actor->id]);
            ActivityLog::create(['user_id'=>$actor->id,'action'=>'REJECTED_REQUEST','target_type'=>'Request','target_id'=>$req->id,'details'=>['senior_id'=>$senior?->osca_id,'senior_name'=>$senior?->full_name ?? 'Unknown','reason'=>$reason ?? 'No reason provided'],'ip_address'=>request()->ip()]);
            if ($req->type === 'New Application' && $senior) $senior->forceDelete();
            return $req;
        });
    }
}
