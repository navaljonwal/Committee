@extends('layouts.app')

@section('title', 'Member Payments - Month ' . $schedule->month_no)

@section('content')
<div class="space-y-8">
    <!-- Header -->
    <div class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <div class="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-1">
                <a href="{{ route('committees.show', $schedule->committee) }}" class="hover:text-emerald-400">
                    <i class="fa-solid fa-arrow-left mr-1"></i> {{ $schedule->committee->name }}
                </a>
                <span>/</span>
                <span class="text-emerald-400 font-bold">Month {{ $schedule->month_no }}</span>
            </div>
            <h1 class="text-2xl font-black text-white">
                Month {{ $schedule->month_no }} Member Payment Collection
            </h1>
            <p class="text-xs text-slate-400 mt-1">
                Installment Amount (Kist): <span class="text-white font-bold text-sm">₹{{ number_format($schedule->installment_per_member, 2) }}</span> per member.
            </p>
        </div>

        <div class="flex items-center space-x-3">
            @if($schedule->payments->isNotEmpty() && $schedule->committee->status !== 'completed')
                <form action="{{ route('schedules.payments.markAllPaid', $schedule) }}" method="POST" data-ajax="true">
                    @csrf
                    <button type="submit" class="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap">
                        <i class="fa-solid fa-check-double text-sm"></i>
                        <span>Mark All Paid</span>
                    </button>
                </form>
            @endif
            <a href="{{ route('committees.show', $schedule->committee) }}" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors whitespace-nowrap">
                Back to Committee Schedule
            </a>
        </div>
    </div>

    <!-- Winner Payout Info & Disbursement Banner -->
    <div class="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950">
        <div class="flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl {{ $schedule->payout_status === 'paid' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400' }} flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-trophy"></i>
            </div>
            <div>
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Month {{ $schedule->month_no }} Draw Winner Payout</span>
                    @if($schedule->winner)
                        @if($schedule->payout_status === 'paid')
                            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                PAID ({{ strtoupper($schedule->payout_mode ?? 'CASH') }})
                            </span>
                        @else
                            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                                UNPAID / PENDING
                            </span>
                        @endif
                    @endif
                </div>
                <div class="flex items-baseline space-x-3 mt-1">
                    <h2 class="text-lg font-black text-white">
                        {{ $schedule->winner ? $schedule->winner->name : 'No Winner Assigned Yet' }}
                    </h2>
                    <span class="text-sm font-bold font-mono text-emerald-400">
                        Net Payout: ₹{{ number_format($schedule->net_payout, 2) }}
                    </span>
                </div>

                @if($schedule->winner && $schedule->payout_status === 'paid')
                    <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                        @if(in_array($schedule->payout_mode, ['upi', 'split']) && $schedule->payout_upi_amount > 0)
                            <span class="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-blue-300">
                                <i class="fa-solid fa-mobile-screen-button mr-1"></i> UPI: ₹{{ number_format($schedule->payout_upi_amount, 2) }}
                                @if($schedule->payout_upi_ref) (Ref: #{{ $schedule->payout_upi_ref }}) @endif
                            </span>
                        @endif

                        @if(in_array($schedule->payout_mode, ['cash', 'split']) && $schedule->payout_cash_amount > 0)
                            <span class="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-emerald-300">
                                <i class="fa-solid fa-money-bill-wave mr-1"></i> Cash: ₹{{ number_format($schedule->payout_cash_amount, 2) }}
                                @if(!empty($schedule->payout_cash_notes))
                                    @php
                                        $noteParts = [];
                                        foreach(['500','200','100','50','20','10','5'] as $denom) {
                                            if (!empty($schedule->payout_cash_notes[$denom]) && $schedule->payout_cash_notes[$denom] > 0) {
                                                $noteParts[] = "₹{$denom}x" . $schedule->payout_cash_notes[$denom];
                                            }
                                        }
                                    @endphp
                                    @if(count($noteParts) > 0)
                                        <span class="text-slate-400 font-normal">({{ implode(', ', $noteParts) }})</span>
                                    @endif
                                @endif
                            </span>
                        @endif

                        @if($schedule->payout_remarks)
                            <span class="text-slate-400 italic">"{{ $schedule->payout_remarks }}"</span>
                        @endif
                    </div>
                @endif
            </div>
        </div>

        <div>
            @if($schedule->winner)
                @if($schedule->committee->status !== 'completed')
                    <button type="button"
                            data-schedule-id="{{ $schedule->hash_id }}"
                            data-month-no="{{ $schedule->month_no }}"
                            data-net-payout="{{ $schedule->net_payout }}"
                            data-winner-name="{{ $schedule->winner->name }}"
                            data-payout-status="{{ $schedule->payout_status }}"
                            data-payout-date="{{ $schedule->payout_date ? $schedule->payout_date->format('Y-m-d') : date('Y-m-d') }}"
                            data-payout-mode="{{ $schedule->payout_mode ?? 'cash' }}"
                            data-upi-amount="{{ $schedule->payout_upi_amount ?? 0 }}"
                            data-upi-ref="{{ $schedule->payout_upi_ref ?? '' }}"
                            data-cash-amount="{{ $schedule->payout_cash_amount ?? 0 }}"
                            data-cash-notes="{{ json_encode($schedule->payout_cash_notes ?? []) }}"
                            data-remarks="{{ $schedule->payout_remarks ?? '' }}"
                            onclick="openPayoutModalFromBtn(this)"
                            class="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center space-x-2">
                        <i class="fa-solid fa-hand-holding-dollar text-sm"></i>
                        <span>{{ $schedule->payout_status === 'paid' ? 'Edit Payout Details' : 'Record Winner Payout' }}</span>
                    </button>
                @endif
            @else
                <a href="{{ route('committees.show', $schedule->committee) }}" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-amber-400 hover:bg-slate-700 flex items-center space-x-1.5">
                    <i class="fa-solid fa-user-plus"></i>
                    <span>Assign Winner First</span>
                </a>
            @endif
        </div>
    </div>

    <!-- Summary Cards -->
    @php
        $totalBaseKist = $schedule->payments->sum('amount_paid');
        $totalLatePenalty = $schedule->payments->sum('penalty_amount');
        $grandTotalPayable = $schedule->payments->sum(fn($p) => $p->total_due);
        $paidPayments = $schedule->payments->where('payment_status', 'paid');
        $totalPaidAmount = $paidPayments->sum(fn($p) => $p->total_due);
        $paidCount = $paidPayments->count();
        $totalCount = $schedule->payments->count();
    @endphp

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Base Kist Total Card -->
        <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-calculator"></i>
            </div>
            <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Kist Total</p>
                <h3 class="text-lg font-black text-white font-mono mt-0.5">
                    ₹{{ number_format($totalBaseKist, 2) }}
                </h3>
            </div>
        </div>

        <!-- Late Penalties Total Card -->
        <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Late Penalties</p>
                <h3 class="text-lg font-black text-rose-400 font-mono mt-0.5">
                    +₹{{ number_format($totalLatePenalty, 2) }}
                </h3>
            </div>
        </div>

        <!-- Grand Total Payable Card (Base + Penalty) -->
        <div class="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-slate-900/80 flex items-center space-x-4 shadow-lg shadow-amber-500/5">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-vault"></i>
            </div>
            <div>
                <p class="text-xs font-bold text-amber-300 uppercase tracking-wider">Grand Total Payable</p>
                <h3 class="text-xl font-black text-amber-300 font-mono mt-0.5">
                    ₹{{ number_format($grandTotalPayable, 2) }}
                </h3>
                <span class="text-[10px] text-slate-400 font-medium">Base + Penalty</span>
            </div>
        </div>

        <!-- Collection Progress Card -->
        <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div>
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected / Total</p>
                <h3 class="text-lg font-black text-emerald-400 font-mono mt-0.5">
                    ₹{{ number_format($totalPaidAmount, 2) }}
                </h3>
                <p class="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {{ $paidCount }} of {{ $totalCount }} Paid
                </p>
            </div>
        </div>
    </div>

    <!-- Payments Matrix Table -->
    <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div class="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-receipt text-emerald-400"></i>
                <span>Member Installment Ledger & Penalty Manager</span>
            </h2>
            <div class="flex items-center space-x-3">
                <span class="text-xs font-semibold text-slate-400">
                    Total Members: {{ $schedule->payments->count() }}
                </span>
                @if($schedule->payments->isNotEmpty() && $schedule->committee->status !== 'completed')
                    <form action="{{ route('schedules.payments.markAllPaid', $schedule) }}" method="POST" data-ajax="true">
                        @csrf
                        <button type="submit" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                            <i class="fa-solid fa-check-double text-emerald-400"></i>
                            <span>Mark All Paid</span>
                        </button>
                    </form>
                @endif
            </div>
        </div>

        @if($schedule->payments->isEmpty())
            <div class="p-12 text-center text-slate-400 space-y-3">
                <i class="fa-solid fa-users text-2xl"></i>
                <p class="text-sm font-semibold">No members attached to this committee yet.</p>
                <a href="{{ route('committees.show', $schedule->committee) }}" class="text-xs text-emerald-400 hover:underline">
                    Go to Committee page and attach members.
                </a>
            </div>
        @else
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-950 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                            <th class="py-3.5 px-4">Member Name</th>
                            <th class="py-3.5 px-4 text-right">Base Kist (₹)</th>
                            <th class="py-3.5 px-4 text-right">Late Penalty (₹)</th>
                            <th class="py-3.5 px-4 text-right">Total Payable (₹)</th>
                            <th class="py-3.5 px-4 text-center">Status</th>
                            <th class="py-3.5 px-4 text-center">Payment Date</th>
                            <th class="py-3.5 px-4 text-center">WhatsApp Reminder</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 text-xs">
                        @foreach($schedule->payments as $p)
                            @php
                                $totalDue = $p->total_due;
                                $hasPenalty = ($p->penalty_amount > 0);
                                $totalMemberSeats = $p->member ? $schedule->committee->getMemberSeatsCount($p->member_id) : 1;
                                $seatLabel = ($totalMemberSeats > 1) ? ' (Seat #' . ($p->seat_no ?? 1) . ')' : '';
                            @endphp
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <!-- Member Name & Phone -->
                                <td class="py-3.5 px-4">
                                    <div class="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                                        <span>{{ $p->member ? $p->member->name : 'Unknown' }}</span>
                                        @if($totalMemberSeats > 1)
                                            <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase">
                                                <i class="fa-solid fa-user-tag text-[9px] mr-1"></i>Seat #{{ $p->seat_no ?? 1 }} of {{ $totalMemberSeats }}
                                            </span>
                                        @endif
                                    </div>
                                    <div class="text-[11px] text-slate-400">
                                        {{ $p->member ? ($p->member->phone ?? 'No phone') : '' }}
                                    </div>
                                </td>

                                <!-- Base Kist Amount -->
                                <td class="py-3.5 px-4 text-right font-mono font-semibold text-slate-300">
                                    ₹{{ number_format($p->amount_paid, 2) }}
                                </td>

                                <!-- Late Penalty -->
                                <td class="py-3.5 px-4 text-right">
                                    <div class="flex items-center justify-end space-x-2">
                                        @if($hasPenalty)
                                            <span class="font-mono font-extrabold text-rose-400">
                                                +₹{{ number_format($p->penalty_amount, 2) }}
                                            </span>
                                        @else
                                            <span class="font-mono text-slate-500">₹0.00</span>
                                        @endif

                                        @if($schedule->committee->status !== 'completed')
                                            <button type="button"
                                                    data-payment-id="{{ $p->hash_id }}"
                                                    data-member-name="{{ $p->member ? ($p->member->name . $seatLabel) : '' }}"
                                                    data-penalty-amount="{{ $p->penalty_amount }}"
                                                    data-remarks="{{ $p->remarks ?? '' }}"
                                                    onclick="openPenaltyModalFromBtn(this)"
                                                    class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                                                    title="Set Late Payment Penalty">
                                                <i class="fa-solid fa-pen-to-square text-[11px]"></i>
                                            </button>
                                        @endif
                                    </div>
                                    @if($p->remarks)
                                        <span class="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[130px] ml-auto">
                                            {{ $p->remarks }}
                                        </span>
                                    @endif
                                </td>

                                <!-- Total Payable -->
                                <td class="py-3.5 px-4 text-right font-mono font-black text-sm {{ $hasPenalty ? 'text-amber-300' : 'text-white' }}">
                                    ₹{{ number_format($totalDue, 2) }}
                                </td>

                                <!-- Payment Status Toggle -->
                                <td class="py-3.5 px-4 text-center">
                                    @if($schedule->committee->status === 'completed')
                                        <span class="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center justify-center gap-1 whitespace-nowrap {{ $p->payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40' }}">
                                            <i class="fa-solid {{ $p->payment_status === 'paid' ? 'fa-check-circle' : 'fa-clock' }}"></i>
                                            <span>{{ strtoupper($p->payment_status) }}</span>
                                        </span>
                                    @else
                                        <button onclick="togglePayment('{{ $p->hash_id }}', this)" class="px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1 whitespace-nowrap {{ $p->payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40' }}">
                                            <i class="fa-solid {{ $p->payment_status === 'paid' ? 'fa-check-circle' : 'fa-clock' }}"></i>
                                            <span class="status-text">{{ strtoupper($p->payment_status) }}</span>
                                        </button>
                                    @endif
                                </td>

                                <!-- Payment Date -->
                                <td class="py-3.5 px-4 text-center font-mono text-slate-400 date-text whitespace-nowrap">
                                    {{ $p->payment_date ? $p->payment_date->format('d M Y') : '-' }}
                                </td>

                                <!-- WhatsApp Button -->
                                <td class="py-3.5 px-4 text-center">
                                    @if($p->member && $p->member->phone)
                                        @php
                                            $cleanPhone = preg_replace('/[^0-9]/', '', $p->member->phone);
                                            if (strlen($cleanPhone) == 10) { $cleanPhone = '91' . $cleanPhone; }
                                            $nameWithSeat = $p->member->name . $seatLabel;

                                            if ($hasPenalty) {
                                                $msg = "Hello " . $nameWithSeat . ", your Month " . $schedule->month_no . " committee installment is ₹" . number_format($p->amount_paid, 2) . " + Late Penalty ₹" . number_format($p->penalty_amount, 2) . " = Total ₹" . number_format($totalDue, 2) . ". Please pay as soon as possible. Thank you!";
                                            } else {
                                                $msg = "Hello " . $nameWithSeat . ", your Month " . $schedule->month_no . " committee installment is ₹" . number_format($p->amount_paid, 2) . ". Please pay by the due date. Thank you!";
                                            }
                                            $waUrl = "https://wa.me/" . $cleanPhone . "?text=" . urlencode($msg);
                                        @endphp
                                        <a href="{{ $waUrl }}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors whitespace-nowrap">
                                            <i class="fa-brands fa-whatsapp text-sm"></i>
                                            <span>Send Reminder</span>
                                        </a>
                                    @else
                                        <span class="text-slate-500 text-[11px]">No phone</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                    <tfoot>
                        <tr class="bg-slate-950/90 font-extrabold text-white border-t-2 border-slate-800">
                            <td class="py-4 px-4 text-xs uppercase tracking-wider text-slate-300">
                                Grand Total (Month {{ $schedule->month_no }})
                            </td>
                            <td class="py-4 px-4 text-right font-mono text-sm text-slate-300">
                                ₹{{ number_format($totalBaseKist, 2) }}
                            </td>
                            <td class="py-4 px-4 text-right font-mono text-sm text-rose-400">
                                +₹{{ number_format($totalLatePenalty, 2) }}
                            </td>
                            <td class="py-4 px-4 text-right font-mono text-base text-amber-300">
                                ₹{{ number_format($grandTotalPayable, 2) }}
                            </td>
                            <td colspan="3" class="py-4 px-4 text-xs text-slate-400 text-center font-medium">
                                Base Kist + Total Late Penalties
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        @endif
    </div>
</div>

<!-- Set Late Penalty Modal -->
<div id="penaltyModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2.5">
                <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-base">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Add Late Payment Penalty</h3>
                    <span id="penaltyModalMemberName" class="text-xs text-rose-400 font-semibold">Member Name</span>
                </div>
            </div>
            <button onclick="document.getElementById('penaltyModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form id="penaltyForm" action="" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Late Penalty Fine Amount (₹)</label>
                <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input type="number" name="penalty_amount" id="penalty_input_amount" min="0" step="10" placeholder="e.g. 100" required
                           class="w-full pl-8 pr-4 py-2.5 rounded-xl glass-input text-sm text-rose-300 font-extrabold focus:outline-none">
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Remarks / Reason (Optional)</label>
                <input type="text" name="remarks" id="penalty_input_remarks" placeholder="e.g. 5 days late fee"
                       class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
            </div>

            <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('penaltyModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20">Save Penalty</button>
            </div>
        </form>
    </div>
</div>

@include('partials.payout-modal')
@endsection

@section('scripts')
<script>
    function togglePayment(paymentId, btn) {
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        fetch(`/payments/${paymentId}/toggle`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const statusSpan = btn.querySelector('.status-text');
                const row = btn.closest('tr');
                const dateTd = row.querySelector('.date-text');

                if (data.status === 'paid') {
                    btn.className = 'px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
                    btn.querySelector('i').className = 'fa-solid fa-check-circle mr-1';
                    statusSpan.innerText = 'PAID';
                    dateTd.innerText = data.payment_date;
                } else {
                    btn.className = 'px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-all bg-rose-500/20 text-rose-300 border border-rose-500/40';
                    btn.querySelector('i').className = 'fa-solid fa-clock mr-1';
                    statusSpan.innerText = 'PENDING';
                    dateTd.innerText = '-';
                }
            }
        })
        .catch(err => console.error('Error toggling payment:', err));
    }

    function openPenaltyModalFromBtn(btn) {
        const ds = btn.dataset;
        openPenaltyModal(
            ds.paymentId,
            ds.memberName,
            ds.penaltyAmount,
            ds.remarks
        );
    }

    function openPenaltyModal(paymentId, memberName, currentPenalty, remarks) {
        const form = document.getElementById('penaltyForm');
        form.action = `/payments/${paymentId}/penalty`;

        document.getElementById('penaltyModalMemberName').innerText = memberName;
        document.getElementById('penalty_input_amount').value = currentPenalty;
        document.getElementById('penalty_input_remarks').value = remarks || '';

        document.getElementById('penaltyModal').classList.remove('hidden');
    }
</script>
@endsection
