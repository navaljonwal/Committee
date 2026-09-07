<?php

namespace App\Traits;

use App\Services\IdEncoder;

trait HasObfuscatedId
{
    /**
     * Get the obfuscated hash ID.
     */
    public function getHashIdAttribute(): string
    {
        return IdEncoder::encode($this->attributes['id'] ?? null);
    }

    /**
     * Get the route key for the model (uses obfuscated hash ID).
     */
    public function getRouteKey(): string
    {
        return $this->hash_id;
    }

    /**
     * Retrieve the model for a bound value.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $decodedId = IdEncoder::decode($value);
        return $this->where($field ?? $this->getKeyName(), $decodedId)->first();
    }
}
