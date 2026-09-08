@extends('layouts.app')

@section('title', 'Committee View - ' . $committee->name)

@section('content')
<div class="space-y-5 sm:space-y-8" id="committeePortalRoot">

    <!-- Back Navigation & Live Status Bar -->
    <div class="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md">
        <a href="{{ route('member.dashboard') }}" class="inline-flex items-center text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800/60">
            <i class="fa-solid fa-arrow-left mr-2 text-emerald-400"></i>
            <span>All Committees</span>
        </a>
        <!-- Real-time status indicator -->
        <div id="liveStatusBadge" class="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            <span id="liveStatusText">Live Updates</span>
        </div>
    </div>

    <!-- Header Card -->
    <div class="glass-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden">
        <div class="absolute -top-12 -right-12 w-52 h-52 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-6">
            <div class="space-y-1.5 sm:space-y-2 z-10 w-full md:w-auto">
                <div class="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
                    <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">{{ $committee->name }}</h1>
                    <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {{ $committee->total_members }} Members
                    </span>
                </div>
                <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Live auction bidding board. Submit your bid — all members see bids in real-time. Once organizer approves a bid, that round is locked.
                </p>
            </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800 z-10 relative">
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Total Chit Value</span>
                <span class="text-base sm:text-lg font-black text-white font-mono truncate block">₹{{ number_format($committee->total_amount, 0) }}</span>
            </div>
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Monthly Base Rate</span>
                <span class="text-base sm:text-lg font-black text-amber-400 font-mono block">{{ $committee->monthly_rate ?? $committee->deduction_rate }}%</span>
            </div>
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">Zero Round</span>
                <span class="text-base sm:text-lg font-black text-teal-400 font-mono truncate block">Month {{ $committee->zero_deduction_month ?? ($committee->total_members - $committee->special_month_index + 1) }}</span>
            </div>
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">My Profile / Seats</span>
                <span class="text-xs sm:text-sm font-bold text-emerald-300 truncate block">{{ $member->name }}</span>
                @if($totalSeats > 1)
                    <span class="text-[9px] sm:text-[10px] text-purple-300 font-extrabold uppercase block mt-0.5 truncate">
                        <i class="fa-solid fa-users-rectangle mr-1"></i>{{ $totalSeats }} Seats
                    </span>
                @endif
            </div>
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1 truncate">
                    <i class="fa-solid fa-calendar-plus text-[10px]"></i> Start Date
                </span>
                <span class="text-xs sm:text-sm font-bold text-white block mt-0.5 truncate">{{ $committee->start_date ? $committee->start_date->format('d M Y') : 'N/A' }}</span>
            </div>
            <div class="bg-slate-900/80 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-800">
                <span class="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 truncate">
                    <i class="fa-solid fa-calendar-check text-[10px]"></i> End Date
                </span>
                <span class="text-xs sm:text-sm font-bold text-emerald-300 block mt-0.5 truncate">{{ $committee->end_date ? $committee->end_date->format('d M Y') : 'N/A' }}</span>
            </div>
        </div>
    </div>

    <!-- Multi-Seat Holder Status Banner -->
    @if($totalSeats > 1)
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div class="flex items-start sm:items-center space-x-3.5">
            <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-lg sm:text-xl shrink-0">
                <i class="fa-solid fa-users-rectangle"></i>
            </div>
            <div>
                <h3 class="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                    <span>Multi-Seat Account: <strong class="text-purple-300 font-mono">{{ $totalSeats }} Registered Seats / Entries</strong></span>
                </h3>
                <p class="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                    You have won <strong class="text-amber-300 font-mono">{{ $wonCount }} of {{ $totalSeats }}</strong> payouts so far.
                    @if($remainingSeats > 0)
                        You still have <strong class="text-emerald-400 font-mono">{{ $remainingSeats }} seat(s)</strong> eligible to place live auction bids!
                    @else
                        All of your registered {{ $totalSeats }} seats have won payouts for this committee.
                    @endif
                </p>
            </div>
        </div>
        <div class="shrink-0 w-full sm:w-auto">
            @if($remainingSeats > 0)
                <span class="w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{{ $remainingSeats }} Bid(s) Available</span>
                </span>
            @else
                <span class="w-full sm:w-auto justify-center px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-trophy text-amber-400"></i>
                    <span>All {{ $totalSeats }} Seats Won</span>
                </span>
            @endif
        </div>
    </div>
    @endif

    <!-- Already Won Banner (only when payout is fully won for all seats) -->
    @if($alreadyWon)
    <div class="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3.5 sm:space-x-4 shadow-lg">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
            <i class="fa-solid fa-trophy"></i>
        </div>
        <div>
            <h3 class="text-sm sm:text-base font-extrabold text-amber-300">All Registered Payouts Won</h3>
            <p class="text-xs text-amber-400/80 mt-1 leading-relaxed">
                You have won committee payouts for all {{ $totalSeats }} of your registered seats/entries. You can still <strong class="text-amber-300">view all bids and the live board</strong>, but you cannot place new bids.
            </p>
        </div>
    </div>
    @endif

    @if($committee->status === 'completed')
    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 flex items-start sm:items-center space-x-3.5 sm:space-x-4 shadow-xl">
        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xl sm:text-2xl shrink-0">
            <i class="fa-solid fa-lock"></i>
        </div>
        <div>
            <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>COMMITTEE COMPLETED &amp; CLOSED</span>
                <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/30 text-emerald-200 uppercase font-black tracking-wider">Read Only</span>
            </h3>
            <p class="text-xs text-slate-300 mt-1 leading-relaxed">
                This committee has completed all its rounds. You can view all schedule entries, payouts, and past bids in read-only mode.
            </p>
        </div>
    </div>
    @endif

    <!-- Live Auction Board — Per-Round Cards -->
    <div class="space-y-3 sm:space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                <i class="fa-solid fa-gavel text-amber-400"></i>
                <span>Live Auction Bidding Board</span>
            </h2>
            <span class="text-xs text-slate-400">
                <i class="fa-solid fa-clock-rotate-left mr-1 text-emerald-400"></i>
                <span id="lastUpdatedTime">Just loaded</span>
            </span>
        </div>

        <!-- Schedule Rounds as Expandable Cards -->
        <div id="auctionBoardContainer" class="space-y-3">
            @foreach($schedules as $schedule)
            @php
                $payment    = $myPayments->get($schedule->id);
                $myBid      = $myBids->get($schedule->id);
                $roundBids  = $allBidsBySchedule->get($schedule->id, collect());
                $isLocked   = (bool) $schedule->is_custom_bid;
                $iAmWinner  = $schedule->member_id == $member->id;

                $effectiveDrawDate = $schedule->draw_date ?? ($committee->start_date ? \Illuminate\Support\Carbon::parse($committee->start_date)->addMonths($schedule->month_no - 1) : null);
                $today = now()->startOfDay();
                $drawDate = $effectiveDrawDate ? \Illuminate\Support\Carbon::parse($effectiveDrawDate)->startOfDay() : null;

                $isBeforeDraw = $drawDate ? $today->lt($drawDate) : false;
                $isTodayDraw  = $drawDate ? $today->eq($drawDate) : true;
                $isAfterDraw  = $drawDate ? $today->gt($drawDate) : false;
            @endphp

            <div class="glass-card rounded-2xl border {{ $isLocked ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800' }} overflow-hidden transition-all shadow-md"
                 id="schedule-card-{{ $schedule->id }}"
                 data-schedule-id="{{ $schedule->id }}"
                 data-is-locked="{{ $isLocked ? 'true' : 'false' }}"
                 data-date-status="{{ $isBeforeDraw ? 'before' : ($isAfterDraw ? 'after' : 'today') }}">

                <!-- Round Header Row (always visible, tap anywhere to toggle) -->
                <div class="p-3.5 sm:p-4 cursor-pointer select-none"
                     onclick="toggleRoundCard({{ $schedule->id }})">

                    <!-- Top Row: Month Badge, Title, Status & Chevron -->
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
                            <!-- Month Badge -->
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl {{ $isLocked ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300' }} border font-black font-mono text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm">
                                {{ $schedule->month_no }}
                            </div>

                            <div class="min-w-0">
                                <div class="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1">
                                    <span class="text-sm font-bold text-white">Month {{ $schedule->month_no }}</span>
                                    @if($isLocked)
                                        <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1">
                                            <i class="fa-solid fa-lock text-[8px]"></i>
                                            <span>Approved &amp; Locked</span>
                                        </span>
                                    @elseif($isBeforeDraw)
                                        <span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                                            <i class="fa-solid fa-clock text-[8px] text-blue-400"></i>
                                            <span>Opens {{ $drawDate ? $drawDate->format('d/m/Y') : 'Soon' }}</span>
                                        </span>
                                    @elseif($isTodayDraw)
                                        <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                                            <span>Bidding Open Today!</span>
                                        </span>
                                    @elseif($isAfterDraw)
                                        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                                            <i class="fa-solid fa-calendar-xmark text-[8px]"></i>
                                            <span>Closed</span>
                                        </span>
                                    @endif

                                    @if($iAmWinner)
                                        <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-extrabold uppercase">
                                            <i class="fa-solid fa-trophy mr-1 text-[8px]"></i>Your Round
                                        </span>
                                    @endif
                                </div>
                            </div>
                        </div>

                        <!-- Toggle Chevron Button -->
                        <div class="p-1 text-slate-400 hover:text-white transition-colors shrink-0">
                            <i class="fa-solid fa-chevron-down text-xs transition-transform duration-200" id="chevron-{{ $schedule->id }}"></i>
                        </div>
                    </div>

                    <!-- Middle Row: 2-column on mobile, 4-inline on desktop -->
                    <div class="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-4 mt-2.5 text-[11px] text-slate-400">
                        <div class="bg-slate-900/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-800/80 flex items-center justify-between sm:justify-start sm:gap-1.5">
                            <span class="text-slate-500">Draw:</span>
                            <strong class="text-white font-mono">{{ $drawDate ? $drawDate->format('d/m/Y') : 'N/A' }}</strong>
                        </div>
                        <div class="bg-slate-900/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-800/80 flex items-center justify-between sm:justify-start sm:gap-1.5">
                            <span class="text-slate-500">Net Payout:</span>
                            <strong class="text-emerald-300 font-mono">₹{{ number_format($schedule->net_payout, 0) }}</strong>
                        </div>
                        <div class="bg-slate-900/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-800/80 flex items-center justify-between sm:justify-start sm:gap-1.5">
                            <span class="text-slate-500">Installment:</span>
                            <strong class="text-white font-mono">₹{{ number_format($schedule->installment_per_member, 0) }}</strong>
                        </div>
                        <div class="bg-slate-900/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-800/80 flex items-center justify-between sm:justify-start sm:gap-1.5">
                            <span class="text-slate-500">Total Bids:</span>
                            <strong class="text-amber-400 font-mono bid-count-{{ $schedule->id }}">{{ $roundBids->count() }}</strong>
                        </div>
                    </div>

                    <!-- Live Top Boli Bar (Always visible on card header) -->
                    @php
                        $topBid = $roundBids->sortByDesc('bid_amount')->first();
                    @endphp
                    <div class="mt-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 transition-all" id="topbid-pill-{{ $schedule->id }}">
                        <div class="flex items-center gap-2">
                            <span class="relative flex h-2.5 w-2.5">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 {{ $topBid ? '' : 'hidden' }}" id="topbid-ping-{{ $schedule->id }}"></span>
                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 {{ $topBid ? 'bg-amber-400' : 'bg-slate-600' }}" id="topbid-dot-{{ $schedule->id }}"></span>
                            </span>
                            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-300">Current Highest Boli:</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="font-mono font-black text-xs sm:text-sm text-amber-300" id="topbid-amount-{{ $schedule->id }}">
                                {{ $topBid ? '₹' . number_format($topBid->bid_amount, 0) : 'No Bids Yet' }}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium" id="topbid-name-{{ $schedule->id }}">
                                {{ $topBid ? '(by ' . ($topBid->member_id == $member->id ? 'You' : ($topBid->member->name ?? 'Member')) . ')' : '' }}
                            </span>
                        </div>
                    </div>

                    <!-- Bottom Action Row: Full width touch button on mobile, clean inline on desktop -->
                    <div class="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div class="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-info text-slate-600"></i>
                            <span>Tap card to view stats &amp; live bids</span>
                        </div>

                        <div class="w-full sm:w-auto">
                            @php
                                $roundIsLocked = (bool)$schedule->is_custom_bid;
                                $iAmThisRoundWinner = ($schedule->member_id == $member->id);
                            @endphp

                            @if($committee->status === 'completed')
                                <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                                    <i class="fa-solid fa-lock text-emerald-400"></i>
                                    <span>Committee Closed</span>
                                </span>
                            @elseif($alreadyWon)
                                @if($iAmThisRoundWinner)
                                    <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                                        <i class="fa-solid fa-trophy text-amber-400"></i>
                                        <span>Your Won Round</span>
                                    </span>
                                @else
                                    <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 text-xs font-semibold text-center">
                                        <i class="fa-solid fa-lock text-slate-500"></i>
                                        <span>Payout Received</span>
                                    </span>
                                @endif
                            @elseif($roundIsLocked)
                                @if($iAmThisRoundWinner)
                                    <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                                        <i class="fa-solid fa-trophy text-amber-400"></i>
                                        <span>Your Bid Won!</span>
                                    </span>
                                @else
                                    <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                                        <i class="fa-solid fa-lock text-rose-400"></i>
                                        <span>Bidding Closed by Organizer</span>
                                    </span>
                                @endif
                            @elseif($isBeforeDraw)
                                <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold text-center cursor-not-allowed"
                                      title="Bidding will open on {{ $drawDate ? $drawDate->format('d/m/Y') : '' }}">
                                    <i class="fa-solid fa-clock text-blue-400"></i>
                                    <span>Opens {{ $drawDate ? $drawDate->format('d/m/Y') : '' }}</span>
                                </span>
                            @elseif($isAfterDraw)
                                <span class="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold text-center cursor-not-allowed"
                                      title="Bidding closed on {{ $drawDate ? $drawDate->format('d/m/Y') : '' }}">
                                    <i class="fa-solid fa-calendar-xmark text-slate-500"></i>
                                    <span>Closed {{ $drawDate ? $drawDate->format('d/m/Y') : '' }}</span>
                                </span>
                            @else
                                {{-- TODAY IS DRAW DATE: Bidding enabled! --}}
                                @php
                                    $roundTopBid = $roundBids->sortByDesc('bid_amount')->first();
                                    $topBidAmt = $roundTopBid ? (float)$roundTopBid->bid_amount : 0;
                                    $myBidAmt = $myBids->has($schedule->id) ? (float)$myBids->get($schedule->id)->bid_amount : 0;
                                    $baseDeduct = (float)$schedule->deduction_amount;
                                @endphp
                                @if($myBids->has($schedule->id))
                                    <button type="button"
                                        id="bid-btn-{{ $schedule->id }}"
                                        onclick="event.stopPropagation(); openBidModal({{ $schedule->id }}, {{ $schedule->month_no }}, {{ $committee->total_amount }}, {{ $topBidAmt }}, {{ $baseDeduct }}, {{ $myBidAmt }}, '{{ addslashes($myBids->get($schedule->id)->remarks ?? '') }}')"
                                        class="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all text-center flex items-center justify-center">
                                        <i class="fa-solid fa-arrow-trend-up mr-1.5"></i> Raise Bid (My: ₹{{ number_format($myBidAmt, 0) }})
                                    </button>
                                @else
                                    <button type="button"
                                        id="bid-btn-{{ $schedule->id }}"
                                        onclick="event.stopPropagation(); openBidModal({{ $schedule->id }}, {{ $schedule->month_no }}, {{ $committee->total_amount }}, {{ $topBidAmt }}, {{ $baseDeduct }}, 0, '')"
                                        class="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 text-center flex items-center justify-center">
                                        <i class="fa-solid fa-gavel mr-1.5"></i> Place Bid
                                    </button>
                                @endif
                            @endif
                        </div>
                    </div>
                </div>

                <!-- Expandable Bids Section -->
                <div class="hidden border-t border-slate-800/80 p-3.5 sm:p-4 space-y-3" id="round-body-{{ $schedule->id }}">

                    <!-- Schedule Stats Row -->
                    <div class="grid grid-cols-3 gap-2 sm:gap-3">
                        <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                            <span class="block text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase truncate">Deduction</span>
                            <span class="block font-mono font-bold text-rose-300 text-xs sm:text-sm truncate">₹{{ number_format($schedule->deduction_amount, 0) }}</span>
                            @if($schedule->is_custom_bid)
                                <span class="text-[8px] sm:text-[9px] text-amber-400 truncate block"><i class="fa-solid fa-gavel mr-0.5"></i>Custom Auction</span>
                            @endif
                        </div>
                        <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                            <span class="block text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase truncate">Net Payout</span>
                            <span class="block font-mono font-bold text-emerald-400 text-xs sm:text-sm truncate">₹{{ number_format($schedule->net_payout, 0) }}</span>
                        </div>
                        <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                            <span class="block text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase truncate">My Payment</span>
                            @php
                                $memberPayments = $myPayments->get($schedule->id, collect());
                                $paidMemberCount = $memberPayments->where('payment_status', 'paid')->count();
                                $totalMemberSeatsCount = max(1, $totalSeats);
                            @endphp
                            @if($paidMemberCount === $totalMemberSeatsCount)
                                <span class="block text-[11px] sm:text-xs font-bold text-emerald-300 truncate"><i class="fa-solid fa-check mr-0.5"></i>Paid {{ $totalMemberSeatsCount > 1 ? "({$paidMemberCount}/{$totalMemberSeatsCount})" : '' }}</span>
                            @elseif($paidMemberCount > 0)
                                <span class="block text-[11px] sm:text-xs font-bold text-amber-300 truncate"><i class="fa-solid fa-clock mr-0.5"></i>Partial ({{ $paidMemberCount }}/{{ $totalMemberSeatsCount }})</span>
                            @else
                                <span class="block text-[11px] sm:text-xs font-bold text-rose-400 truncate"><i class="fa-solid fa-clock mr-0.5"></i>Pending {{ $totalMemberSeatsCount > 1 ? "(0/{$totalMemberSeatsCount})" : '' }}</span>
                            @endif
                        </div>
                    </div>

                    <!-- Live Bids List -->
                    <div>
                        <div class="flex items-center justify-between mb-2 flex-wrap gap-1">
                            <span class="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                All Member Bids (<span class="text-amber-400 bid-count-{{ $schedule->id }}">{{ $roundBids->count() }}</span>)
                            </span>
                            @if($schedule->winner)
                                <div class="flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-400">
                                    <i class="fa-solid fa-trophy text-amber-400 text-xs"></i>
                                    <span>Winner: {{ $schedule->winner->name }}</span>
                                </div>
                            @endif
                        </div>

                        <!-- Bids table — updated via JS polling -->
                        <div class="bid-list-{{ $schedule->id }} space-y-1.5">
                            @if($roundBids->isEmpty())
                                <div class="text-center py-4 text-slate-500 text-xs italic" id="no-bids-{{ $schedule->id }}">
                                    No bids placed yet for this round. Be the first!
                                </div>
                            @else
                                @foreach($roundBids->sortByDesc('bid_amount') as $idx => $bid)
                                <div class="flex items-center justify-between p-2.5 rounded-lg {{ $bid->member_id == $member->id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-900/60 border border-slate-800' }}">
                                    <div class="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                                        @if($idx === 0)
                                            <div class="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0" title="Highest Bid">
                                                <i class="fa-solid fa-crown"></i>
                                            </div>
                                        @else
                                            <div class="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                {{ $idx + 1 }}
                                            </div>
                                        @endif
                                        <div class="min-w-0">
                                            <span class="block text-xs font-bold truncate {{ $bid->member_id == $member->id ? 'text-emerald-300' : 'text-white' }}">
                                                {{ $bid->member->name ?? 'Unknown' }}
                                                @if($bid->member_id == $member->id)
                                                    <span class="text-[10px] text-emerald-400 font-normal">(You)</span>
                                                @endif
                                            </span>
                                            @if($bid->remarks)
                                                <span class="block text-[10px] text-slate-400 italic truncate">"{{ $bid->remarks }}"</span>
                                            @endif
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <span class="block font-mono font-black text-sm {{ $bid->member_id == $member->id ? 'text-emerald-400' : 'text-amber-300' }}">
                                            ₹{{ number_format($bid->bid_amount, 0) }}
                                        </span>
                                        @if($bid->status === 'approved')
                                            <span class="text-[9px] sm:text-[10px] text-emerald-400 font-bold"><i class="fa-solid fa-check-circle mr-0.5"></i>Approved</span>
                                        @else
                                            <span class="text-[9px] sm:text-[10px] text-slate-500">Pending</span>
                                        @endif
                                    </div>
                                </div>
                                @endforeach
                            @endif
                        </div>
                    </div>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</div>

<!-- Submit / Edit Auction Bid Modal -->
<div id="bidModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <div class="glass-card w-full max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-4 sm:space-y-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-base sm:text-lg shrink-0">
                    <i class="fa-solid fa-gavel"></i>
                </div>
                <div>
                    <h3 class="text-sm sm:text-base font-bold text-white" id="bidModalTitle">Place Your Auction Bid</h3>
                    <p class="text-[11px] sm:text-xs text-slate-400" id="bidModalSubtitle">Month 1 Round</p>
                </div>
            </div>
            <button type="button" onclick="closeBidModal()" class="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                <i class="fa-solid fa-xmark text-sm"></i>
            </button>
        </div>

        <!-- Live Auction Rules Card -->
        <div id="auctionRulesCard" class="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
            <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400 font-semibold flex items-center gap-1.5">
                    <i class="fa-solid fa-crown text-amber-400"></i> Current Highest Bid:
                </span>
                <span id="currentTopBidDisplay" class="font-mono font-black text-amber-300 text-sm">No Bids Yet</span>
            </div>
            <div class="flex items-center justify-between text-xs pt-1.5 border-t border-slate-800">
                <span class="text-emerald-400 font-bold flex items-center gap-1.5">
                    <i class="fa-solid fa-arrow-trend-up"></i> Min Next Allowed Bid:
                </span>
                <span id="currentMinRequiredDisplay" class="font-mono font-black text-emerald-300 text-sm">₹0</span>
            </div>
            <div id="myPreviousBidRow" class="hidden flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
                <span>Your Current Bid:</span>
                <span id="myPreviousBidDisplay" class="font-mono text-slate-300 font-bold">₹0</span>
            </div>
        </div>

        <form id="bidForm" method="POST" action="" data-ajax="true" class="space-y-4 sm:space-y-5">
            @csrf
            <input type="hidden" id="committeeTotalAmount" value="{{ $committee->total_amount }}">
            <input type="hidden" id="committeeTotalMembers" value="{{ $committee->total_members }}">
            <input type="hidden" id="currentBidMin" value="0">  {{-- tracks minimum allowed bid --}}

            <div class="space-y-1.5 sm:space-y-2">
                <div class="flex items-center justify-between">
                    <label for="bid_amount" class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Your Offered Deduction Amount (₹)
                    </label>
                    <span id="minBidBadge" class="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        Min: ₹0
                    </span>
                </div>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">₹</span>
                    <input type="number" step="1" min="0" max="{{ $committee->total_amount }}"
                        name="bid_amount" id="bid_amount" required
                        oninput="calculateBidPreview(); validateBidAmount();"
                        class="w-full glass-input pl-8 pr-4 py-2.5 rounded-xl text-sm font-mono font-bold text-amber-400"
                        placeholder="Enter amount">
                </div>
                <!-- Quick Add Increment buttons -->
                <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[10px] uppercase font-bold text-slate-400 mr-1">Quick Add:</span>
                    <button type="button" onclick="setBidToMin()" class="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors">
                        Min Allowed
                    </button>
                    <button type="button" onclick="addBidIncrement(500)" class="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors">
                        +₹500
                    </button>
                    <button type="button" onclick="addBidIncrement(1000)" class="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors">
                        +₹1,000
                    </button>
                    <button type="button" onclick="addBidIncrement(2000)" class="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors">
                        +₹2,000
                    </button>
                </div>

                <!-- Validation hint -->
                <div id="bidValidationHint" class="hidden flex items-center space-x-1.5 text-xs text-rose-400 font-semibold">
                    <i class="fa-solid fa-circle-xmark shrink-0"></i>
                    <span id="bidValidationMsg">Bid must be higher than current highest bid.</span>
                </div>
                <p class="text-[11px] text-slate-400" id="bidHelpText">Boli Rule: Nayi bid current highest bid se zyada honi chahiye (kam se kam ₹1 zyada).</p>
            </div>

            <!-- Live preview -->
            <div class="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <span class="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live Bid Preview</span>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span class="text-slate-400 text-[11px]">Estimated Net Payout:</span>
                        <span class="block font-mono font-bold text-emerald-300 text-sm sm:text-base" id="previewNetPayout">₹0.00</span>
                    </div>
                    <div>
                        <span class="text-slate-400 text-[11px]">Installment / Member:</span>
                        <span class="block font-mono font-bold text-white text-sm sm:text-base" id="previewInstallment">₹0.00</span>
                    </div>
                </div>
            </div>

            <div class="space-y-1.5">
                <label for="remarks" class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Message to Organizer (Optional)
                </label>
                <input type="text" name="remarks" id="remarks" placeholder="e.g. Please consider my bid for this round"
                    class="w-full glass-input px-4 py-2.5 rounded-xl text-xs">
            </div>

            <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="closeBidModal()" class="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-center">
                    Cancel
                </button>
                <button type="submit" id="bidSubmitBtn" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/25 text-center">
                    <i class="fa-solid fa-gavel mr-1"></i> <span id="bidSubmitLabel">Submit My Bid</span>
                </button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    // ─────────────────────────────────────────────────
    // SCHEDULES STATE & BIDDING SYSTEM
    // ─────────────────────────────────────────────────
    const committeeId = '{{ $committee->hash_id ?? $committee->id }}';
    const myMemberId  = {{ $member->id }};
    const alreadyWon  = {{ $alreadyWon ? 'true' : 'false' }};
    const liveBidsUrl = '{{ route("member.committees.liveBids", $committee) }}';

    let _schedulesState = {
        @foreach($committee->schedules as $s)
            @php
                $rTop = ($allBids->get($s->id) ?? collect())->sortByDesc('bid_amount')->first();
                $rTopAmt = $rTop ? (float) $rTop->bid_amount : 0;
                $myAmt = $myBids->has($s->id) ? (float) $myBids->get($s->id)->bid_amount : 0;
                $bDeduct = (float) ($s->deduction_amount ?? 0);
            @endphp
            {{ $s->id }}: {
                monthNo: {{ $s->month_no }},
                topBid: {{ $rTopAmt }},
                baseDeduction: {{ $bDeduct }},
                myBid: {{ $myAmt }},
                remarks: {!! json_encode($myBids->get($s->id)->remarks ?? '') !!}
            },
        @endforeach
    };

    let _activeScheduleId     = null;
    let _currentTopBid        = 0;
    let _currentBaseDeduction = 0;
    let _myCurrentBid         = 0;
    let _currentMinAllowedBid = 0;

    function formatINR(amount) {
        return '₹' + Number(amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0});
    }

    // ─────────────────────────────────────────────────
    // BID MODAL — Strict Auction Enforcement
    // ─────────────────────────────────────────────────
    function openBidModal(scheduleId, monthNo, totalAmount, topBidInRound, baseDeduction, myCurrentBid, remarks) {
        _activeScheduleId = scheduleId;

        if (_schedulesState && _schedulesState[scheduleId]) {
            const s = _schedulesState[scheduleId];
            if (s.topBid !== undefined) topBidInRound = s.topBid;
            if (s.baseDeduction !== undefined) baseDeduction = s.baseDeduction;
            if (s.myBid !== undefined) myCurrentBid = s.myBid;
            if (!remarks && s.remarks) remarks = s.remarks;
        }

        _currentTopBid        = parseFloat(topBidInRound) || 0;
        _currentBaseDeduction = parseFloat(baseDeduction) || 0;
        _myCurrentBid         = parseFloat(myCurrentBid) || 0;

        // Strict Auction Rule:
        // 1. If any bid already exists in round, next bid must be strictly higher (> topBid)
        // 2. If no bids exist yet, starting bid cannot be less than base deduction
        if (_currentTopBid > 0) {
            _currentMinAllowedBid = _currentTopBid + 1;
        } else {
            _currentMinAllowedBid = _currentBaseDeduction > 0 ? _currentBaseDeduction : 1;
        }

        const isEdit = _myCurrentBid > 0 && remarks !== '__new__';

        document.getElementById('bidModalTitle').innerText    = isEdit ? 'Raise Your Bid' : 'Place Your Auction Bid';
        document.getElementById('bidModalSubtitle').innerText = 'Month ' + monthNo + ' Auction Round';
        document.getElementById('bidForm').action             = '/member/schedules/' + scheduleId + '/bid';
        document.getElementById('currentBidMin').value        = _currentMinAllowedBid;

        // Current Top Bid Display
        const topBidDisp = document.getElementById('currentTopBidDisplay');
        if (_currentTopBid > 0) {
            topBidDisp.innerText = formatINR(_currentTopBid);
            topBidDisp.className = 'font-mono font-black text-amber-300 text-sm';
        } else {
            topBidDisp.innerText = 'No Bids Yet (Base: ' + formatINR(_currentBaseDeduction) + ')';
            topBidDisp.className = 'font-mono font-semibold text-slate-400 text-xs';
        }

        // Min Required Display & Badge
        document.getElementById('currentMinRequiredDisplay').innerText = formatINR(_currentMinAllowedBid);
        document.getElementById('minBidBadge').innerText = 'Min: ' + formatINR(_currentMinAllowedBid);

        // Previous Bid Row (if this member has already bid)
        const myPrevRow = document.getElementById('myPreviousBidRow');
        if (isEdit && _myCurrentBid > 0) {
            document.getElementById('myPreviousBidDisplay').innerText = formatINR(_myCurrentBid);
            myPrevRow.classList.remove('hidden');
        } else {
            myPrevRow.classList.add('hidden');
        }

        // Configure input field
        const input = document.getElementById('bid_amount');
        input.min   = _currentMinAllowedBid;
        input.placeholder = 'At least ' + formatINR(_currentMinAllowedBid);
        input.value = _currentMinAllowedBid > 0 ? _currentMinAllowedBid : '';

        document.getElementById('remarks').value            = (remarks === '__new__') ? '' : (remarks || '');
        document.getElementById('bidSubmitLabel').innerText = isEdit ? 'Submit Higher Bid' : 'Submit My Bid';

        validateBidAmount();
        calculateBidPreview();
        document.getElementById('bidModal').classList.remove('hidden');
    }

    function closeBidModal() {
        _activeScheduleId = null;
        document.getElementById('bidModal').classList.add('hidden');
        document.getElementById('bidValidationHint').classList.add('hidden');
    }

    function setBidToMin() {
        const input = document.getElementById('bid_amount');
        input.value = _currentMinAllowedBid;
        calculateBidPreview();
        validateBidAmount();
    }

    function addBidIncrement(amount) {
        const input = document.getElementById('bid_amount');
        let currentVal = parseFloat(input.value) || _currentMinAllowedBid;
        let baseVal = Math.max(currentVal, _currentMinAllowedBid);
        input.value = Math.round(baseVal + amount);
        calculateBidPreview();
        validateBidAmount();
    }

    function validateBidAmount() {
        const input     = document.getElementById('bid_amount');
        const hint      = document.getElementById('bidValidationHint');
        const msg       = document.getElementById('bidValidationMsg');
        const submitBtn = document.getElementById('bidSubmitBtn');
        const val       = parseFloat(input.value) || 0;

        if (!val || val <= 0) {
            msg.innerText = 'Please enter an offered deduction amount.';
            hint.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            return false;
        }

        // Rule 1: If current top bid exists, new bid must be strictly greater than top bid
        if (_currentTopBid > 0 && val <= _currentTopBid) {
            msg.innerText = 'Current highest bid is ' + formatINR(_currentTopBid) + '. Your bid must be strictly higher (at least ' + formatINR(_currentTopBid + 1) + ').';
            hint.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            return false;
        }

        // Rule 2: If no bids yet, cannot be lower than base deduction
        if (_currentTopBid === 0 && _currentBaseDeduction > 0 && val < _currentBaseDeduction) {
            msg.innerText = 'Starting bid cannot be less than starting base amount (' + formatINR(_currentBaseDeduction) + ').';
            hint.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            return false;
        }

        hint.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        return true;
    }

    function calculateBidPreview() {
        const v = parseFloat(document.getElementById('committeeTotalAmount').value) || 0;
        const m = parseFloat(document.getElementById('committeeTotalMembers').value) || 1;
        const d = parseFloat(document.getElementById('bid_amount').value) || 0;
        const netPayout   = Math.max(0, v - d);
        const installment = netPayout / m;
        document.getElementById('previewNetPayout').innerText   = '₹' + netPayout.toLocaleString('en-IN', {minimumFractionDigits: 2});
        document.getElementById('previewInstallment').innerText = '₹' + installment.toLocaleString('en-IN', {minimumFractionDigits: 2});
    }

    // ─────────────────────────────────────────────────
    // ROUND CARD TOGGLE (EXPAND / COLLAPSE)
    // ─────────────────────────────────────────────────
    function toggleRoundCard(scheduleId) {
        const body    = document.getElementById('round-body-' + scheduleId);
        const chevron = document.getElementById('chevron-' + scheduleId);
        body.classList.toggle('hidden');
        chevron.style.transform = body.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }

    // ─────────────────────────────────────────────────
    // REAL-TIME LIVE BIDS — Polling & Instant Sync
    // ─────────────────────────────────────────────────
    let _pollingActive    = true;
    let _abortCtrl        = null;
    let _prevBidHash      = {};
    let _prevTopBids      = {};
    let _consecutiveFails = 0;

    function buildBidRowHTML(bid, idx) {
        const isMe = bid.member_id === myMemberId;
        const rankIcon = idx === 0
            ? '<div class="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0" title="Highest Bid"><i class="fa-solid fa-crown"></i></div>'
            : `<div class="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">${idx+1}</div>`;
        const statusBadge = bid.status === 'approved'
            ? '<span class="text-[10px] text-emerald-400 font-bold"><i class="fa-solid fa-check-circle mr-0.5"></i>Approved</span>'
            : '<span class="text-[10px] text-slate-500">Pending</span>';
        const nameColor    = isMe ? 'text-emerald-300' : 'text-white';
        const amountColor  = isMe ? 'text-emerald-400' : 'text-amber-300';
        const rowBg        = isMe ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-900/60 border border-slate-800';
        const youTag       = isMe ? '<span class="text-[10px] text-emerald-400 font-bold">(You)</span>' : '';
        const remarksHtml  = bid.remarks ? `<span class="block text-[10px] text-slate-400 italic truncate">"${bid.remarks}"</span>` : '';

        return `<div class="flex items-center justify-between p-2.5 rounded-lg ${rowBg} transition-all duration-200">
            <div class="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                ${rankIcon}
                <div class="min-w-0">
                    <span class="block text-xs font-bold truncate ${nameColor}">${bid.name} ${youTag}</span>
                    ${remarksHtml}
                </div>
            </div>
            <div class="text-right shrink-0">
                <span class="block font-mono font-black text-sm ${amountColor}">${formatINR(bid.bid_amount)}</span>
                ${statusBadge}
            </div>
        </div>`;
    }

    function applyLiveBidsData(data) {
        const locks = data.lock_status || {};
        const bids  = data.bids || {};
        let   pageNeedsReload = false;

        Object.entries(locks).forEach(([sid, info]) => {
            const card        = document.getElementById('schedule-card-' + sid);
            const bidList     = document.querySelector('.bid-list-' + sid);
            const topAmountEl = document.getElementById('topbid-amount-' + sid);
            const topNameEl   = document.getElementById('topbid-name-' + sid);
            const topDotEl    = document.getElementById('topbid-dot-' + sid);
            const topPingEl   = document.getElementById('topbid-ping-' + sid);
            const topPill     = document.getElementById('topbid-pill-' + sid);

            if (!card) return;

            const wasLocked   = card.dataset.isLocked === 'true';
            const isNowLocked = info.is_locked;

            // Lock status changed → reload page once
            if (wasLocked !== isNowLocked) {
                pageNeedsReload = true;
            }

            // Sort bids DESCENDING (highest boli first)
            const bidArr   = (bids[sid] || []).sort((a,b) => b.bid_amount - a.bid_amount);
            const topBid   = bidArr[0];
            const myBidObj = bidArr.find(b => b.member_id === myMemberId);

            // Update _schedulesState
            if (!_schedulesState[sid]) _schedulesState[sid] = {};
            _schedulesState[sid].topBid = topBid ? topBid.bid_amount : 0;
            _schedulesState[sid].myBid  = myBidObj ? myBidObj.bid_amount : 0;
            if (myBidObj && myBidObj.remarks) _schedulesState[sid].remarks = myBidObj.remarks;
            if (data.highest_bids && data.highest_bids[sid]) {
                _schedulesState[sid].baseDeduction = data.highest_bids[sid].base_deduction;
            }

            // Update action button on round card
            const actionBtn = document.getElementById('bid-btn-' + sid);
            if (actionBtn && !info.is_locked && !alreadyWon) {
                const hasMyBid = myBidObj && myBidObj.bid_amount > 0;
                if (hasMyBid) {
                    actionBtn.className = 'w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all text-center flex items-center justify-center';
                    actionBtn.innerHTML = '<i class="fa-solid fa-arrow-trend-up mr-1.5"></i> Raise Bid (My: ' + formatINR(myBidObj.bid_amount) + ')';
                } else {
                    actionBtn.className = 'w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 text-center flex items-center justify-center';
                    actionBtn.innerHTML = '<i class="fa-solid fa-gavel mr-1.5"></i> Place Bid';
                }
            }

            // Update bid count badges
            document.querySelectorAll('.bid-count-' + sid).forEach(el => {
                el.innerText = bidArr.length;
            });

            // Update Top Boli Pill on Card Header
            const prevTopAmt = _prevTopBids[sid] || 0;
            if (topBid) {
                if (topAmountEl) topAmountEl.innerText = formatINR(topBid.bid_amount);
                if (topNameEl) topNameEl.innerText = '(by ' + (topBid.member_id === myMemberId ? 'You' : topBid.name) + ')';
                if (topDotEl) { topDotEl.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400'; }
                if (topPingEl) { topPingEl.classList.remove('hidden'); }

                // Check if another member placed a brand new higher bid
                if (prevTopAmt > 0 && topBid.bid_amount > prevTopAmt) {
                    card.classList.add('ring-2', 'ring-amber-400', 'shadow-amber-500/30');
                    if (topPill) topPill.classList.add('bg-amber-500/30', 'border-amber-400');

                    setTimeout(() => {
                        card.classList.remove('ring-2', 'ring-amber-400', 'shadow-amber-500/30');
                        if (topPill) topPill.classList.remove('bg-amber-500/30', 'border-amber-400');
                    }, 3000);

                    const bidderName = topBid.member_id === myMemberId ? 'Aap' : topBid.name;
                    showToast('🔥 Nayi Boli: ' + bidderName + ' ne Month ' + info.month_no + ' ke liye ' + formatINR(topBid.bid_amount) + ' ki bid lagayi!', 'success');
                }

                _prevTopBids[sid] = topBid.bid_amount;
            } else {
                if (topAmountEl) topAmountEl.innerText = 'No Bids Yet';
                if (topNameEl) topNameEl.innerText = '';
                if (topDotEl) { topDotEl.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600'; }
                if (topPingEl) { topPingEl.classList.add('hidden'); }
                _prevTopBids[sid] = 0;
            }

            // Update card header quick mybid
            const quickBidEl = document.getElementById('quick-mybid-' + sid);
            if (quickBidEl && myBidObj) {
                quickBidEl.innerText = formatINR(myBidObj.bid_amount);
                quickBidEl.closest('[id^="mybid-wrap"]') && quickBidEl.closest('[id^="mybid-wrap"]').classList.remove('hidden');
            }

            // Rebuild bid list in real-time
            const newHash = bidArr.map(b => b.id + ':' + b.bid_amount + ':' + b.status).join('|');
            if (_prevBidHash[sid] !== newHash && bidList) {
                _prevBidHash[sid] = newHash;
                if (bidArr.length === 0) {
                    bidList.innerHTML = '<div class="text-center py-4 text-slate-500 text-xs italic">No bids placed yet for this round. Be the first!</div>';
                } else {
                    bidList.innerHTML = bidArr.map((b, i) => buildBidRowHTML(b, i)).join('');
                }
            }

            // If modal is actively open for this round, sync in real-time!
            if (_activeScheduleId == sid) {
                const latestTop = topBid ? topBid.bid_amount : 0;
                if (latestTop !== _currentTopBid) {
                    _currentTopBid = latestTop;
                    _currentMinAllowedBid = _currentTopBid > 0 ? (_currentTopBid + 1) : (_currentBaseDeduction > 0 ? _currentBaseDeduction : 1);

                    const topBidDisp = document.getElementById('currentTopBidDisplay');
                    if (_currentTopBid > 0) {
                        topBidDisp.innerText = formatINR(_currentTopBid);
                        topBidDisp.className = 'font-mono font-black text-amber-300 text-sm';
                    } else {
                        topBidDisp.innerText = 'No Bids Yet (Base: ' + formatINR(_currentBaseDeduction) + ')';
                        topBidDisp.className = 'font-mono font-semibold text-slate-400 text-xs';
                    }

                    document.getElementById('currentMinRequiredDisplay').innerText = formatINR(_currentMinAllowedBid);
                    document.getElementById('minBidBadge').innerText = 'Min: ' + formatINR(_currentMinAllowedBid);
                    document.getElementById('currentBidMin').value = _currentMinAllowedBid;

                    const input = document.getElementById('bid_amount');
                    input.min = _currentMinAllowedBid;
                    input.placeholder = 'At least ' + formatINR(_currentMinAllowedBid);

                    // Re-validate against new top bid
                    validateBidAmount();
                }
            }
        });

        if (pageNeedsReload) {
            setTimeout(() => window.location.reload(), 1200);
        }
    }

    function fetchLiveBids() {
        if (!_pollingActive) return;

        if (_abortCtrl) _abortCtrl.abort();
        _abortCtrl = new AbortController();

        fetch(liveBidsUrl, {
            signal: _abortCtrl.signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
        })
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            _consecutiveFails = 0;
            applyLiveBidsData(data);

            const badge = document.getElementById('liveStatusBadge');
            const timeEl = document.getElementById('lastUpdatedTime');
            if (badge) badge.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider';
            if (timeEl) timeEl.innerText = 'Live • ' + new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
        })
        .catch(err => {
            if (err.name === 'AbortError') return;
            _consecutiveFails++;
            const badge  = document.getElementById('liveStatusBadge');
            const timeEl = document.getElementById('lastUpdatedTime');
            if (badge) badge.className = 'inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider';
            if (timeEl) timeEl.innerText = 'Reconnecting...';
        });
    }

    // ── Instant AJAX Bid Submit without Page Reload ──
    document.getElementById('bidForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!validateBidAmount()) {
            return;
        }

        const form = this;
        const submitBtn = document.getElementById('bidSubmitBtn');
        const origHtml = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Submitting...';

        try {
            const formData = new FormData(form);
            const res = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                closeBidModal();
                showToast(data.message || 'Bid submitted successfully!', 'success');
                fetchLiveBids();
            } else {
                const errMsg = data.message || 'Could not submit bid. Please check amount.';
                showToast(errMsg, 'error');
                const hint = document.getElementById('bidValidationHint');
                const msg  = document.getElementById('bidValidationMsg');
                if (hint && msg) {
                    msg.innerText = errMsg;
                    hint.classList.remove('hidden');
                }
            }
        } catch (err) {
            showToast('Network error while placing bid. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    });

    // Auto-expand the first open (non-locked) round on load
    document.addEventListener('DOMContentLoaded', () => {
        const firstOpen = document.querySelector('[data-is-locked="false"]');
        if (firstOpen) {
            const sid    = firstOpen.dataset.scheduleId;
            const body   = document.getElementById('round-body-' + sid);
            const chev   = document.getElementById('chevron-' + sid);
            if (body) { body.classList.remove('hidden'); }
            if (chev) { chev.style.transform = 'rotate(180deg)'; }
        }

        // Initial fetch immediately, then periodic polling
        fetchLiveBids();
        setInterval(fetchLiveBids, 3200);

        // Pause polling when tab is hidden, resume instantly when tab is active
        document.addEventListener('visibilitychange', () => {
            _pollingActive = !document.hidden;
            if (_pollingActive) fetchLiveBids();
        });
    });
</script>
@endsection
