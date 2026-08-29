<?php

namespace App\Jobs;

use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ReconcilePendingRequests implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Senior::where(function ($q) {
            $q->whereNull('osca_id')->orWhereRaw("TRIM(osca_id) = ''");
        })->where('status','!=','Pending')->update(['status'=>'Pending']);

        $existing = SeniorRequest::where('status','Pending')->pluck('senior_id')->all();
        Senior::where('status','Pending')
            ->where(function($q){ $q->whereNull('osca_id')->orWhereRaw("TRIM(osca_id) = ''"); })
            ->when($existing !== [], fn($q) => $q->whereNotIn('id', $existing))
            ->orderBy('id')->cursor()->each(function(Senior $senior){
                SeniorRequest::firstOrCreate(
                    ['senior_id'=>$senior->id, 'status'=>'Pending'],
                    ['type'=>'New Application']
                );
            });
    }
}
