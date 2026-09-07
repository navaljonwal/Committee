@extends('layouts.app')

@section('title', 'Member Portal - My Committees & Bids')

@section('content')
<div class="space-y-8">
    <!-- Header Section -->
    <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="space-y-2 z-10">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <i class="fa-solid fa-user-circle"></i>
                <span>Member Portal</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">{{ $member ? $member->name : $user->name }}</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400">
                View all your enrolled dynamic committees, track payment ledgers, and submit live auction bids.
            </p>
        </div>

        @if($member)
        <div class="z-10 flex items-center space-x-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shrink-0">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-lg">
                {{ substr($member->name, 0, 2) }}
            </div>
            <div>
                <span class="block text-xs font-bold text-white">{{ $member->name }}</span>
                <span class="block text-xs font-mono text-slate-400"><i class="fa-solid fa-phone mr-1 text-[10px]"></i>{{ $member->phone }}</span>
                <span class="block text-[10px] text-emerald-400 font-semibold uppercase mt-0.5"><i class="fa-solid fa-shield mr-1"></i>Active Account</span>
            </div>
        </div>
        @endif
    </div>

    <!-- Quick Stats Overview -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-layer-group"></i>
            </div>
            <div>
                <span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Enrolled Committees</span>
                <span class="text-2xl font-black text-white">{{ $committees->count() }}</span>
            </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-gavel"></i>
            </div>
            <div>
                <span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">My Submitted Bids</span>
                <span class="text-2xl font-black text-white">{{ $myBids->count() }}</span>
            </div>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center space-x-4">
            <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl shrink-0">
                <i class="fa-solid fa-receipt"></i>
            </div>
            <div>
                <span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pending Payments</span>
                <span class="text-2xl font-black text-rose-400">{{ $pendingPayments->count() }}</span>
            </div>
        </div>
    </div>

    <!-- My Enrolled Committees (Supports 1, 2, 3+ Committees) -->
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center space-x-2">
                <i class="fa-solid fa-layer-group text-emerald-400"></i>
                <span>My Committees ({{ $committees->count() }})</span>
            </h2>
            <span class="text-xs text-slate-400">Click any committee to view schedule & submit live bids</span>
        </div>

        @if($committees->isEmpty())
            <div class="glass-card p-8 rounded-2xl text-center space-y-3 border border-slate-800">
                <div class="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xl">
                    <i class="fa-solid fa-folder-open"></i>
                </div>
                <p class="text-sm text-slate-400 font-medium">You are not enrolled in any active committees currently.</p>
                <p class="text-xs text-slate-500">Contact the Committee Organizer to add your phone number to a committee schedule.</p>
            </div>
        @else
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($committees as $committee)
                    @php
                        $baseDeduction = ($committee->total_amount * $committee->monthly_rate) / 100;
                        $standardInstallment = ($committee->total_amount - $baseDeduction) / $committee->total_members;
                    @endphp
                    <div class="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-5 group relative">
                        <div class="space-y-3">
                            <div class="flex items-start justify-between flex-wrap gap-2">
                                <div class="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                                        {{ $committee->total_members }} Members / Months
                                    </span>
                                    @php
                                        $memberSeatsCount = $committee->getMemberSeatsCount($member->id);
                                        $memberWonCount = $committee->getMemberWonCount($member->id);
                                    @endphp
                                    @if($memberSeatsCount > 1)
                                        <span class="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1" title="You hold {{ $memberSeatsCount }} seats/names in this committee">
                                            <i class="fa-solid fa-users-rectangle text-purple-400"></i>
                                            <span>{{ $memberSeatsCount }} Seats (Won {{ $memberWonCount }}/{{ $memberSeatsCount }})</span>
                                        </span>
                                    @endif
                                </div>
                                <span class="text-[10px] font-mono text-slate-400">{{ $committee->monthly_rate }}% Base Rate</span>
                            </div>
                            <h3 class="text-xl font-black text-white group-hover:text-emerald-400 transition-colors">
                                {{ $committee->name }}
                            </h3>
                            <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-400">Total Chit Value:</span>
                                    <span class="font-bold text-white font-mono">₹{{ number_format($committee->total_amount, 2) }}</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-400">Standard Monthly:</span>
                                    <span class="font-bold text-emerald-400 font-mono">₹{{ number_format($standardInstallment, 2) }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="pt-2">
                            <a href="{{ route('member.committees.show', $committee) }}" class="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2">
                                <i class="fa-solid fa-eye"></i>
                                <span>View Schedule & Bid</span>
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    <!-- Recent Auction Bids Submitted by Member -->
    @if($myBids->isNotEmpty())
    <div class="space-y-4">
        <h2 class="text-lg font-bold text-white flex items-center space-x-2">
            <i class="fa-solid fa-gavel text-amber-400"></i>
            <span>My Submitted Auction Bids ({{ $myBids->count() }})</span>
        </h2>
        <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                        <tr>
                            <th class="py-3 px-4">Committee</th>
                            <th class="py-3 px-4">Month Round</th>
                            <th class="py-3 px-4">Offered Deduction Bid</th>
                            <th class="py-3 px-4">Status</th>
                            <th class="py-3 px-4">Submitted Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        @foreach($myBids as $bid)
                        <tr class="hover:bg-slate-800/40">
                            <td class="py-3 px-4 font-bold text-white">{{ $bid->schedule->committee->name ?? 'N/A' }}</td>
                            <td class="py-3 px-4 font-semibold text-emerald-400">Month {{ $bid->schedule->month_no }}</td>
                            <td class="py-3 px-4 font-mono font-bold text-amber-400">₹{{ number_format($bid->bid_amount, 2) }}</td>
                            <td class="py-3 px-4">
                                @if($bid->status === 'approved')
                                    <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">Approved</span>
                                @elseif($bid->status === 'rejected')
                                    <span class="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold uppercase">Rejected</span>
                                @else
                                    <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase">Pending Review</span>
                                @endif
                            </td>
                            <td class="py-3 px-4 text-slate-400">{{ $bid->created_at->format('d M Y, h:i A') }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    @endif
</div>
@endsection
