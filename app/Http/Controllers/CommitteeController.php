<?php

namespace App\Http\Controllers;

use App\Models\Committee;
use App\Models\CommitteeSchedule;
use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CommitteeController extends Controller
{
    /**
     * Display dashboard with committees summary and creation modal/form.
     */
    public function index()
    {
        $committees = Committee::withCount(['schedules', 'members'])
            ->orderBy('created_at', 'desc')
            ->get();

        $members = Member::orderBy('name', 'asc')->get();

        $stats = [
            'total_committees' => $committees->count(),
            'active_committees' => $committees->where('status', 'active')->count(),
            'total_pool_value' => $committees->sum('total_amount'),
            'total_members' => $members->count(),
        ];

        return view('committees.index', compact('committees', 'members', 'stats'));
    }

    /**
     * Show create committee form.
     */
    public function create()
    {
        $members = Member::orderBy('name', 'asc')->get();
        return view('committees.create', compact('members'));
    }

    /**
     * Live AJAX calculation preview endpoint.
     */
    public function preview(Request $request)
    {
        $v = (float) $request->input('total_amount', 200000);
        $m = (int) $request->input('total_members', 20);
        $r = (float) $request->input('deduction_rate', 1.5);
        $specialIndex = (int) $request->input('special_month_index', $m - 1);
        $startDateStr = $request->input('start_date', date('Y-m-d'));

        if ($m <= 0) {
            return response()->json(['error' => 'Total members must be greater than 0'], 422);
        }

        $baseUnit = ($v * $r) / 100;
        $rows = [];
        $totalDeductionSum = 0;
        $totalNetPayoutSum = 0;

        $startDate = Carbon::parse($startDateStr);

        for ($month = 1; $month <= $m; $month++) {
            $indexN = $m - $month + 1;
            $isSpecial = ($indexN === $specialIndex);
            $deduction = $isSpecial ? 0.0 : ($indexN * $baseUnit);
            $netPayout = $v - $deduction;
            $kist = $netPayout / $m;

            $totalDeductionSum += $deduction;
            $totalNetPayoutSum += $netPayout;

            $rows[] = [
                'month_no' => $month,
                'index_n' => $indexN,
                'is_special' => $isSpecial,
                'deduction_amount' => $deduction,
                'net_payout' => $netPayout,
                'installment_per_member' => $kist,
                'draw_date' => $startDate->copy()->addMonths($month - 1)->format('d M Y'),
            ];
        }

        $totalMemberContribution = $totalNetPayoutSum / $m;

        return response()->json([
            'base_unit' => $baseUnit,
            'rows' => $rows,
            'total_deduction_sum' => $totalDeductionSum,
            'total_net_payout_sum' => $totalNetPayoutSum,
            'total_member_contribution' => $totalMemberContribution,
            'total_pool_collected' => $totalNetPayoutSum,
        ]);
    }

    /**
     * Store new committee and generate schedules.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'total_amount' => 'required|numeric|min:1000',
            'total_members' => 'required|integer|min:1|max:200',
            'deduction_rate' => 'required|numeric|min:0|max:100',
            'special_month_index' => 'required|integer',
            'start_date' => 'required|date',
            'members' => 'nullable|array',
            'members.*' => 'exists:members,id',
        ]);

        $committee = Committee::create([
            'name' => $validated['name'],
            'total_amount' => $validated['total_amount'],
            'total_members' => $validated['total_members'],
            'deduction_rate' => $validated['deduction_rate'],
            'special_month_index' => $validated['special_month_index'],
            'start_date' => $validated['start_date'],
            'status' => 'active',
        ]);

        $maxMembers = (int) $validated['total_members'];
        $memberIds = $validated['members'] ?? [];
        $seatsInput = $request->input('seats', []);

        if (!empty($memberIds)) {
            $syncData = [];
            $totalSeats = 0;
            foreach ($memberIds as $mId) {
                $seatCount = isset($seatsInput[$mId]) ? max(1, (int)$seatsInput[$mId]) : 1;
                if ($totalSeats + $seatCount <= $maxMembers) {
                    $syncData[$mId] = ['seats' => $seatCount];
                    $totalSeats += $seatCount;
                }
            }
            $committee->members()->sync($syncData);
        }

        // Generate dynamic calculation schedule entries
        $committee->generateSchedules();

        $msg = 'Committee created successfully with calculated schedule!';
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success'  => true,
                'message'  => $msg,
                'redirect' => route('committees.show', $committee),
            ]);
        }

        return redirect()->route('committees.show', $committee)
            ->with('success', $msg);
    }

    /**
     * Show detail view with full schedule table and grand totals.
     */
    public function show(Request $request, $id)
    {
        $numericId = is_numeric($id) ? (int)$id : \App\Services\IdEncoder::decode($id);

        $committee = Committee::with([
            'schedules.winner',
            'schedules.bids.member',
            'members'
        ])->findOrFail($numericId);

        // Pre-associate committee on schedules to prevent lazy loading queries
        $committee->schedules->each(fn ($s) => $s->setRelation('committee', $committee));

        $schedules = $committee->schedules;
        $members = $committee->members;
        $allMembers = Member::orderBy('name', 'asc')->get();

        // Fast aggregated payment statistics for schedule table (1 single query instead of hundreds of model hydrations)
        $paymentStats = \App\Models\CommitteeMemberPayment::whereIn('schedule_id', $schedules->pluck('id'))
            ->selectRaw("schedule_id, count(*) as total, SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count, SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count")
            ->groupBy('schedule_id')
            ->get()
            ->keyBy('schedule_id');

        // Calculate Grand Totals
        $grandTotalDeductions = $schedules->sum('deduction_amount');
        $grandTotalNetPayout = $schedules->sum('net_payout');
        $grandTotalKistPerMember = $schedules->sum('installment_per_member');

        return view('committees.show', compact(
            'committee',
            'schedules',
            'members',
            'allMembers',
            'paymentStats',
            'grandTotalDeductions',
            'grandTotalNetPayout',
            'grandTotalKistPerMember'
        ));
    }

    /**
     * Approve a member's submitted auction bid and set it as official schedule deduction & winner.
     */
    public function approveMemberBid(Request $request, $bidId)
    {
        $bid = \App\Models\MemberBid::with(['schedule.committee', 'schedule.payments'])->findOrFail($bidId);
        $schedule = $bid->schedule;
        $committee = $schedule->committee;

        if ($committee && $committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. No modifications are allowed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $v = (float) $committee->total_amount;
        $m = (int) $committee->total_members;

        $customDeduction = (float) $bid->bid_amount;
        $netPayout = $v - $customDeduction;
        $installmentPerMember = $netPayout / $m;

        // Mark all bids for this schedule
        \App\Models\MemberBid::where('schedule_id', $schedule->id)->update(['status' => 'rejected']);
        $bid->update(['status' => 'approved']);

        // Update schedule
        $schedule->update([
            'custom_deduction_amount' => $customDeduction,
            'deduction_amount' => $customDeduction,
            'is_custom_bid' => true,
            'net_payout' => $netPayout,
            'installment_per_member' => $installmentPerMember,
            'member_id' => $bid->member_id,
        ]);

        // Sync payment records for this month with single bulk update
        $schedule->payments()->update([
            'amount_paid' => $installmentPerMember,
        ]);

        $msg = 'Approved auction bid of ₹' . number_format($customDeduction, 2) . ' from ' . ($bid->member ? $bid->member->name : 'Member') . '!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Update schedule winner member and draw date.
     */
    public function updateWinner(Request $request, $scheduleId)
    {
        $validated = $request->validate([
            'member_id' => 'nullable|exists:members,id',
            'draw_date' => 'nullable|date',
        ]);

        $schedule = CommitteeSchedule::with('committee')->findOrFail($scheduleId);
        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Winner cannot be updated.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }
        $schedule->update([
            'member_id' => $validated['member_id'] ?? null,
            'draw_date' => $validated['draw_date'] ?? $schedule->draw_date,
        ]);

        $msg = 'Draw winner updated for Month ' . $schedule->month_no;

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Update committee start date and recalculate draw dates for all rounds.
     */
    public function updateStartDate(Request $request, $id)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
        ]);

        $committee = Committee::findOrFail($id);
        if ($committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Start date cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }
        $committee->update([
            'start_date' => $validated['start_date'],
        ]);

        $committee->recalculateSchedules();

        $msg = 'Committee start date updated to ' . \Illuminate\Support\Carbon::parse($validated['start_date'])->format('d M Y') . ' and all schedule dates recalculated!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Update individual schedule draw date.
     */
    public function updateScheduleDate(Request $request, $scheduleId)
    {
        $validated = $request->validate([
            'draw_date' => 'required|date',
        ]);

        $schedule = CommitteeSchedule::with('committee')->findOrFail($scheduleId);
        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Draw date cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }
        $schedule->update([
            'draw_date' => $validated['draw_date'],
        ]);

        $msg = 'Draw date for Month ' . $schedule->month_no . ' updated to ' . \Illuminate\Support\Carbon::parse($validated['draw_date'])->format('d M Y') . '!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Update winner payout disbursement details (Cash notes breakdown, UPI reference, Mode, Status).
     */
    public function updatePayout(Request $request, $scheduleId)
    {
        $schedule = CommitteeSchedule::with('committee')->findOrFail($scheduleId);
        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Payout details cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $validated = $request->validate([
            'payout_status' => 'required|in:unpaid,paid',
            'payout_date' => 'nullable|date',
            'payout_mode' => 'nullable|in:cash,upi,split',
            'payout_upi_amount' => 'nullable|numeric|min:0',
            'payout_upi_ref' => 'nullable|string|max:255',
            'payout_cash_amount' => 'nullable|numeric|min:0',
            'note_500' => 'nullable|integer|min:0',
            'note_200' => 'nullable|integer|min:0',
            'note_100' => 'nullable|integer|min:0',
            'note_50' => 'nullable|integer|min:0',
            'note_20' => 'nullable|integer|min:0',
            'note_10' => 'nullable|integer|min:0',
            'note_5' => 'nullable|integer|min:0',
            'payout_remarks' => 'nullable|string|max:255',
        ]);

        $cashNotes = [
            '500' => (int) ($request->input('note_500', 0)),
            '200' => (int) ($request->input('note_200', 0)),
            '100' => (int) ($request->input('note_100', 0)),
            '50'  => (int) ($request->input('note_50', 0)),
            '20'  => (int) ($request->input('note_20', 0)),
            '10'  => (int) ($request->input('note_10', 0)),
            '5'   => (int) ($request->input('note_5', 0)),
        ];

        // Calculate total cash sum from notes count
        $calculatedCashTotal = ($cashNotes['500'] * 500) +
                               ($cashNotes['200'] * 200) +
                               ($cashNotes['100'] * 100) +
                               ($cashNotes['50'] * 50) +
                               ($cashNotes['20'] * 20) +
                               ($cashNotes['10'] * 10) +
                               ($cashNotes['5'] * 5);

        $payoutCashAmount = (float) ($validated['payout_cash_amount'] ?? $calculatedCashTotal);
        if ($payoutCashAmount == 0 && $calculatedCashTotal > 0) {
            $payoutCashAmount = $calculatedCashTotal;
        }

        $payoutUpiAmount = (float) ($validated['payout_upi_amount'] ?? 0);

        $schedule->update([
            'payout_status' => $validated['payout_status'],
            'payout_date' => $validated['payout_status'] === 'paid' ? ($validated['payout_date'] ?? now()->toDateString()) : null,
            'payout_mode' => $validated['payout_mode'] ?? null,
            'payout_upi_amount' => $payoutUpiAmount,
            'payout_upi_ref' => $validated['payout_upi_ref'] ?? null,
            'payout_cash_amount' => $payoutCashAmount,
            'payout_cash_notes' => $cashNotes,
            'payout_remarks' => $validated['payout_remarks'] ?? null,
        ]);

        $msg = 'Winner Payout Disbursement details updated for Month ' . $schedule->month_no;

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Update custom auction bid deduction for a specific schedule month.
     */
    public function updateAuctionBid(Request $request, $scheduleId)
    {
        $schedule = CommitteeSchedule::with('committee', 'payments')->findOrFail($scheduleId);

        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Deduction/Bidding cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        if ($schedule->payout_status === 'paid') {
            $err = 'Cannot modify Month ' . $schedule->month_no . ' because payout is already Paid & Closed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $committee = $schedule->committee;
        $v = (float) $committee->total_amount;
        $m = (int) $committee->total_members;

        $validated = $request->validate([
            'custom_deduction_amount' => 'nullable|numeric|min:0|max:' . $v,
        ]);

        $customDeduction = isset($validated['custom_deduction_amount']) ? (float) $validated['custom_deduction_amount'] : 0.0;
        $netPayout = $v - $customDeduction;
        $installmentPerMember = $netPayout / $m;

        $schedule->update([
            'custom_deduction_amount' => $customDeduction,
            'deduction_amount' => $customDeduction,
            'is_custom_bid' => true,
            'net_payout' => $netPayout,
            'installment_per_member' => $installmentPerMember,
        ]);

        // Sync payment records for this month to reflect updated installment with single bulk update
        $schedule->payments()->update([
            'amount_paid' => $installmentPerMember,
        ]);

        $msg = 'Custom auction bid updated for Month ' . $schedule->month_no . '. Installment per member recalculated to ₹' . number_format($installmentPerMember, 2);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Lock schedule round at default formula deduction without requiring custom bid.
     */
    public function lockFormulaDefault(Request $request, $scheduleId)
    {
        $schedule = CommitteeSchedule::with('committee', 'payments')->findOrFail($scheduleId);

        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Bidding cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        if ($schedule->payout_status === 'paid') {
            $err = 'Cannot lock Month ' . $schedule->month_no . ' because payout is already Paid & Closed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $committee = $schedule->committee;
        $v = (float) $committee->total_amount;
        $m = (int) $committee->total_members;
        $formulaDeduction = (float) $schedule->formula_deduction;

        $netPayout = $v - $formulaDeduction;
        $installmentPerMember = $netPayout / $m;

        $schedule->update([
            'custom_deduction_amount' => $formulaDeduction,
            'deduction_amount' => $formulaDeduction,
            'is_custom_bid' => true,
            'net_payout' => $netPayout,
            'installment_per_member' => $installmentPerMember,
        ]);

        $schedule->payments()->update([
            'amount_paid' => $installmentPerMember,
        ]);

        $msg = 'Month ' . $schedule->month_no . ' locked at formula amount (₹' . number_format($formulaDeduction, 2) . '). Bidding closed.';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Reset auction bid back to formula default (blocked once locked or paid).
     */
    public function resetAuctionBid(Request $request, $scheduleId)
    {
        $schedule = CommitteeSchedule::with('committee', 'payments')->findOrFail($scheduleId);

        if ($schedule->committee && $schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Bidding cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        if ($schedule->payout_status === 'paid' || $schedule->is_custom_bid) {
            $err = 'Cannot reset Month ' . $schedule->month_no . ' because bidding has already been locked or Paid & Closed.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $msg = 'Month ' . $schedule->month_no . ' is already at formula default.';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('info', $msg);
    }

    /**
     * Attach members to committee and sync payment records.
     */
    public function updateMembers(Request $request, $committeeId)
    {
        $committee = Committee::findOrFail($committeeId);

        if ($committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Member list cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }
        $memberIds = $request->input('members', []);
        $seatsInput = $request->input('seats', []);

        $syncData = [];
        $totalAssignedSeats = 0;
        foreach ($memberIds as $mId) {
            $seatCount = isset($seatsInput[$mId]) ? max(1, (int)$seatsInput[$mId]) : 1;
            $syncData[$mId] = ['seats' => $seatCount];
            $totalAssignedSeats += $seatCount;
        }

        if ($totalAssignedSeats > $committee->total_members) {
            $err = 'Cannot assign more than ' . $committee->total_members . ' total seats to this ' . $committee->total_members . '-month committee. (Selected: ' . $totalAssignedSeats . ' seats).';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $committee->members()->sync($syncData);

        // Sync member payments without deleting schedules or existing payment history
        $committee->syncMemberPayments();

        $msg = 'Committee members & seats updated successfully (' . $totalAssignedSeats . '/' . $committee->total_members . ' seats assigned)!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Show edit form for committee.
     */
    public function edit($id)
    {
        $committee = Committee::with('members')->findOrFail($id);
        $members = Member::orderBy('name', 'asc')->get();

        return view('committees.edit', compact('committee', 'members'));
    }

    /**
     * Update committee details and recalculate schedule formulas/dates.
     */
    public function update(Request $request, $id)
    {
        $committee = Committee::findOrFail($id);

        if ($committee->status === 'completed') {
            $err = 'This committee is Completed & Closed and cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'total_amount' => 'required|numeric|min:1000',
            'total_members' => 'required|integer|min:1|max:200',
            'deduction_rate' => 'required|numeric|min:0|max:100',
            'special_month_index' => 'required|integer',
            'start_date' => 'required|date',
            'status' => 'required|in:active,completed,paused',
            'members' => 'nullable|array',
            'members.*' => 'exists:members,id',
        ]);

        $committee->update([
            'name' => $validated['name'],
            'total_amount' => $validated['total_amount'],
            'total_members' => $validated['total_members'],
            'deduction_rate' => $validated['deduction_rate'],
            'special_month_index' => $validated['special_month_index'],
            'start_date' => $validated['start_date'],
            'status' => $validated['status'],
        ]);

        if ($request->has('update_members_list')) {
            $memberIds = $request->input('members', []);
            $seatsInput = $request->input('seats', []);
            $syncData = [];
            $totalAssignedSeats = 0;
            $maxMembers = (int) $validated['total_members'];

            foreach ($memberIds as $mId) {
                $existingPivot = $committee->members->where('id', $mId)->first();
                $existingSeats = ($existingPivot && isset($existingPivot->pivot->seats)) ? (int)$existingPivot->pivot->seats : 1;
                $seatCount = isset($seatsInput[$mId]) ? max(1, (int)$seatsInput[$mId]) : $existingSeats;

                if ($totalAssignedSeats + $seatCount <= $maxMembers) {
                    $syncData[$mId] = ['seats' => $seatCount];
                    $totalAssignedSeats += $seatCount;
                }
            }
            $committee->members()->sync($syncData);
        }

        // Recalculate schedule formulas, draw dates & sync payments
        $committee->recalculateSchedules();

        $msg = 'Committee "' . $committee->name . '" updated successfully!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'redirect' => route('committees.show', $committee),
            ]);
        }

        return redirect()->route('committees.show', $committee)
            ->with('success', $msg);
    }

    /**
     * Delete a committee.
     */
    public function destroy(Request $request, $id)
    {
        $committee = Committee::findOrFail($id);

        if ($committee->status === 'completed') {
            $err = 'This committee is Completed & Closed and cannot be deleted.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }
        $committee->delete();

        $msg = 'Committee deleted successfully.';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'redirect' => route('committees.index'),
            ]);
        }

        return redirect()->route('committees.index')->with('success', $msg);
    }
}
