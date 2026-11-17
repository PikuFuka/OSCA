<?php

namespace App\Services\Senior;

use App\Models\OscaIdVacancy;
use App\Models\Senior;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

/**
 * Owns the lifecycle of a reusable OSCA ID:
 * active member -> vacancy -> claimed by a new member, or reclaimed on restore.
 */
class OscaIdVacancyService
{
    /**
     * Release the senior's current OSCA ID and record who held it and why it
     * became vacant. The old ID is kept on former_osca_id for reports.
     */
    public function vacate(Senior $senior, string $reason, ?CarbonInterface $vacatedAt = null): ?OscaIdVacancy
    {
        $oscaId = trim((string) $senior->osca_id);

        if ($oscaId === '') {
            return null;
        }

        return DB::transaction(function () use ($senior, $oscaId, $reason, $vacatedAt) {
            $vacancy = OscaIdVacancy::updateOrCreate(
                ['osca_id' => $oscaId],
                [
                    'senior_id' => $senior->id,
                    'past_holder_name' => $senior->full_name,
                    'reason' => $reason,
                    'vacated_at' => $vacatedAt ?? now(),
                ]
            );

            $senior->forceFill([
                'former_osca_id' => $oscaId,
                'osca_id' => null,
            ])->save();

            return $vacancy;
        });
    }

    /**
     * Remove an available ID from the pool when a new member takes it.
     * Returns false when the ID was never vacated (a brand-new ID).
     */
    public function claim(string $oscaId): bool
    {
        $oscaId = trim($oscaId);

        if ($oscaId === '') {
            return false;
        }

        return OscaIdVacancy::where('osca_id', $oscaId)->delete() > 0;
    }

    /**
     * Give a restored/un-deceased member their old ID back when it is still
     * available. If it has already been reassigned, they return without an ID.
     */
    public function reclaim(Senior $senior): bool
    {
        $oscaId = trim((string) $senior->former_osca_id);

        if ($oscaId === '') {
            return false;
        }

        $vacancyExists = OscaIdVacancy::where('osca_id', $oscaId)
            ->where('senior_id', $senior->id)
            ->exists();

        if (!$vacancyExists) {
            return false;
        }

        $heldBySomeoneElse = Senior::withTrashed()
            ->where('osca_id', $oscaId)
            ->where('id', '!=', $senior->id)
            ->exists();

        if ($heldBySomeoneElse) {
            return false;
        }

        return DB::transaction(function () use ($senior, $oscaId) {
            OscaIdVacancy::where('osca_id', $oscaId)
                ->where('senior_id', $senior->id)
                ->delete();

            $senior->forceFill([
                'osca_id' => $oscaId,
                'former_osca_id' => null,
            ])->save();

            return true;
        });
    }
}
