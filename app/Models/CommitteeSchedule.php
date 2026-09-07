<?php

namespace App\Models;

use App\Traits\HasObfuscatedId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommitteeSchedule extends Model
{
    use HasFactory, HasObfuscatedId;

    protected $fillable = [
        'committee_id',
        'month_no',
        'index_n',
        'deduction_amount',
        'custom_deduction_amount',
        'is_custom_bid',
        'net_payout',
        'installment_per_member',
        'member_id',
        'draw_date',
        'payout_status',
        'payout_date',
        'payout_mode',
        'payout_upi_amount',
        'payout_upi_ref',
        'payout_cash_amount',
        'payout_cash_notes',
        'payout_remarks',
    ];

    protected $casts = [
        'month_no' => 'integer',
        'index_n' => 'integer',
        'deduction_amount' => 'decimal:2',
        'custom_deduction_amount' => 'decimal:2',
        'is_custom_bid' => 'boolean',
        'net_payout' => 'decimal:2',
        'installment_per_member' => 'decimal:2',
        'draw_date' => 'date',
        'payout_date' => 'date',
        'payout_upi_amount' => 'decimal:2',
        'payout_cash_amount' => 'decimal:2',
        'payout_cash_notes' => 'array',
    ];

    public function committee()
    {
        return $this->belongsTo(Committee::class);
    }

    public function winner()
    {
        return $this->belongsTo(Member::class, 'member_id');
    }

    public function payments()
    {
        return $this->hasMany(CommitteeMemberPayment::class, 'schedule_id');
    }

    public function bids()
    {
        return $this->hasMany(MemberBid::class, 'schedule_id');
    }

    /**
     * Calculate default formula base deduction amount for this schedule entry.
     */
    public function getFormulaDeductionAttribute()
    {
        $committee = $this->committee;
        if (!$committee) return 0;

        $V = (float) $committee->total_amount;
        $R = (float) $committee->deduction_rate;
        $baseUnit = ($V * $R) / 100;

        if ($this->index_n === (int) $committee->special_month_index) {
            return 0.0;
        }

        return $this->index_n * $baseUnit;
    }
}
