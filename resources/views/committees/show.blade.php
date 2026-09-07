@extends('layouts.app')

@section('title', $committee->name . ' - Schedule & Payout Details')

@section('content')
<div class="space-y-8">

    <!-- Committee Header & Summary -->
    <div class="glass-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-6 sm:space-y-7 relative overflow-hidden shadow-2xl">
        <!-- Ambient Glowing Background Accents -->
        <div class="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute right-1/3 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6 relative z-10">
            <div class="space-y-2 sm:space-y-3">
                <!-- Breadcrumbs & Status -->
                <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1.5 text-xs">
                    <a href="{{ route('committees.index') }}" class="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Committees
                    </a>
                    <span class="text-slate-600">/</span>
                    <span class="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {{ $committee->status }} CHIT
                    </span>
                    <span class="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center gap-1">
                        <i class="fa-regular fa-clock text-[10px] text-slate-500"></i> Created {{ $committee->created_at ? $committee->created_at->format('d M Y') : '' }}
                    </span>
                </div>

                <h1 class="text-xl sm:text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                    {{ $committee->name }}
                </h1>
                <p class="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Dynamic chit fund schedule with standard formula calculation, member auction bidding, and 1-click round locking.
                </p>
            </div>

            <!-- Header Action Buttons -->
            <div class="no-print grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                @if($committee->status !== 'completed')
                    <button type="button" onclick="document.getElementById('committeeDateModal').classList.remove('hidden')" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-calendar-days text-cyan-400"></i>
                        <span>Dates</span>
                    </button>
                    <a href="{{ route('committees.edit', $committee) }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                        <i class="fa-solid fa-pen-to-square text-amber-400"></i>
                        <span>Edit</span>
                    </a>
                @endif
                <a href="{{ route('committees.printView', $committee) }}" target="_blank" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i class="fa-solid fa-print text-blue-400"></i>
                    <span>Print</span>
                </a>
                <a href="{{ route('committees.exportCsv', $committee) }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i class="fa-solid fa-file-excel text-emerald-400"></i>
                    <span>Export</span>
                </a>
                <button onclick="document.getElementById('memberModal').classList.remove('hidden')" class="col-span-2 sm:col-span-1 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 hover:border-purple-500/60 transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <i class="fa-solid fa-user-group text-purple-400"></i>
                    <span>Members ({{ $members->count() }}/{{ $committee->total_members }})</span>
                </button>
            </div>
        </div>

        @if($committee->status === 'completed')
            <div class="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-4 shadow-xl">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <div>
                        <h3 class="font-extrabold text-sm text-white flex items-center gap-2">
                            <span>COMMITTEE COMPLETED &amp; CLOSED</span>
                            <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/30 text-emerald-200 uppercase font-black tracking-wider">Read Only</span>
                        </h3>
                        <p class="text-xs text-slate-300 mt-0.5">This chit fund committee is completed. All data and schedules are locked in read-only view mode.</p>
                    </div>
                </div>
            </div>
        @endif

        <!-- 4 Metric Specs Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
            <!-- Total Pool V -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-950/80 border border-amber-500/25 shadow-lg shadow-amber-500/5 glass-card-hover space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-amber-300/90 uppercase tracking-wider font-bold">Total Chit Pool (V)</span>
                    <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-vault"></i>
                    </div>
                </div>
                <div>
                    <span class="text-xl md:text-2xl font-black text-amber-300 font-mono block">₹{{ number_format($committee->total_amount, 2) }}</span>
                    <span class="text-[10px] text-slate-400 font-medium">Full Value Pot</span>
                </div>
            </div>

            <!-- Total Members M -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-950/80 border border-indigo-500/25 shadow-lg shadow-indigo-500/5 glass-card-hover space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-indigo-300/90 uppercase tracking-wider font-bold">Total Members (M)</span>
                    <div class="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-users"></i>
                    </div>
                </div>
                <div>
                    <span class="text-xl md:text-2xl font-black text-white block">{{ $committee->total_members }} Members</span>
                    <span class="text-[10px] text-slate-400 font-medium">{{ $committee->total_members }} Monthly Draws</span>
                </div>
            </div>

            <!-- Monthly Rate R -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900/60 to-slate-950/80 border border-emerald-500/25 shadow-lg shadow-emerald-500/5 glass-card-hover space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-emerald-300/90 uppercase tracking-wider font-bold">Monthly Rate (R)</span>
                    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-percent"></i>
                    </div>
                </div>
                <div>
                    <span class="text-xl md:text-2xl font-black text-emerald-400 block">{{ $committee->deduction_rate }}%</span>
                    <span class="text-[10px] text-slate-400 font-medium">Deduction Multiplier</span>
                </div>
            </div>

            <!-- Base Unit -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-slate-900/60 to-slate-950/80 border border-purple-500/25 shadow-lg shadow-purple-500/5 glass-card-hover space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-purple-300/90 uppercase tracking-wider font-bold">Base Unit Deduction</span>
                    <div class="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xs">
                        <i class="fa-solid fa-calculator"></i>
                    </div>
                </div>
                <div>
                    <span class="text-xl md:text-2xl font-black text-purple-300 font-mono block">
                        ₹{{ number_format(($committee->total_amount * $committee->deduction_rate) / 100, 2) }}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">V &times; R / 100</span>
                </div>
            </div>
        </div>

        <!-- Timeline Specs & Progress Bar Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <!-- Start Date Card -->
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 flex items-center justify-between glass-card-hover">
                <div class="space-y-1">
                    <span class="text-[11px] text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                        <i class="fa-solid fa-calendar-plus"></i> First Kisht Date
                    </span>
                    <span class="text-lg font-black text-white font-mono block">
                        {{ $committee->start_date ? $committee->start_date->format('d M Y') : 'Not Set' }}
                    </span>
                    <span class="text-[10px] text-slate-400">Month 1 Start</span>
                </div>
                @if($committee->status !== 'completed')
                    <button type="button" onclick="document.getElementById('committeeDateModal').classList.remove('hidden')" class="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs transition-all shadow-sm" title="Change Start Date">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                @endif
            </div>

            <!-- End Date Card -->
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/20 space-y-1 glass-card-hover">
                <span class="text-[11px] text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                    <i class="fa-solid fa-flag-checkered"></i> Maturity / End Date
                </span>
                <span class="text-lg font-black text-emerald-300 font-mono block">
                    {{ $committee->end_date ? $committee->end_date->format('d M Y') : 'Not Set' }}
                </span>
                <span class="text-[10px] text-slate-400">Month {{ $committee->total_members }} Final Draw</span>
            </div>

            <!-- Duration & Visual Progress Bar Card -->
            @php
                $paidDisbursedCount = $schedules->where('payout_status', 'paid')->count();
                $remainingKishtCount = max(0, $committee->total_members - $paidDisbursedCount);
                $disbursedPercent = $committee->total_members > 0 ? round(($paidDisbursedCount / $committee->total_members) * 100) : 0;
            @endphp
            <div class="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-2 glass-card-hover">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] text-amber-400 uppercase font-bold flex items-center gap-1.5">
                        <i class="fa-solid fa-hourglass-half"></i> Payout Progress
                    </span>
                    <span class="text-xs font-black text-amber-300 font-mono">{{ $disbursedPercent }}%</span>
                </div>
                <!-- Visual Progress Bar -->
                <div class="w-full bg-slate-800/90 rounded-full h-2 overflow-hidden">
                    <div class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-2 rounded-full transition-all duration-500" style="width: {{ $disbursedPercent }}%"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span class="text-emerald-400 font-semibold">{{ $paidDisbursedCount }} Disbursed</span>
                    <span class="text-slate-500">&bull;</span>
                    <span class="text-amber-400 font-semibold">{{ $remainingKishtCount }} Pending</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Schedule Table Container -->
    <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden space-y-4">
        <div class="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                    <i class="fa-solid fa-table-list text-emerald-400"></i>
                    <span>Monthly Installment & Net Payout Schedule</span>
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">Calculated from Month 1 (N={{ $committee->total_members }}) down to Month {{ $committee->total_members }} (N=1). Click "Bid / Edit" to adjust custom auction deductions.</p>
            </div>
            <div class="flex items-center space-x-2 text-xs font-semibold">
                <span class="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <i class="fa-solid fa-star text-[10px] mr-1"></i> Month 2 = Special 0% Deduction Round
                </span>
            </div>
        <!-- Mobile Swipe Helper Indicator -->
        <div class="md:hidden px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs flex items-center justify-between text-slate-400">
            <span class="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <i class="fa-solid fa-arrows-left-right text-[10px]"></i> Swipe horizontally to view full table
            </span>
            <span class="text-[10px] text-slate-500 font-mono">{{ $schedules->count() }} Kishts Total</span>
        </div>

        <!-- High-Contrast Schedule Table -->
        <div class="overflow-x-auto -mx-1 sm:mx-0">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-950 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th class="py-4 px-4 text-center">Kisht No.</th>
                        <th class="py-4 px-4 text-center">Draw Date</th>
                        <th class="py-4 px-4 text-right">Total Deduction (₹)</th>
                        <th class="py-4 px-4 text-right">Net Winner Payout (₹)</th>
                        <th class="py-4 px-4 text-right">Installment / Member (₹)</th>
                        <th class="py-4 px-4 text-center">Collection Status</th>
                        <th class="py-4 px-4">Winner Member</th>
                        <th class="py-4 px-4 no-print text-center">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                    @foreach($schedules as $s)
                        @php
                            $isSpecial = ($s->index_n === (int)$committee->special_month_index);
                            $effectiveDrawDate = $s->draw_date ?? ($committee->start_date ? \Illuminate\Support\Carbon::parse($committee->start_date)->addMonths($s->month_no - 1) : null);
                            $drawCarbon = $effectiveDrawDate ? \Illuminate\Support\Carbon::parse($effectiveDrawDate) : null;
                            $isPast = $drawCarbon ? $drawCarbon->isPast() && !$drawCarbon->isToday() : false;
                            $isToday = $drawCarbon ? $drawCarbon->isToday() : false;
                        @endphp
                        <tr class="{{ $isSpecial ? 'bg-amber-500/[0.07] border-l-4 border-l-amber-500 text-amber-200' : ($loop->even ? 'bg-slate-900/30 hover:bg-slate-800/40' : 'bg-slate-900/10 hover:bg-slate-800/40') }} transition-all duration-150">
                            <!-- Kisht No. -->
                            <td class="py-4 px-4 text-center font-bold">
                                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs {{ $isSpecial ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10' : 'bg-slate-800/90 text-white border border-slate-700/60 shadow-sm' }}">
                                    <i class="fa-solid fa-calendar-check text-[10px] {{ $isSpecial ? 'text-amber-400' : 'text-slate-400' }}"></i>
                                    <span>Month {{ $s->month_no }}</span>
                                </div>
                            </td>

                            <!-- Draw Date Column -->
                            <td class="py-4 px-4 text-center whitespace-nowrap">
                                @if($drawCarbon)
                                    <div class="flex items-center justify-center gap-2">
                                        <span class="font-mono font-bold text-xs {{ $isToday ? 'text-amber-300 font-black' : ($isPast ? 'text-slate-300' : 'text-cyan-300') }}">
                                            {{ $drawCarbon->format('d M Y') }}
                                        </span>
                                        @if($committee->status !== 'completed')
                                            <button type="button"
                                                    onclick="openScheduleDateModal({{ $s->id }}, {{ $s->month_no }}, '{{ $drawCarbon->format('Y-m-d') }}')"
                                                    class="no-print w-6 h-6 rounded-lg bg-slate-800/70 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/50 hover:border-cyan-500/40 transition-all flex items-center justify-center text-[10px]"
                                                    title="Change date for Month {{ $s->month_no }}">
                                                <i class="fa-solid fa-pen"></i>
                                            </button>
                                        @endif
                                    </div>
                                    @if($isToday)
                                        <span class="inline-block text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-1">TODAY</span>
                                    @elseif($isPast)
                                        <span class="inline-block text-[9px] text-slate-500 font-medium mt-1">Passed</span>
                                    @else
                                        <span class="inline-block text-[9px] text-cyan-400/90 font-medium mt-1">Upcoming</span>
                                    @endif
                                @else
                                    <span class="text-slate-500 italic text-xs">Not set</span>
                                @endif
                            </td>

                            <!-- Total Deduction -->
                            <td class="py-4 px-4 text-right font-mono {{ $isSpecial ? 'text-amber-300 font-black' : 'text-slate-300 font-semibold' }}">
                                @if($isSpecial && !$s->is_custom_bid)
                                    <div class="flex items-center justify-end gap-1.5 text-amber-300 font-black text-sm">
                                        <span>₹0.00</span>
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 border border-amber-500/30">Zero Round</span>
                                    </div>
                                @else
                                    <div class="text-sm">₹{{ number_format($s->deduction_amount, 2) }}</div>
                                    @if($s->is_custom_bid)
                                        <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-0.5 shadow-sm">
                                            <i class="fa-solid fa-gavel text-[8px]"></i> Auction Bid
                                        </span>
                                    @endif
                                @endif
                            </td>

                            <!-- Net Payout -->
                            <td class="py-4 px-4 text-right font-mono font-black text-sm {{ $isSpecial ? 'text-amber-300' : 'text-emerald-400' }}">
                                <span class="text-base font-black">₹{{ number_format($s->net_payout, 2) }}</span>
                            </td>

                            <!-- Installment Per Member -->
                            <td class="py-4 px-4 text-right font-mono font-black text-white text-sm">
                                <span>₹{{ number_format($s->installment_per_member, 2) }}</span>
                                <span class="block text-[10px] text-slate-400 font-sans font-normal">/ member</span>
                            </td>

                            <!-- Payment Collection Status -->
                            <td class="py-4 px-4 text-center">
                                @php
                                    $totalPayments = $s->payments->count();
                                    $paidPayments = $s->payments->where('payment_status', 'paid')->count();
                                    $pendingPayments = $s->payments->where('payment_status', 'pending');
                                    $pendingCount = $pendingPayments->count();
                                    $pendingMemberNames = $pendingPayments->map(fn($p) => $p->member ? $p->member->name : 'Unknown')->take(2)->implode(', ');
                                    if ($pendingCount > 2) {
                                        $pendingMemberNames .= ' +' . ($pendingCount - 2) . ' more';
                                    }
                                @endphp

                                @if($totalPayments === 0)
                                    <span class="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-slate-800/80 text-slate-400 border border-slate-700/50">
                                        No Members
                                    </span>
                                @elseif($pendingCount === 0)
                                    <a href="{{ route('payments.schedule', $s) }}" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm shadow-emerald-500/5" title="All {{ $paidPayments }} members have paid!">
                                        <i class="fa-solid fa-circle-check text-emerald-400"></i>
                                        <span>All Paid ({{ $paidPayments }}/{{ $paidPayments }})</span>
                                    </a>
                                @else
                                    <a href="{{ route('payments.schedule', $s) }}" class="inline-flex flex-col items-center px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all shadow-sm" title="Pending: {{ $pendingMemberNames }}">
                                        <div class="flex items-center space-x-1.5 text-xs font-bold text-rose-300">
                                            <i class="fa-solid fa-clock text-rose-400 text-[10px]"></i>
                                            <span>{{ $pendingCount }} Pending</span>
                                            <span class="text-[10px] text-slate-400 font-mono">({{ $paidPayments }}/{{ $totalPayments }})</span>
                                        </div>
                                        @if($pendingMemberNames)
                                            <span class="text-[9px] text-rose-400/90 font-medium truncate max-w-[130px] block mt-0.5">
                                                {{ $pendingMemberNames }}
                                            </span>
                                        @endif
                                    </a>
                                @endif
                            </td>

                            <!-- Winner Selection & Payout Status -->
                            <td class="py-4 px-4 min-w-[210px]">
                                @if($committee->status === 'completed')
                                    <div class="font-bold text-white text-xs py-1">
                                        {{ $s->winner ? $s->winner->name : 'No Winner' }}
                                    </div>
                                @else
                                    <form action="{{ route('schedules.updateWinner', $s) }}" method="POST" data-ajax="true" class="no-print flex items-center space-x-2">
                                        @csrf
                                        <select name="member_id" onchange="submitAjaxForm(this.form)" class="px-3 py-2 rounded-xl glass-input text-xs text-white focus:outline-none w-full cursor-pointer">
                                            <option value="">-- Assign Winner --</option>
                                            @forelse($members as $m)
                                                <option value="{{ $m->id }}" {{ $s->member_id == $m->id ? 'selected' : '' }}>
                                                    {{ $m->name }} {{ $m->phone ? "($m->phone)" : '' }}
                                                </option>
                                            @empty
                                                <option value="" disabled>No members in this committee</option>
                                            @endforelse
                                        </select>
                                    </form>
                                @endif

                                @if($s->winner)
                                    <div class="no-print mt-2 flex items-center justify-between gap-1.5 text-[10px]">
                                        @if($s->payout_status === 'paid')
                                            <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold shadow-sm" title="Disbursed Mode: {{ strtoupper($s->payout_mode ?? 'CASH') }}">
                                                <i class="fa-solid fa-circle-check text-emerald-400"></i>
                                                <span>PAID ({{ strtoupper($s->payout_mode ?? 'CASH') }})</span>
                                            </span>
                                        @else
                                            <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold shadow-sm">
                                                <i class="fa-solid fa-clock text-rose-400"></i>
                                                <span>UNPAID</span>
                                            </span>
                                        @endif

                                        @if($committee->status !== 'completed')
                                            <button type="button"
                                                    data-schedule-id="{{ $s->id }}"
                                                    data-month-no="{{ $s->month_no }}"
                                                    data-net-payout="{{ $s->net_payout }}"
                                                    data-winner-name="{{ $s->winner->name }}"
                                                    data-payout-status="{{ $s->payout_status }}"
                                                    data-payout-date="{{ $s->payout_date ? $s->payout_date->format('Y-m-d') : date('Y-m-d') }}"
                                                    data-payout-mode="{{ $s->payout_mode ?? 'cash' }}"
                                                    data-upi-amount="{{ $s->payout_upi_amount ?? 0 }}"
                                                    data-upi-ref="{{ $s->payout_upi_ref ?? '' }}"
                                                    data-cash-amount="{{ $s->payout_cash_amount ?? 0 }}"
                                                    data-cash-notes="{{ json_encode($s->payout_cash_notes ?? []) }}"
                                                    data-remarks="{{ $s->payout_remarks ?? '' }}"
                                                    onclick="openPayoutModalFromBtn(this)"
                                                    class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-slate-600 transition-all font-bold flex items-center gap-1.5 shadow-sm">
                                                <i class="fa-solid fa-hand-holding-dollar text-[10px]"></i>
                                                <span>{{ $s->payout_status === 'paid' ? 'Edit' : 'Disburse' }}</span>
                                            </button>
                                        @endif
                                    </div>
                                @endif

                                @if($members->isEmpty())
                                    <button type="button" onclick="document.getElementById('memberModal').classList.remove('hidden')" class="no-print text-[10px] text-amber-400 hover:underline mt-1 font-semibold flex items-center gap-1">
                                        <i class="fa-solid fa-user-plus"></i> Attach Members First
                                    </button>
                                @endif
                                <div class="print-only text-xs font-semibold">
                                    {{ $s->winner ? $s->winner->name : 'Pending Draw' }}
                                    @if($s->winner && $s->payout_status === 'paid')
                                        <span class="block text-[10px] text-emerald-600">[Disbursed via {{ strtoupper($s->payout_mode) }}]</span>
                                    @endif
                                </div>
                            </td>

                            <!-- Row Action Buttons -->
                            <td class="py-4 px-4 no-print text-center min-w-[220px]">
                                @if($committee->status === 'completed')
                                    <span class="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 inline-flex items-center justify-center gap-1.5 shadow-sm">
                                        <i class="fa-solid fa-lock text-emerald-400 text-[10px]"></i> Closed
                                    </span>
                                @else
                                    <div class="flex items-center justify-center space-x-2 flex-wrap gap-y-2">

                                    @if($s->is_custom_bid)
                                        {{-- ROUND IS LOCKED — check if payout is already paid --}}
                                        @if($s->payout_status === 'paid')
                                            {{-- PAID: Permanently closed — no Re-open option --}}
                                            <div class="flex flex-col items-center gap-1">
                                                <span class="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-emerald-500/10">
                                                    <i class="fa-solid fa-circle-check text-emerald-400 text-[10px]"></i> Paid &amp; Closed
                                                </span>
                                                <span class="text-[9px] text-slate-500 text-center leading-tight">
                                                    Winner payout done.<br>Cannot re-open.
                                                </span>
                                            </div>
                                        @else
                                            {{-- LOCKED but not paid: Admin can Edit Bid (Reset forbidden once locked/paid) --}}
                                            <div class="flex flex-col items-center gap-1.5">
                                                <span class="px-3 py-1 rounded-xl text-[10px] font-extrabold bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-amber-500/5">
                                                    <i class="fa-solid fa-lock text-amber-400 text-[10px]"></i> Bidding Locked
                                                </span>
                                                <div class="flex items-center gap-1.5 flex-wrap justify-center">
                                                    <button type="button"
                                                            data-schedule-id="{{ $s->id }}"
                                                            data-month-no="{{ $s->month_no }}"
                                                            data-pool-v="{{ $committee->total_amount }}"
                                                            data-members-m="{{ $committee->total_members }}"
                                                            data-deduction="{{ $s->deduction_amount }}"
                                                            data-net-payout="{{ $s->net_payout }}"
                                                            data-kist="{{ $s->installment_per_member }}"
                                                            data-is-custom="true"
                                                            data-formula-deduction="{{ $s->formula_deduction }}"
                                                            onclick="openAuctionBidModalFromBtn(this)"
                                                            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-500/60 transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-amber-500/5">
                                                        <i class="fa-solid fa-pen-to-square text-amber-400"></i> Edit Bid
                                                    </button>
                                                </div>
                                                <span class="text-[10px] font-mono text-amber-400/80 font-medium">
                                                    Locked: ₹{{ number_format($s->deduction_amount, 2) }}
                                                </span>
                                            </div>
                                        @endif
                                    @else
                                        {{-- ROUND IS OPEN — show Bid/Edit & Lock Default button --}}
                                        <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span> Bidding Open
                                        </span>

                                        <!-- Lock at Formula Default (No Custom Bid) -->
                                        <form method="POST" action="{{ route('schedules.lockDefault', $s) }}" data-ajax="true" class="inline">
                                            @csrf
                                            <button type="submit"
                                                title="Lock this round directly at default amount (₹{{ number_format($s->formula_deduction, 2) }}) without custom bid"
                                                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-500/60 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-cyan-500/10">
                                                <i class="fa-solid fa-lock text-cyan-400"></i> Lock Default (₹{{ number_format($s->formula_deduction, 0) }})
                                            </button>
                                        </form>

                                        <!-- Admin Set Custom Bid (Bid/Edit) -->
                                        <button type="button"
                                                data-schedule-id="{{ $s->id }}"
                                                data-month-no="{{ $s->month_no }}"
                                                data-pool-v="{{ $committee->total_amount }}"
                                                data-members-m="{{ $committee->total_members }}"
                                                data-deduction="{{ $s->deduction_amount }}"
                                                data-net-payout="{{ $s->net_payout }}"
                                                data-kist="{{ $s->installment_per_member }}"
                                                data-is-custom="{{ $s->is_custom_bid ? 'true' : 'false' }}"
                                                data-formula-deduction="{{ $s->formula_deduction }}"
                                                onclick="openAuctionBidModalFromBtn(this)"
                                                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-amber-500/10"
                                                title="Set Custom Auction Bid Deduction">
                                            <i class="fa-solid fa-gavel text-amber-400"></i> Bid / Edit
                                        </button>
                                    @endif

                                    <!-- Member Bids Indicator & Quick Approval -->
                                    @if($s->bids && $s->bids->count() > 0)
                                    @php
                                        $sortedBids   = $s->bids->sortByDesc('bid_amount');
                                        $highestBid   = $sortedBids->first();
                                        $totalBids    = $sortedBids->count();
                                    @endphp
                                        <div class="relative group/bid inline-block">
                                            <button type="button" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                                                <i class="fa-solid fa-hand-holding-hand text-purple-400"></i>
                                                <span>{{ $totalBids }} Bid{{ $totalBids > 1 ? 's' : '' }}</span>
                                                @if($highestBid)
                                                    <span class="ml-1 text-amber-400 font-mono">₹{{ number_format($highestBid->bid_amount, 0) }}</span>
                                                @endif
                                            </button>

                                            <!-- Dropdown Menu — Highest bid first -->
                                            <div class="hidden group-hover/bid:block absolute right-0 top-full mt-1 w-80 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 space-y-2 text-left">
                                                <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-b border-slate-800 pb-1.5">
                                                    <span class="text-purple-400">Member Bids — Highest First</span>
                                                    <span class="text-slate-500">{{ $totalBids }} total</span>
                                                </div>

                                                <div class="max-h-56 overflow-y-auto space-y-2">
                                                    @foreach($sortedBids as $mb)
                                                    @php $isTop = ($mb->id === $highestBid->id); @endphp
                                                        <div class="p-2.5 rounded-xl {{ $isTop ? 'bg-amber-500/10 border border-amber-500/40' : 'bg-slate-950/80 border border-slate-800' }} space-y-1.5">
                                                            <div class="flex items-center justify-between text-xs">
                                                                <div class="flex items-center space-x-1.5">
                                                                    @if($isTop)
                                                                        <div class="w-5 h-5 rounded bg-amber-500/30 border border-amber-500/50 flex items-center justify-center shrink-0" title="Highest Bid">
                                                                            <i class="fa-solid fa-arrow-up text-amber-400 text-[9px]"></i>
                                                                        </div>
                                                                    @else
                                                                        <div class="w-5 h-5 rounded bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center shrink-0 text-[9px] font-bold">
                                                                            {{ $loop->index + 1 }}
                                                                        </div>
                                                                    @endif
                                                                    <span class="font-bold {{ $isTop ? 'text-amber-200' : 'text-slate-400' }}">{{ $mb->member->name }}</span>
                                                                    @if($isTop)
                                                                        <span class="px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-400 font-extrabold uppercase">Highest</span>
                                                                    @endif
                                                                </div>
                                                                <span class="font-mono font-black {{ $isTop ? 'text-amber-300 text-sm' : 'text-slate-500 text-xs' }}">
                                                                    ₹{{ number_format($mb->bid_amount, 0) }}
                                                                </span>
                                                            </div>

                                                            {{-- Remarks & Approve only on highest bid --}}
                                                            @if($isTop)
                                                                @if($mb->remarks)
                                                                    <p class="text-[10px] text-slate-400 italic">"{{ $mb->remarks }}"</p>
                                                                @endif
                                                                @if(!$s->is_custom_bid)
                                                                <form method="POST" action="{{ route('schedules.bids.approve', $mb) }}" data-ajax="true" class="pt-0.5">
                                                                    @csrf
                                                                    <button type="submit" class="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider transition-colors">
                                                                        <i class="fa-solid fa-check mr-1"></i>Approve & Close Bidding
                                                                    </button>
                                                                </form>
                                                                @else
                                                                    @if($mb->status === 'approved')
                                                                        <span class="block text-center text-[10px] text-emerald-400 font-bold pt-0.5"><i class="fa-solid fa-lock mr-1"></i>Bid Approved</span>
                                                                    @endif
                                                                @endif
                                                            @endif
                                                        </div>
                                                    @endforeach
                                                </div>
                                            </div>
                                        </div>
                                    @endif

                                    <!-- Payments Link -->
                                    <a href="{{ route('payments.schedule', $s) }}" class="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                                        <i class="fa-solid fa-receipt text-emerald-400"></i> Payments
                                    </a>

                                    @php
                                        $msg = "Hello, committee installment for Month " . $s->month_no . " is ₹" . number_format($s->installment_per_member, 2) . ". Please pay by the due date. Thank you!";
                                        $waUrl = "https://wa.me/?text=" . urlencode($msg);
                                    @endphp
                                    <a href="{{ $waUrl }}" target="_blank" title="Share reminder on WhatsApp" class="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-xl text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm">
                                        <i class="fa-brands fa-whatsapp text-sm"></i>
                                    </a>
                                </div>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>

                <!-- Table Footer Grand Totals -->
                <tfoot class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-xs font-bold text-white border-t-2 border-slate-700/80 shadow-2xl">
                    <tr>
                        <td class="py-5 px-4 font-black uppercase text-amber-400 tracking-wider">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid fa-coins text-amber-400"></i>
                                <span>GRAND TOTALS</span>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-center font-mono text-slate-400 text-xs font-bold">
                            <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50">{{ $committee->total_members }} Draws</span>
                        </td>
                        <td class="py-5 px-4 text-right font-mono text-amber-300 text-sm font-black">
                            ₹{{ number_format($grandTotalDeductions, 2) }}
                        </td>
                        <td class="py-5 px-4 text-right font-mono text-emerald-400 text-lg font-black">
                            ₹{{ number_format($grandTotalNetPayout, 2) }}
                        </td>
                        <td class="py-5 px-4 text-right font-mono text-white text-base font-black">
                            <div>₹{{ number_format($grandTotalKistPerMember, 2) }}</div>
                            <div class="text-[10px] font-sans font-normal text-slate-400">Total member contribution</div>
                        </td>
                        <td class="py-5 px-4 text-slate-400 text-xs" colspan="3">
                            <span class="text-slate-400">Full committee pool cycle ({{ $committee->total_members }} months completed)</span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>

<!-- Manage Committee Members Modal -->
<div id="memberModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-lg p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-users text-emerald-400"></i>
                <span>Assign Members (<span id="assignMemberCount" class="text-emerald-400 font-extrabold">{{ $members->count() }}</span> / <span class="text-amber-400 font-extrabold">{{ $committee->total_members }}</span>)</span>
            </h3>
            <button onclick="document.getElementById('memberModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form action="{{ route('committees.updateMembers', $committee) }}" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            <div class="max-h-60 overflow-y-auto space-y-1.5 p-3 bg-slate-950/60 rounded-xl border border-slate-800" id="assignMemberContainer">
                @foreach($allMembers as $index => $m)
                    @php
                        $attached = $members->contains('id', $m->id);
                        $seatsCount = $attached ? $committee->getMemberSeatsCount($m->id) : 1;
                    @endphp
                    <div class="flex items-center justify-between text-xs text-slate-300 hover:text-white p-1.5 rounded hover:bg-slate-800/40">
                        <label class="flex items-center space-x-2.5 cursor-pointer select-none">
                            <span class="text-[10px] font-mono text-slate-500 w-5 text-right">{{ $index + 1 }}.</span>
                            <input type="checkbox" name="members[]" value="{{ $m->id }}"
                                   {{ $attached ? 'checked' : '' }}
                                   {{ $committee->status === 'completed' ? 'disabled' : '' }}
                                   class="assign-member-cb rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500">
                            <span class="font-medium text-white">{{ $m->name }}</span>
                            <span class="text-slate-400 text-[11px] font-mono">{{ $m->phone ? "($m->phone)" : '' }}</span>
                        </label>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[10px] text-slate-400 font-semibold uppercase">Seats:</span>
                            <input type="number" name="seats[{{ $m->id }}]" value="{{ $seatsCount }}" min="1" max="{{ $committee->total_members }}"
                                   data-member-id="{{ $m->id }}"
                                   {{ $committee->status === 'completed' ? 'disabled' : '' }}
                                   class="assign-member-seats w-14 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs focus:outline-none focus:border-amber-400">
                        </div>
                    </div>
                @endforeach
            </div>

            <div id="assignMemberWarning" class="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 hidden flex items-center gap-1.5">
                <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
                <span>Cannot select more than {{ $committee->total_members }} members for this {{ $committee->total_members }}-month committee!</span>
            </div>

            <div class="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('memberModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Close</button>
                @if($committee->status !== 'completed')
                    <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400">Save Members</button>
                @endif
            </div>
        </form>
    </div>
</div>

<!-- Auction Bid / Custom Deduction Modal -->
<div id="auctionBidModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2.5">
                <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                    <i class="fa-solid fa-gavel"></i>
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Custom Auction Bid / Deduction</h3>
                    <span id="bidModalMonthTitle" class="text-xs text-amber-400 font-semibold">Month 1</span>
                </div>
            </div>
            <button onclick="document.getElementById('auctionBidModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form id="auctionBidForm" action="" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs">
                <div class="flex justify-between text-slate-400">
                    <span>Total Pool Value (V):</span>
                    <span id="bidModalPoolValue" class="text-white font-bold">₹2,00,000</span>
                </div>
                <div class="flex justify-between text-slate-400">
                    <span>Formula Base Deduction:</span>
                    <span id="bidModalFormulaDeduction" class="text-slate-300 font-mono">₹60,000</span>
                </div>
            </div>

            <!-- Custom Deduction Amount Input -->
            <div class="space-y-1.5">
                <div class="flex items-center justify-between flex-wrap gap-1">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Custom Deduction Amount (₹)</label>
                    <div class="flex items-center gap-1.5">
                        <button type="button" onclick="setFormulaBid()" class="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all flex items-center gap-1 shadow-sm" title="Lock at standard formula default deduction">
                            <i class="fa-solid fa-calculator text-cyan-400"></i> Formula: <span id="btnFormulaAmt">₹0</span>
                        </button>
                    </div>
                </div>
                <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input type="number" name="custom_deduction_amount" id="bid_input_deduction" min="0" step="any"
                           placeholder="0"
                           class="w-full pl-8 pr-4 py-2.5 rounded-xl glass-input text-sm text-amber-300 font-extrabold focus:outline-none">
                </div>
                <span class="text-[11px] text-slate-400 block">Enter custom auction deduction amount. Net payout will update live.</span>
            </div>

            <!-- Live Calculation Preview inside Modal -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div class="flex justify-between items-center">
                    <span class="text-slate-400">Calculated Net Winner Payout:</span>
                    <span id="bidPreviewNetPayout" class="text-emerald-400 font-extrabold font-mono text-sm">₹1,40,000</span>
                </div>
                <div class="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span class="text-slate-400">Calculated Monthly Installment (Kist):</span>
                    <span id="bidPreviewKist" class="text-white font-extrabold font-mono text-sm">₹7,000 / member</span>
                </div>
            </div>

            <div class="flex items-center justify-end pt-3 border-t border-slate-800 space-x-2">
                <button type="button" onclick="document.getElementById('auctionBidModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">Save Auction Bid</button>
            </div>
        </form>
    </div>
</div>

@include('partials.payout-modal')

<!-- Committee Start Date Modal -->
<div id="committeeDateModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2.5">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-base">
                    <i class="fa-solid fa-calendar-days"></i>
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Change Committee Start Date</h3>
                    <span class="text-xs text-slate-400">Update committee start date and maturity schedule</span>
                </div>
            </div>
            <button type="button" onclick="document.getElementById('committeeDateModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form action="{{ route('committees.updateDate', $committee) }}" method="POST" data-ajax="true" class="space-y-4">
            @csrf
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Committee Start Date
                </label>
                <input type="date" name="start_date" id="modal_start_date"
                       value="{{ $committee->start_date ? $committee->start_date->format('Y-m-d') : date('Y-m-d') }}"
                       required
                       class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                <span class="text-[11px] text-slate-400 block">
                    Total duration: <strong class="text-amber-300">{{ $committee->total_members }} Months</strong>. Changing start date will automatically recalculate all month draw dates!
                </span>
            </div>

            <!-- Dynamic Estimated Preview -->
            <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div class="flex justify-between items-center text-slate-300">
                    <span class="flex items-center gap-1.5">
                        <i class="fa-solid fa-calendar-plus text-cyan-400"></i> Month 1 (First Installment):
                    </span>
                    <span id="previewFirstKisht" class="font-mono font-bold text-cyan-300">
                        {{ $committee->start_date ? $committee->start_date->format('d M Y') : '-' }}
                    </span>
                </div>
                <div class="flex justify-between items-center text-slate-300 pt-2 border-t border-slate-800/80">
                    <span class="flex items-center gap-1.5">
                        <i class="fa-solid fa-calendar-check text-emerald-400"></i> Month {{ $committee->total_members }} (End Date):
                    </span>
                    <span id="previewLastKisht" class="font-mono font-bold text-emerald-400">
                        {{ $committee->end_date ? $committee->end_date->format('d M Y') : '-' }}
                    </span>
                </div>
            </div>

            <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('committeeDateModal').classList.add('hidden')" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                    <i class="fa-solid fa-check"></i>
                    <span>Save & Recalculate Dates</span>
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Individual Schedule Draw Date Modal -->
<div id="scheduleDateModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-sm p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm">
                    <i class="fa-solid fa-calendar-day"></i>
                </div>
                <div>
                    <h3 class="text-sm font-bold text-white" id="scheduleDateModalTitle">Edit Month Draw Date</h3>
                    <span class="text-[11px] text-slate-400">Update installment draw date</span>
                </div>
            </div>
            <button type="button" onclick="document.getElementById('scheduleDateModal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <form id="scheduleDateForm" action="" method="POST" class="space-y-4">
            @csrf
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Draw Date</label>
                <input type="date" name="draw_date" id="schedule_modal_draw_date" required
                       class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
            </div>

            <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onclick="document.getElementById('scheduleDateModal').classList.add('hidden')" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20">Update Date</button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    let currentPoolV = 200000;
    let currentMembersM = 20;
    let currentFormulaDeduction = 0;

    function openAuctionBidModalFromBtn(btn) {
        const ds = btn.dataset;
        openAuctionBidModal(
            ds.scheduleId,
            ds.monthNo,
            parseFloat(ds.poolV),
            parseInt(ds.membersM),
            parseFloat(ds.deduction),
            parseFloat(ds.netPayout),
            parseFloat(ds.kist),
            ds.isCustom === 'true',
            parseFloat(ds.formulaDeduction)
        );
    }

    function openAuctionBidModal(scheduleId, monthNo, poolV, membersM, currentDeduction, currentNetPayout, currentKist, isCustom, formulaDeduction) {
        currentPoolV = poolV;
        currentMembersM = membersM;
        currentFormulaDeduction = formulaDeduction;

        const form = document.getElementById('auctionBidForm');
        form.action = `/schedules/${scheduleId}/bid`;

        document.getElementById('bidModalMonthTitle').innerText = `Month ${monthNo} Auction Bid`;
        document.getElementById('bidModalPoolValue').innerText = '₹' + new Intl.NumberFormat('en-IN').format(poolV);
        document.getElementById('bidModalFormulaDeduction').innerText = '₹' + new Intl.NumberFormat('en-IN').format(formulaDeduction);

        const btnFormulaAmt = document.getElementById('btnFormulaAmt');
        if (btnFormulaAmt) {
            btnFormulaAmt.innerText = '₹' + new Intl.NumberFormat('en-IN').format(formulaDeduction);
        }

        const deductionInput = document.getElementById('bid_input_deduction');
        deductionInput.value = currentDeduction;

        updateBidModalPreview();

        document.getElementById('auctionBidModal').classList.remove('hidden');
    }

    function setFormulaBid() {
        const input = document.getElementById('bid_input_deduction');
        if (input) {
            input.value = currentFormulaDeduction;
            updateBidModalPreview();
        }
    }

    function updateBidModalPreview() {
        const rawVal = document.getElementById('bid_input_deduction').value;
        const deduction = rawVal === '' ? 0 : (parseFloat(rawVal) || 0);
        const netPayout = Math.max(0, currentPoolV - deduction);
        const kist = netPayout / currentMembersM;

        document.getElementById('bidPreviewNetPayout').innerText = '₹' + new Intl.NumberFormat('en-IN', {minimumFractionDigits: 2}).format(netPayout);
        document.getElementById('bidPreviewKist').innerText = '₹' + new Intl.NumberFormat('en-IN', {minimumFractionDigits: 2}).format(kist) + ' / member';
    }

    document.getElementById('bid_input_deduction')?.addEventListener('input', updateBidModalPreview);

    // Member Assignment Modal limit & seats enforcement
    const maxCommitteeMembers = {{ $committee->total_members }};
    function recalculateTotalSeats() {
        let totalSeats = 0;
        document.querySelectorAll('.assign-member-cb:checked').forEach(cb => {
            const memberId = cb.value;
            const seatInput = document.querySelector(`.assign-member-seats[data-member-id="${memberId}"]`);
            const seats = seatInput ? (parseInt(seatInput.value) || 1) : 1;
            totalSeats += seats;
        });

        const countEl = document.getElementById('assignMemberCount');
        const warningEl = document.getElementById('assignMemberWarning');

        if (totalSeats > maxCommitteeMembers) {
            if (warningEl) warningEl.classList.remove('hidden');
        } else {
            if (warningEl) warningEl.classList.add('hidden');
        }

        if (countEl) countEl.innerText = totalSeats;
        return totalSeats;
    }

    document.querySelectorAll('.assign-member-cb, .assign-member-seats').forEach(el => {
        el.addEventListener('change', recalculateTotalSeats);
        el.addEventListener('input', recalculateTotalSeats);
    });
    recalculateTotalSeats();

    // Schedule Date Modal
    function openScheduleDateModal(scheduleId, monthNo, currentDate) {
        const form = document.getElementById('scheduleDateForm');
        form.action = `/schedules/${scheduleId}/date`;
        document.getElementById('scheduleDateModalTitle').innerText = `Month ${monthNo} Draw Date`;
        document.getElementById('schedule_modal_draw_date').value = currentDate;
        document.getElementById('scheduleDateModal').classList.remove('hidden');
    }

    // Dynamic End Date Preview in Committee Date Modal
    const modalStartDateInput = document.getElementById('modal_start_date');
    if (modalStartDateInput) {
        modalStartDateInput.addEventListener('change', function() {
            const val = this.value;
            if (!val) return;
            const totalMonths = {{ $committee->total_members }};
            const parts = val.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);

                const startDate = new Date(year, month, day);
                const options = { day: '2-digit', month: 'short', year: 'numeric' };
                document.getElementById('previewFirstKisht').innerText = startDate.toLocaleDateString('en-GB', options);

                const endDate = new Date(year, month + (totalMonths - 1), day);
                document.getElementById('previewLastKisht').innerText = endDate.toLocaleDateString('en-GB', options);
            }
        });
    }
</script>
@endsection
