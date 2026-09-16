<?php

namespace App\Console\Commands;

use App\Models\Senior;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class UpdateBirthdayAges extends Command
{
    protected $signature = 'seniors:update-birthday-ages';
    protected $description = 'Update the age column for seniors whose birthday is today';

    public function handle(): int
    {
        $today = Carbon::today();
        $month = $today->month;
        $day = $today->day;

        // Find all seniors born on this month+day
        $seniors = Senior::whereMonth('date_of_birth', $month)
            ->whereDay('date_of_birth', $day)
            ->whereNotNull('date_of_birth')
            ->get();

        $updated = 0;

        foreach ($seniors as $senior) {
            $correctAge = Carbon::parse($senior->date_of_birth)->age;

            if ((int) $senior->age !== $correctAge) {
                $senior->timestamps = false; // Don't touch updated_at
                $senior->update(['age' => $correctAge]);
                $updated++;
            }
        }

        if ($updated > 0) {
            \Illuminate\Support\Facades\Cache::forget('stats:v2:all:all');
            if (\Illuminate\Support\Facades\Cache::has('seniors:cache_version')) {
                \Illuminate\Support\Facades\Cache::increment('seniors:cache_version');
            } else {
                \Illuminate\Support\Facades\Cache::forever('seniors:cache_version', 2);
            }
        }

        $this->info("Birthday age update complete. Found {$seniors->count()} birthday(s) today, updated {$updated} age(s).");

        return self::SUCCESS;
    }
}
