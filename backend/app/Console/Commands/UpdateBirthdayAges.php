<?php

namespace App\Console\Commands;

use App\Models\Senior;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class UpdateBirthdayAges extends Command
{
    protected $signature = 'seniors:update-birthday-ages';
    protected $description = 'Recalculate and sync stored ages from date of birth (keeps age current after birthdays)';

    public function handle(): int
    {
        $today = Carbon::today();
        $checked = 0;
        $updated = 0;
        $birthdaysToday = 0;

        // Recompute from DOB so the stored age column stays correct for queries
        // and reports even if a previous run was missed. Ages advance on birthdays.
        Senior::query()
            ->whereNotNull('date_of_birth')
            ->select(['id', 'date_of_birth', 'age'])
            ->chunkById(500, function ($seniors) use (&$checked, &$updated, &$birthdaysToday, $today) {
                foreach ($seniors as $senior) {
                    $checked++;

                    // 1900-01-01 is the import placeholder, not a birthdate.
                    // Recalculating from it would create impossible ages.
                    if (!$senior->hasKnownDateOfBirth()) {
                        continue;
                    }

                    $dob = $senior->date_of_birth;
                    $correctAge = $dob->age;

                    if ($dob->isBirthday($today)) {
                        $birthdaysToday++;
                    }

                    if ((int) $senior->age !== $correctAge) {
                        // Don't touch updated_at: this is an automatic age rollover.
                        Senior::whereKey($senior->id)->update(['age' => $correctAge]);
                        $updated++;
                    }
                }
            });

        if ($updated > 0) {
            if (\Illuminate\Support\Facades\Cache::has('stats:cache_version')) {
                \Illuminate\Support\Facades\Cache::increment('stats:cache_version');
            } else {
                \Illuminate\Support\Facades\Cache::forever('stats:cache_version', 2);
            }
            if (\Illuminate\Support\Facades\Cache::has('seniors:cache_version')) {
                \Illuminate\Support\Facades\Cache::increment('seniors:cache_version');
            } else {
                \Illuminate\Support\Facades\Cache::forever('seniors:cache_version', 2);
            }
        }

        $this->info("Age sync complete. Checked {$checked} record(s), {$birthdaysToday} birthday(s) today, updated {$updated} age(s).");

        return self::SUCCESS;
    }
}
