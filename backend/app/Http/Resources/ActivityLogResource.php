<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userName = 'System';
        if ($this->user) $userName = $this->user->name;
        elseif (isset($this->details['name'])) $userName = $this->details['name'];
        elseif (isset($this->details['senior_name'])) $userName = $this->details['senior_name'];
        if (!$this->user && isset($this->details['osca_id'])) $userName .= " (#{$this->details['osca_id']})";

        return [
            'id' => $this->id,
            'action' => $this->action,
            'timestamp' => $this->created_at?->toIso8601String(),
            'user' => $userName,
            'details' => $this->details,
            'ip' => $this->ip_address,
        ];
    }
}
