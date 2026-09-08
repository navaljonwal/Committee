<?php

namespace App\Models;

use App\Traits\HasObfuscatedId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Committee extends Model
{
    use HasFactory, HasObfuscatedId;

    protected $fillable = [
        'name',
        'total_amount',
        'total_members',
        'deduction_rate',
        'special_month_index',
        'start_date',
        'status'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'deduction_rate' => 'decimal:2',
        'total_members' => 'integer',
        'special_month_index' => 'integer',
        'start_date' => 'date',
    ];

    public static function clearCache($committeeId): void
    {
        if ($committeeId) {
            $numericId = is_numeric($committeeId) ? (int)$committeeId : \App\Services\IdEncoder::decode($committeeId);
            \Illuminate\Support\Facades\Cache::forget("committee_rendered_html_{$numericId}");
            \Illuminate\Support\Facades\Cache::forget("committee_rendered_html_" . \App\Services\IdEncoder::encode($numericId));
        }
    }

    protected static function booted()
    {
        static::saved(fn($c) => static::clearCache($c->id));
        static::deleted(fn($c) => static::clearCache($c->id));
    }

    public function schedules()
    {
        return $this->hasMany(CommitteeSchedule::class)->orderBy('month_no', 'asc');
    }

    public function members()
    {
        return $this->belongsToMany(Member::class, 'committee_member')
            ->withPivot('seats')
            ->withTimestamps();
    }

    /**
     * Get total seats / entries held by a specific member in this committee.
     */
    public function getMemberSeatsCount($memberId)
    {
        if ($this->relationLoaded('members')) {
            $m = $this->members->where('id', $memberId)->first();
            return $m && isset($m->pivot->seats) ? (int) $m->pivot->seats : 1;
        }
        $m = $this->members()->where('members.id', $memberId)->first();
        return $m && isset($m->pivot->seats) ? (int) $m->pivot->seats : 1;
    }

    /**
     * Get count of draws / rounds won by a specific member in this committee.
     */
    public function getMemberWonCount($memberId)
    {
        if ($this->relationLoaded('schedules')) {
            return $this->schedules->where('member_id', $memberId)->count();
        }
        return $this->schedules()->where('member_id', $memberId)->count();
    }

    /**
     * Estimated End Date based on the final Kisht / draw date.
     */
    public function getEndDateAttribute()
    {
        if ($this->relationLoaded('schedules') && $this->schedules->isNotEmpty()) {
            return $this->schedules->sortBy('month_no')->last()->draw_date ?? ($this->start_date ? $this->start_date->copy()->addMonths(max(0, (int)$this->total_members - 1)) : null);
        }

        $lastSchedule = $this->schedules()->reorder('month_no', 'desc')->first();
        if ($lastSchedule && $lastSchedule->draw_date) {
            return $lastSchedule->draw_date;
        }

        return $this->start_date ? $this->start_date->copy()->addMonths(max(0, (int)$this->total_members - 1)) : null;
    }

    /**
     * Calculate and generate schedule entries for this committee.
     */
    public function generateSchedules()
    {
        // If schedules already exist, sync member payments instead of recreating/deleting schedules
        if ($this->schedules()->exists()) {
            $this->syncMemberPayments();
            return;
        }

        $V = (float) $this->total_amount;
        $M = (int) $this->total_members;
        $R = (float) $this->deduction_rate;
        $specialIndex = (int) $this->special_month_index;

        $baseUnit = ($V * $R) / 100;

        for ($month = 1; $month <= $M; $month++) {
            $indexN = $M - $month + 1;

            if ($indexN === $specialIndex) {
                $deduction = 0.0;
            } else {
                $deduction = $indexN * $baseUnit;
            }

            $netPayout = $V - $deduction;
            $kistPerMember = $netPayout / $M;

            // Calculate estimated draw date based on start_date + (month - 1) months
            $drawDate = $this->start_date ? $this->start_date->copy()->addMonths($month - 1) : null;

            $schedule = $this->schedules()->create([
                'month_no' => $month,
                'index_n' => $indexN,
                'deduction_amount' => $deduction,
                'net_payout' => $netPayout,
                'installment_per_member' => $kistPerMember,
                'draw_date' => $drawDate,
            ]);

            // Automatically create payment records if members are attached (multi-seat aware)
            foreach ($this->members as $member) {
                $seatsCount = isset($member->pivot->seats) ? (int) $member->pivot->seats : 1;
                for ($seatNo = 1; $seatNo <= $seatsCount; $seatNo++) {
                    CommitteeMemberPayment::create([
                        'schedule_id' => $schedule->id,
                        'member_id' => $member->id,
                        'seat_no' => $seatNo,
                        'amount_paid' => $kistPerMember,
                        'payment_status' => 'pending',
                    ]);
                }
            }
        }
    }

    /**
     * Sync member payment records for existing schedules without deleting schedules or existing payment history.
     */
    public function syncMemberPayments()
    {
        $currentMembers = $this->members()->get();
        $currentMemberIds = $currentMembers->pluck('id')->toArray();
        $schedules = $this->schedules;

        if ($schedules->isEmpty() || empty($currentMemberIds)) {
            return;
        }

        $scheduleIds = $schedules->pluck('id')->toArray();

        // 1. Bulk remove pending payments for members who are no longer in this committee (1 query)
        CommitteeMemberPayment::whereIn('schedule_id', $scheduleIds)
            ->whereNotIn('member_id', $currentMemberIds)
            ->where('payment_status', 'pending')
            ->delete();

        // 2. Fetch all existing payment entries for these schedules in 1 query
        $existingRecords = CommitteeMemberPayment::whereIn('schedule_id', $scheduleIds)
            ->select('id', 'schedule_id', 'member_id', 'seat_no', 'payment_status')
            ->get();

        $existingLookup = [];
        $excessIdsToDelete = [];

        $memberSeatsMap = [];
        foreach ($currentMembers as $member) {
            $memberSeatsMap[$member->id] = isset($member->pivot->seats) ? (int) $member->pivot->seats : 1;
        }

        foreach ($existingRecords as $rec) {
            $key = $rec->schedule_id . '_' . $rec->member_id . '_' . $rec->seat_no;
            $existingLookup[$key] = true;

            $maxSeats = $memberSeatsMap[$rec->member_id] ?? 1;
            if ($rec->seat_no > $maxSeats && $rec->payment_status === 'pending') {
                $excessIdsToDelete[] = $rec->id;
            }
        }

        // Delete excess pending rows in 1 query if seat count was reduced
        if (!empty($excessIdsToDelete)) {
            CommitteeMemberPayment::whereIn('id', $excessIdsToDelete)->delete();
        }

        // 3. Prepare bulk insert for missing rows
        $now = now();
        $newPayments = [];
        foreach ($schedules as $schedule) {
            foreach ($currentMembers as $member) {
                $seatsCount = $memberSeatsMap[$member->id] ?? 1;
                for ($seatNo = 1; $seatNo <= $seatsCount; $seatNo++) {
                    $key = $schedule->id . '_' . $member->id . '_' . $seatNo;
                    if (!isset($existingLookup[$key])) {
                        $newPayments[] = [
                            'schedule_id'    => $schedule->id,
                            'member_id'      => $member->id,
                            'seat_no'        => $seatNo,
                            'amount_paid'    => $schedule->installment_per_member,
                            'payment_status' => 'pending',
                            'penalty_amount' => 0,
                            'created_at'     => $now,
                            'updated_at'     => $now,
                        ];
                        $existingLookup[$key] = true;
                    }
                }
            }
        }

        // Insert in bulk chunks of 250
        if (!empty($newPayments)) {
            foreach (array_chunk($newPayments, 250) as $chunk) {
                CommitteeMemberPayment::insert($chunk);
            }
        }
    }

    /**
     * Recalculate schedule entries and draw dates when committee parameters are updated.
     */
    public function recalculateSchedules()
    {
        $V = (float) $this->total_amount;
        $M = (int) $this->total_members;
        $R = (float) $this->deduction_rate;
        $specialIndex = (int) $this->special_month_index;

        $baseUnit = ($V * $R) / 100;
        $startDate = $this->start_date ? \Illuminate\Support\Carbon::parse($this->start_date) : null;

        // If total_members M changed and more schedules are needed, create them
        $existingCount = $this->schedules()->count();
        if ($existingCount < $M) {
            for ($m = $existingCount + 1; $m <= $M; $m++) {
                $indexN = $M - $m + 1;
                $deduction = ($indexN === $specialIndex) ? 0.0 : ($indexN * $baseUnit);
                $netPayout = $V - $deduction;
                $kist = $netPayout / $M;
                $drawDate = $startDate ? $startDate->copy()->addMonths($m - 1) : null;

                $this->schedules()->create([
                    'month_no' => $m,
                    'index_n' => $indexN,
                    'deduction_amount' => $deduction,
                    'net_payout' => $netPayout,
                    'installment_per_member' => $kist,
                    'draw_date' => $drawDate,
                ]);
            }
        }

        // Now update existing schedules
        $schedules = $this->schedules;
        foreach ($schedules as $schedule) {
            $month = $schedule->month_no;
            $indexN = $M - $month + 1;
            $drawDate = $startDate ? $startDate->copy()->addMonths($month - 1) : null;

            if ($schedule->is_custom_bid && $schedule->custom_deduction_amount !== null) {
                // Keep custom auction deduction amount, but update net payout & installment based on new V and M
                $deduction = (float) $schedule->custom_deduction_amount;
            } else {
                // Formula deduction
                $isSpecial = ($indexN === $specialIndex);
                $deduction = $isSpecial ? 0.0 : ($indexN * $baseUnit);
            }

            $netPayout = $V - $deduction;
            $kistPerMember = $netPayout / $M;

            $schedule->update([
                'index_n' => $indexN,
                'deduction_amount' => $deduction,
                'net_payout' => $netPayout,
                'installment_per_member' => $kistPerMember,
                'draw_date' => $drawDate,
            ]);

            // Update pending payment records installment amount
            CommitteeMemberPayment::where('schedule_id', $schedule->id)
                ->where('payment_status', 'pending')
                ->update(['amount_paid' => $kistPerMember]);
        }

        // Sync member payment entries for any new schedules or members
        $this->syncMemberPayments();
    }
}
