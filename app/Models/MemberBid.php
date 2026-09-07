<?php

namespace App\Models;

use App\Traits\HasObfuscatedId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberBid extends Model
{
    use HasFactory, HasObfuscatedId;

    protected $fillable = [
        'schedule_id',
        'member_id',
        'bid_amount',
        'remarks',
        'status',
    ];

    protected $casts = [
        'bid_amount' => 'decimal:2',
    ];

    public function schedule()
    {
        return $this->belongsTo(CommitteeSchedule::class, 'schedule_id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id');
    }
}
