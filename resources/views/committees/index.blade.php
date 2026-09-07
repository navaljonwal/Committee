@extends('layouts.app')

@section('title', 'Dashboard - ChitFund Pro')

@section('content')
<div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-emerald-950/40 p-6 md:p-8 rounded-2xl border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="space-y-2 z-10">
            <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>Private Committee Dashboard</span>
                <span class="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active Engine</span>
            </h1>
            <p class="text-sm text-slate-400 max-w-2xl">
                Manage your Chit Fund (BC) schedules dynamically. Input any pool amount, set members count, deduction rate, and calculate monthly net payout and installments instantly.
            </p>
        </div>
        <div class="flex items-center space-x-3 z-10 shrink-0">
            <a href="{{ route('committees.create') }}" class="px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 hover:scale-[1.02]">
                <i class="fa-solid fa-plus text-base"></i>
                <span>Create New Committee</span>
            </a>
        </div>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800 glass-card-hover shadow-lg shadow-blue-500/5">
            <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Committees</span>
                <div class="text-2xl md:text-3xl font-black text-white mt-1">{{ number_format($stats['total_committees']) }}</div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl shadow-md">
                <i class="fa-solid fa-layer-group"></i>
            </div>
        </div>

        <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800 glass-card-hover shadow-lg shadow-emerald-500/5">
            <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Committees</span>
                <div class="text-2xl md:text-3xl font-black text-emerald-400 mt-1">{{ number_format($stats['active_committees']) }}</div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shadow-md">
                <i class="fa-solid fa-circle-play"></i>
            </div>
        </div>

        <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800 glass-card-hover shadow-lg shadow-amber-500/5">
            <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pool Value</span>
                <div class="text-2xl md:text-3xl font-black text-amber-300 font-mono mt-1">₹{{ number_format($stats['total_pool_value'], 0) }}</div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shadow-md">
                <i class="fa-solid fa-vault"></i>
            </div>
        </div>

        <div class="glass-card p-5 rounded-2xl flex items-center justify-between border border-slate-800 glass-card-hover shadow-lg shadow-purple-500/5">
            <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Members</span>
                <div class="text-2xl md:text-3xl font-black text-purple-300 mt-1">{{ number_format($stats['total_members']) }}</div>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl shadow-md">
                <i class="fa-solid fa-users"></i>
            </div>
        </div>
    </div>

    <!-- Active Committees List -->
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-folder-open text-emerald-400"></i>
                <span>Active Committees & Schedules</span>
            </h2>
            <a href="{{ route('committees.create') }}" class="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                <span>+ Add New</span>
            </a>
        </div>

        @if($committees->isEmpty())
            <div class="glass-card p-12 rounded-2xl text-center space-y-4 border border-dashed border-slate-700">
                <div class="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                    <i class="fa-solid fa-calculator"></i>
                </div>
                <h3 class="text-lg font-bold text-white">No Committees Created Yet</h3>
                <p class="text-slate-400 text-sm max-w-md mx-auto">
                    Get started by entering your chit fund amount (e.g. ₹2,00,000), member count, and deduction rate. The schedule will calculate automatically.
                </p>
                <a href="{{ route('committees.create') }}" class="inline-flex items-center px-6 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                    <i class="fa-solid fa-plus mr-2"></i> Create First Committee
                </a>
            </div>
        @else
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($committees as $committee)
                    <div class="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group">
                        <div class="space-y-4">
                            <div class="flex items-start justify-between">
                                <div>
                                    <span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                                        {{ $committee->status }}
                                    </span>
                                    <h3 class="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                                        {{ $committee->name }}
                                    </h3>
                                </div>
                                <div class="text-right">
                                    <span class="text-xs text-slate-400 uppercase font-semibold block">Chit Value</span>
                                    <span class="text-lg font-extrabold text-amber-400">₹{{ number_format($committee->total_amount, 0) }}</span>
                                </div>
                            </div>

                            <!-- Parameters Grid -->
                            <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 text-xs border border-slate-800/80">
                                <div>
                                    <span class="text-slate-400 block">Total Members:</span>
                                    <span class="text-slate-200 font-bold text-sm">{{ $committee->total_members }} Members</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block">Monthly Rate:</span>
                                    <span class="text-emerald-400 font-bold text-sm">{{ $committee->deduction_rate }}%</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block">Special Month:</span>
                                    <span class="text-amber-400 font-bold">Month 2 (Index {{ $committee->special_month_index }})</span>
                                </div>
                                <div>
                                    <span class="text-slate-400 block">Start Date:</span>
                                    <span class="text-slate-300 font-medium">{{ $committee->start_date ? $committee->start_date->format('d M Y') : 'N/A' }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Card Action Buttons -->
                        <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                            <a href="{{ route('committees.show', $committee) }}" class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                                <i class="fa-solid fa-table-cells text-xs"></i> View Schedule
                            </a>
                            <a href="{{ route('committees.edit', $committee) }}" title="Edit Committee" class="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-700 border border-slate-700 transition-colors">
                                <i class="fa-solid fa-pen-to-square text-sm"></i>
                            </a>
                            <a href="{{ route('committees.exportCsv', $committee) }}" title="Export CSV" class="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-slate-800 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 border border-slate-700 transition-colors">
                                <i class="fa-solid fa-file-csv text-sm"></i>
                            </a>
                            <a href="{{ route('committees.printView', $committee) }}" target="_blank" title="Print A4" class="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-slate-800 text-blue-400 hover:text-blue-300 hover:bg-slate-700 border border-slate-700 transition-colors">
                                <i class="fa-solid fa-print text-sm"></i>
                            </a>
                            <form action="{{ route('committees.destroy', $committee) }}" method="POST" data-ajax="true" data-confirm="Are you sure you want to delete the committee &quot;{{ addslashes($committee->name) }}&quot;? All associated schedule and payment data will be permanently removed." data-confirm-title="Delete Committee Confirmation" data-confirm-btn="Yes, Delete Committee" class="shrink-0">
                                @csrf
                                @method('DELETE')
                                <button type="submit" title="Delete Committee" class="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors">
                                    <i class="fa-solid fa-trash-can text-sm"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                @endforeach
            </div>
        @endif
    </div>
</div>
@endsection
