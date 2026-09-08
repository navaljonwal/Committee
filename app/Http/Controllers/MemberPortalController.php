<?php

namespace App\Http\Controllers;

use App\Models\Committee;
use App\Models\CommitteeSchedule;
use App\Models\MemberBid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MemberPortalController extends Controller
{
    public function dashboard()
    {
        $user   = Auth::user();
        $member = $user->member;

        if (!$member) {
            return view('member_portal.dashboard', [
                'user'            => $user,
                'member'          => null,
                'committees'      => collect(),
                'myBids'          => collect(),
                'pendingPayments' => collect(),
            ]);
        }

        // All committees this member belongs to (supports 1, 2, 3+ committees)
        $committees = $member->committees()->with(['schedules.winner', 'schedules.bids.member', 'members'])->get();

        // Member's submitted bids
        $myBids = MemberBid::with('schedule.committee')
            ->where('member_id', $member->id)
            ->latest()
            ->get();

        // Pending payment ledgers
        $pendingPayments = $member->payments()
            ->with(['schedule.committee'])
            ->where('payment_status', 'pending')
            ->get();

        return view('member_portal.dashboard', compact('user', 'member', 'committees', 'myBids', 'pendingPayments'));
    }

    public function showCommittee($committeeId)
    {
        $numericId = is_numeric($committeeId) ? (int)$committeeId : \App\Services\IdEncoder::decode($committeeId);

        $user   = Auth::user();
        $member = $user->member;

        if (!$member) {
            return redirect()->route('member.dashboard')->with('error', 'No member profile attached to your account.');
        }

        $committee = Committee::with([
            'schedules.winner',
            'schedules.bids.member', // All bids from all members
            'members',
        ])->findOrFail($numericId);

        // Pre-associate committee on schedules to prevent lazy loading queries
        $committee->schedules->each(fn ($s) => $s->setRelation('committee', $committee));

        // Ensure member belongs to this committee
        if (!$committee->members->contains('id', $member->id)) {
            return redirect()->route('member.dashboard')->with('error', 'You are not enrolled in this committee.');
        }

        $schedules = $committee->schedules;

        // My payment ledger for this committee (grouped by schedule_id to support multi-seat payments)
        $myPayments = $member->payments()
            ->whereIn('schedule_id', $schedules->pluck('id'))
            ->get()
            ->groupBy('schedule_id');

        // My bids keyed by schedule_id
        $myBids = MemberBid::where('member_id', $member->id)
            ->whereIn('schedule_id', $schedules->pluck('id'))
            ->get()
            ->keyBy('schedule_id');

        // All bids for all schedules, grouped by schedule_id
        // so the view can render per-round bid lists
        $allBidsBySchedule = MemberBid::with('member')
            ->whereIn('schedule_id', $schedules->pluck('id'))
            ->orderBy('bid_amount', 'desc') // highest deduction = top auction bid
            ->get()
            ->groupBy('schedule_id');

        $totalSeats = $committee->getMemberSeatsCount($member->id);
        $wonCount = $committee->getMemberWonCount($member->id);
        $alreadyWonAllSeats = ($wonCount >= $totalSeats);

        $alreadyWon = $alreadyWonAllSeats;
        $alreadyAssignedWinner = ($wonCount > 0);
        $remainingSeats = max(0, $totalSeats - $wonCount);

        return view('member_portal.show', compact(
            'committee', 'schedules', 'member',
            'myPayments', 'myBids', 'allBidsBySchedule',
            'alreadyWon', 'alreadyAssignedWinner', 'alreadyWonAllSeats',
            'totalSeats', 'wonCount', 'remainingSeats'
        ));
    }

    /**
     * Real-time AJAX endpoint — returns live bid data for all schedule rounds.
     * Called every ~10s by the member portal JavaScript for live updates.
     */
    public function liveBids($committeeId)
    {
        $user   = Auth::user();
        $member = $user->member;

        if (!$member && !$user->isAdmin()) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $numericId = is_numeric($committeeId) ? (int)$committeeId : \App\Services\IdEncoder::decode($committeeId);
        $committee = Committee::with('schedules')->findOrFail($numericId);

        // Security: only enrolled members or admin
        if (!$user->isAdmin() && !$committee->members()->where('member_id', $member?->id)->exists()) {
            return response()->json(['error' => 'Not enrolled.'], 403);
        }

        $scheduleIds = $committee->schedules->pluck('id');

        // Fetch all current bids grouped by schedule - highest deduction first (auction standard)
        $allBids = MemberBid::with('member:id,name')
            ->whereIn('schedule_id', $scheduleIds)
            ->orderBy('bid_amount', 'desc')
            ->get()
            ->groupBy('schedule_id')
            ->map(fn ($bids) => $bids->map(fn ($b) => [
                'id'         => $b->id,
                'member_id'  => $b->member_id,
                'my_bid'     => $member ? ($b->member_id === $member->id) : false,
                'name'       => $b->member->name ?? 'Unknown',
                'bid_amount' => (float) $b->bid_amount,
                'remarks'    => $b->remarks,
                'status'     => $b->status,
            ]));

        // Calculate highest bid per schedule for instant UI sync
        $highestBids = [];
        foreach ($committee->schedules as $sched) {
            $sid = $sched->id;
            $bidsList = $allBids->get($sid);
            $top = $bidsList ? $bidsList->first() : null;
            $baseDeduct = (float) ($sched->deduction_amount ?? 0);
            $topAmount = $top ? (float) $top['bid_amount'] : 0.0;
            $minNextBid = $topAmount > 0 ? ($topAmount + 1) : max(0, $baseDeduct);

            $highestBids[$sid] = [
                'amount'         => $top ? (float) $top['bid_amount'] : null,
                'name'           => $top ? $top['name'] : null,
                'id'             => $top ? $top['id'] : null,
                'base_deduction' => $baseDeduct,
                'min_next_bid'   => $minNextBid,
            ];
        }

        // Fetch lock status and date status for each schedule
        $today = now()->startOfDay();
        $lockStatus = $committee->schedules->mapWithKeys(function ($s) use ($committee, $today) {
            $effectiveDrawDate = $s->draw_date ?? ($committee->start_date ? \Illuminate\Support\Carbon::parse($committee->start_date)->addMonths($s->month_no - 1) : null);
            $drawDate = $effectiveDrawDate ? \Illuminate\Support\Carbon::parse($effectiveDrawDate)->startOfDay() : null;

            $dateStatus = 'today';
            if ($drawDate) {
                if ($today->lt($drawDate)) {
                    $dateStatus = 'before';
                } elseif ($today->gt($drawDate)) {
                    $dateStatus = 'after';
                }
            }

            return [
                $s->id => [
                    'is_locked'   => (bool) $s->is_custom_bid,
                    'month_no'    => $s->month_no,
                    'winner_id'   => $s->member_id,
                    'date_status' => $dateStatus,
                    'draw_date'   => $drawDate ? $drawDate->format('d/m/Y') : null,
                ],
            ];
        });

        return response()->json([
            'timestamp'    => now()->toDateTimeString(),
            'bids'         => $allBids,
            'highest_bids' => $highestBids,
            'lock_status'  => $lockStatus,
        ]);
    }

    public function submitBid(Request $request, $scheduleId)
    {
        $user   = Auth::user();
        $member = $user->member;

        if (!$member) {
            return redirect()->back()->with('error', 'No member profile found.');
        }

        $schedule  = CommitteeSchedule::with('committee.schedules')->findOrFail($scheduleId);
        $committee = $schedule->committee;
        $v         = (float) $committee->total_amount;

        if ($committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. No new bids can be submitted.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        // ─── GUARD 1: Round locked — admin already approved a bid for this round ───
        if ($schedule->is_custom_bid) {
            return redirect()->back()->with('error',
                'Bidding for Month ' . $schedule->month_no . ' has been closed by the organizer. No more bids can be submitted for this round.'
            );
        }

        // ─── GUARD 2: Draw Date Restriction — bidding is ONLY allowed on the draw date ───
        $effectiveDrawDate = $schedule->draw_date ?? ($committee->start_date ? \Illuminate\Support\Carbon::parse($committee->start_date)->addMonths($schedule->month_no - 1) : null);

        if ($effectiveDrawDate) {
            $today    = now()->startOfDay();
            $drawDate = \Illuminate\Support\Carbon::parse($effectiveDrawDate)->startOfDay();

            if ($today->lt($drawDate)) {
                return redirect()->back()->with('error',
                    'Bidding for Month ' . $schedule->month_no . ' will open on ' . $drawDate->format('d/m/Y') . '. You cannot submit a bid before the draw date.'
                );
            }

            if ($today->gt($drawDate)) {
                return redirect()->back()->with('error',
                    'Bidding for Month ' . $schedule->month_no . ' closed on ' . $drawDate->format('d/m/Y') . '. Bids can only be submitted on the draw date.'
                );
            }
        }

        // ─── GUARD 3: Member fulfilled all registered seats in this committee ───
        $totalSeats = $committee->getMemberSeatsCount($member->id);
        $wonCount   = $committee->getMemberWonCount($member->id);

        if ($wonCount >= $totalSeats) {
            $err = 'You have already won draws for all ' . $totalSeats . ' of your registered seats in this committee and cannot place new auction bids.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $validated = $request->validate([
            'bid_amount' => 'required|numeric|min:0|max:' . $v,
            'remarks'    => 'nullable|string|max:255',
        ]);

        $newBidAmount  = (float) $validated['bid_amount'];
        $baseDeduction = (float) ($schedule->deduction_amount ?? 0);

        // ─── STRICT AUCTION BID RULE: Must strictly exceed current highest bid across all members ───
        $currentHighestBid = (float) (MemberBid::where('schedule_id', $scheduleId)->max('bid_amount') ?? 0);

        // 1. If any member has already placed a bid, new bid must be strictly higher
        if ($currentHighestBid > 0 && $newBidAmount <= $currentHighestBid) {
            $minRequired = $currentHighestBid + 1;
            $err = 'Current highest bid is ₹' . number_format($currentHighestBid, 0) .
                   '. You cannot bid ₹' . number_format($newBidAmount, 0) .
                   '. Your bid must be strictly higher (at least ₹' . number_format($minRequired, 0) . ').';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        // 2. If no bids have been placed yet, first bid cannot be less than the starting base deduction
        if ($currentHighestBid == 0 && $baseDeduction > 0 && $newBidAmount < $baseDeduction) {
            $err = 'Starting bid for Month ' . $schedule->month_no .
                   ' cannot be less than ₹' . number_format($baseDeduction, 0) . '.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $existingBid = MemberBid::where('schedule_id', $scheduleId)
            ->where('member_id', $member->id)
            ->first();

        MemberBid::updateOrCreate(
            ['schedule_id' => $scheduleId, 'member_id' => $member->id],
            [
                'bid_amount' => $newBidAmount,
                'remarks'    => $validated['remarks'] ?? null,
                'status'     => 'pending',
            ]
        );

        $isEdit = (bool) $existingBid;
        $msg = ($isEdit ? 'Bid updated' : 'Bid placed') . ' — ₹' . number_format($newBidAmount, 2) .
            ' for Month ' . $schedule->month_no . '. Visible to all members in real-time.';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }
}
