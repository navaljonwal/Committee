<?php

namespace App\Http\Controllers;

use App\Models\CommitteeMemberPayment;
use App\Models\CommitteeSchedule;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function schedulePayments($scheduleId)
    {
        $schedule = CommitteeSchedule::with(['committee.members', 'winner'])->findOrFail($scheduleId);

        // Sync member payments to clean up removed members & add new ones automatically
        $schedule->committee->syncMemberPayments();

        // Load payments for currently attached committee members only, ordered by member and seat
        $activeMemberIds = $schedule->committee->members->pluck('id');
        $schedule->load(['payments' => function ($query) use ($activeMemberIds) {
            $query->whereIn('member_id', $activeMemberIds)->orderBy('member_id')->orderBy('seat_no');
        }, 'payments.member']);

        return view('payments.schedule', compact('schedule'));
    }

    public function toggle(Request $request, $paymentId)
    {
        $payment = CommitteeMemberPayment::with('schedule.committee')->findOrFail($paymentId);

        if ($payment->schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Payments cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        if ($payment->payment_status === 'paid') {
            $payment->update([
                'payment_status' => 'pending',
                'payment_date' => null,
            ]);
            $status = 'pending';
        } else {
            $payment->update([
                'payment_status' => 'paid',
                'payment_date' => now()->toDateString(),
            ]);
            $status = 'paid';
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'status' => $status,
                'payment_date' => $payment->payment_date ? $payment->payment_date->format('d M Y') : '-',
            ]);
        }

        return redirect()->back()->with('success', 'Payment status updated!');
    }

    public function updatePenalty(Request $request, $paymentId)
    {
        $payment = CommitteeMemberPayment::with('schedule.committee')->findOrFail($paymentId);

        if ($payment->schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Late penalty cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        $validated = $request->validate([
            'penalty_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:255',
        ]);

        $payment->update([
            'penalty_amount' => $validated['penalty_amount'],
            'remarks' => $validated['remarks'] ?? null,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'penalty_amount' => (float)$payment->penalty_amount,
                'total_due' => (float)$payment->total_due,
            ]);
        }

        return redirect()->back()->with('success', 'Late payment penalty updated successfully!');
    }

    public function markAllPaid(Request $request, $scheduleId)
    {
        $schedule = CommitteeSchedule::with('committee.members')->findOrFail($scheduleId);

        if ($schedule->committee->status === 'completed') {
            $err = 'This committee is Completed & Closed. Payments cannot be modified.';
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $err], 422);
            }
            return redirect()->back()->with('error', $err);
        }

        // Sync member payments to clean up removed members
        $schedule->committee->syncMemberPayments();

        $activeMemberIds = $schedule->committee->members->pluck('id');

        CommitteeMemberPayment::where('schedule_id', $schedule->id)
            ->whereIn('member_id', $activeMemberIds)
            ->update([
                'payment_status' => 'paid',
                'payment_date' => now()->toDateString(),
            ]);

        $msg = 'All member payments for Month ' . $schedule->month_no . ' marked as PAID successfully!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }
}
