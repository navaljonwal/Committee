<?php

namespace App\Models;

use App\Traits\HasObfuscatedId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeMemberPayment extends Model
{
    use HasFactory, HasObfuscatedId;

    protected $fillable = [
        'schedule_id',
        'member_id',
        'seat_no',
        'amount_paid',
        'penalty_amount',
        'remarks',
        'payment_status',
        'payment_date',
    ];

    protected $casts = [
        'seat_no' => 'integer',
        'amount_paid' => 'decimal:2',
        'penalty_amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    protected static function booted()
    {
        static::saved(function ($p) {
            $committeeId = $p->schedule?->committee_id;
            if ($committeeId) Committee::clearCache($committeeId);
        });
        static::deleted(function ($p) {
            $committeeId = $p->schedule?->committee_id;
            if ($committeeId) Committee::clearCache($committeeId);
        });
    }

    public function schedule()
    {
        return $this->belongsTo(CommitteeSchedule::class, 'schedule_id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id');
    }

    /**
     * Total due amount including installment + late penalty.
     */
    public function getTotalDueAttribute()
    {
        return (float)$this->amount_paid + (float)$this->penalty_amount;
    }
}
