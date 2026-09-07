@extends('layouts.app')

@section('title', 'Edit Committee - ' . $committee->name)

@section('content')
<div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-extrabold text-white flex items-center gap-3">
                <i class="fa-solid fa-pen-to-square text-amber-400"></i>
                <span>Edit Committee Configuration</span>
            </h1>
            <p class="text-slate-400 text-sm mt-1">Update chit fund parameters, total pool value, deduction rates, or start date.</p>
        </div>
        <div class="flex items-center space-x-3">
            <a href="{{ route('committees.show', $committee) }}" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors">
                <i class="fa-solid fa-arrow-left mr-1.5"></i> Back to Schedule
            </a>
            <button type="button" onclick="document.getElementById('committeeForm').requestSubmit()" class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95">
                <i class="fa-solid fa-floppy-disk text-slate-950"></i>
                <span>Save Changes</span>
            </button>
        </div>
    </div>

    <!-- Main Layout: Form Left, Real-time Preview Right -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Form Column (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
            <form action="{{ route('committees.update', $committee) }}" method="POST" id="committeeForm" data-ajax="true" class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                @csrf
                @method('PUT')

                <div class="border-b border-slate-800 pb-4 flex items-center justify-between">
                    <h2 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-amber-400"></i>
                        <span>Committee Parameters</span>
                    </h2>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {{ $committee->name }}
                    </span>
                </div>

                <!-- Status Selection -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Committee Status</label>
                    <select name="status" id="input_status" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                        <option value="active" {{ $committee->status === 'active' ? 'selected' : '' }}>Active</option>
                        <option value="paused" {{ $committee->status === 'paused' ? 'selected' : '' }}>Paused</option>
                        <option value="completed" {{ $committee->status === 'completed' ? 'selected' : '' }}>Completed</option>
                    </select>
                </div>

                <!-- Committee Name -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Committee Name</label>
                    <input type="text" name="name" id="input_name" value="{{ old('name', $committee->name) }}" required
                           class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none placeholder-slate-500">
                </div>

                <!-- Preset Quick Buttons for Amount -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Quick Chit Amount Presets</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="setPresetAmount(100000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 transition-colors">₹1 Lakh</button>
                        <button type="button" onclick="setPresetAmount(200000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 transition-colors">₹2 Lakhs</button>
                        <button type="button" onclick="setPresetAmount(500000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 transition-colors">₹5 Lakhs</button>
                    </div>
                </div>

                <!-- Total Amount -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Total Chit Amount (V)</label>
                    <div class="relative">
                        <span class="absolute left-4 top-2.5 text-slate-400 font-bold">₹</span>
                        <input type="number" name="total_amount" id="input_total_amount" value="{{ old('total_amount', $committee->total_amount) }}" min="1000" step="1000" required
                               class="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                    </div>
                    <span id="formatted_amount_text" class="text-[11px] text-emerald-400 font-semibold block">₹{{ number_format($committee->total_amount, 2) }} Pool Value</span>
                </div>

                <!-- Total Members & Monthly Rate Grid -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Total Members (M)</label>
                        <input type="number" name="total_members" id="input_total_members" value="{{ old('total_members', $committee->total_members) }}" min="1" max="100" required
                               class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                        <span class="text-[10px] text-slate-400 block">Total Months = Members</span>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Deduction % (R)</label>
                        <div class="relative">
                            <input type="number" name="deduction_rate" id="input_deduction_rate" value="{{ old('deduction_rate', $committee->deduction_rate) }}" min="0" max="50" step="0.1" required
                                   class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                            <span class="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">%</span>
                        </div>
                    </div>
                </div>

                <!-- Special Month Index Selection -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Zero Deduction Round (Full Draw)</label>
                    <select name="special_month_index" id="input_special_month_index" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-amber-400 font-semibold focus:outline-none">
                    </select>
                    <span class="text-[11px] text-slate-400 block">Deduction will be ₹0 for this round (winner gets 100% full amount).</span>
                </div>

                <!-- Start Date -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Committee Start Date</label>
                    <input type="date" name="start_date" id="input_start_date" value="{{ old('start_date', $committee->start_date ? $committee->start_date->format('Y-m-d') : date('Y-m-d')) }}" required
                           class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
                </div>

                <!-- Select Members & Seats -->
                @if(isset($members) && $members->count() > 0)
                <input type="hidden" name="update_members_list" value="1">
                <div class="space-y-1.5 pt-2 border-t border-slate-800">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Attached Committee Members &amp; Seats</label>
                    <div class="max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                        @foreach($members as $m)
                            @php
                                $attached = $committee->members->contains('id', $m->id);
                                $seatsCount = $attached ? $committee->getMemberSeatsCount($m->id) : 1;
                            @endphp
                            <div class="flex items-center justify-between text-xs text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800/40">
                                <label class="flex items-center space-x-2 cursor-pointer select-none">
                                    <input type="checkbox" name="members[]" value="{{ $m->id }}" {{ $attached ? 'checked' : '' }} class="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500">
                                    <span class="font-medium text-white">{{ $m->name }}</span>
                                    <span class="text-slate-400 text-[11px] font-mono">{{ $m->phone ? "($m->phone)" : '' }}</span>
                                </label>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] text-slate-400 font-semibold uppercase">Seats:</span>
                                    <input type="number" name="seats[{{ $m->id }}]" value="{{ $seatsCount }}" min="1" max="{{ $committee->total_members }}"
                                           class="w-12 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold text-center text-xs focus:outline-none">
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
                @endif

                <!-- Action Buttons -->
                <div class="flex items-center space-x-3 pt-4 border-t border-slate-800">
                    <a href="{{ route('committees.show', $committee) }}" class="w-1/3 py-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-center transition-all border border-slate-700">
                        Cancel
                    </a>
                    <button type="submit" id="saveCommitteeBtn" class="w-2/3 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:via-teal-200 hover:to-cyan-300 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]">
                        <i class="fa-solid fa-floppy-disk text-slate-950 text-base"></i>
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Preview Column (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
            <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-base font-bold text-white">Live Calculation Schedule Preview</h2>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">Updated Preview</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Base Unit Deduction: <span id="summary_base_unit" class="text-emerald-400 font-bold">₹0</span> per unit.</p>
                    </div>

                    <div class="text-right text-xs text-slate-400">
                        <span id="summary_member_share" class="block text-slate-300 font-semibold">Base Kist: ₹0 / member</span>
                    </div>
                </div>

                <!-- Table -->
                <div class="overflow-x-auto rounded-xl border border-slate-800">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                <th class="py-3 px-4">Month / Kisht</th>
                                <th class="py-3 px-4 text-right">Deduction (₹)</th>
                                <th class="py-3 px-4 text-right">Net Winner Payout (₹)</th>
                                <th class="py-3 px-4 text-right">Installment / Member (₹)</th>
                            </tr>
                        </thead>
                        <tbody id="previewTableBody" class="divide-y divide-slate-800/60 text-xs">
                        </tbody>
                        <tfoot id="previewTableFooter" class="bg-slate-950/90 text-xs font-bold text-white border-t-2 border-slate-700">
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    const initialSpecialIndex = {{ $committee->special_month_index }};

    function formatINR(val) {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);
    }

    function setPresetAmount(amt) {
        document.getElementById('input_total_amount').value = amt;
        updatePreview();
    }

    let currentM = 0;

    function updateSpecialMonthOptions(m) {
        const select = document.getElementById('input_special_month_index');
        const selectedVal = select.value ? parseInt(select.value) : initialSpecialIndex;
        select.innerHTML = '';

        const defaultN = m - 1;

        const opt2 = document.createElement('option');
        opt2.value = defaultN;
        opt2.innerText = `Month 2 (Index N = ${defaultN}) - Default Organizer Slot`;
        if (selectedVal === defaultN || !select.value) opt2.selected = true;
        select.appendChild(opt2);

        const opt1 = document.createElement('option');
        opt1.value = m;
        opt1.innerText = `Month 1 (Index N = ${m})`;
        if (selectedVal === m) opt1.selected = true;
        select.appendChild(opt1);

        if (m >= 3) {
            const opt3 = document.createElement('option');
            opt3.value = m - 2;
            opt3.innerText = `Month 3 (Index N = ${m - 2})`;
            if (selectedVal === (m - 2)) opt3.selected = true;
            select.appendChild(opt3);
        }

        const optNone = document.createElement('option');
        optNone.value = 0;
        optNone.innerText = 'No Special Month (Standard Deductions)';
        if (selectedVal === 0) optNone.selected = true;
        select.appendChild(optNone);
    }

    function updatePreview() {
        const v = parseFloat(document.getElementById('input_total_amount').value) || 0;
        const m = parseInt(document.getElementById('input_total_members').value) || 20;
        const r = parseFloat(document.getElementById('input_deduction_rate').value) || 1.5;

        if (m !== currentM) {
            currentM = m;
            updateSpecialMonthOptions(m);
        }

        const specialIndex = parseInt(document.getElementById('input_special_month_index').value);

        document.getElementById('formatted_amount_text').innerText = '₹' + formatINR(v) + ' Pool Value';
        const baseShare = m > 0 ? (v / m) : 0;
        document.getElementById('summary_member_share').innerText = 'Base Kist (0% Disc): ₹' + formatINR(baseShare) + ' / member';

        const baseUnit = (v * r) / 100;
        document.getElementById('summary_base_unit').innerText = '₹' + formatINR(baseUnit);

        const tbody = document.getElementById('previewTableBody');
        const tfoot = document.getElementById('previewTableFooter');

        tbody.innerHTML = '';
        tfoot.innerHTML = '';

        let totalDeductionSum = 0;
        let totalNetPayoutSum = 0;

        for (let month = 1; month <= m; month++) {
            const indexN = m - month + 1;
            const isSpecial = (indexN === specialIndex);
            const deduction = isSpecial ? 0.0 : (indexN * baseUnit);
            const netPayout = v - deduction;
            const kist = netPayout / m;

            totalDeductionSum += deduction;
            totalNetPayoutSum += netPayout;

            const tr = document.createElement('tr');
            if (isSpecial) {
                tr.className = 'bg-amber-500/10 border-l-4 border-l-amber-500 text-amber-200 font-semibold';
            } else {
                tr.className = month % 2 === 0 ? 'bg-slate-900/40 hover:bg-slate-800/40' : 'bg-slate-900/10 hover:bg-slate-800/40';
            }

            tr.innerHTML = `
                <td class="py-3 px-4 font-bold flex items-center gap-2">
                    Month ${month}
                    ${isSpecial ? '<span class="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fa-solid fa-star text-[9px] mr-1"></i> Full Draw (0% Deduction)</span>' : ''}
                </td>
                <td class="py-3 px-4 text-right font-mono ${isSpecial ? 'text-amber-300 font-extrabold' : 'text-slate-300'}">₹${formatINR(deduction)}</td>
                <td class="py-3 px-4 text-right font-mono font-extrabold ${isSpecial ? 'text-amber-300' : 'text-emerald-400'}">₹${formatINR(netPayout)}</td>
                <td class="py-3 px-4 text-right font-mono font-extrabold text-white">₹${formatINR(kist)}</td>
            `;
            tbody.appendChild(tr);
        }

        const totalKistPerMember = totalNetPayoutSum / m;

        tfoot.innerHTML = `
            <tr>
                <td class="py-3.5 px-4 font-black uppercase text-amber-400 tracking-wider">Grand Totals (${m} Months)</td>
                <td class="py-3.5 px-4 text-right font-mono text-amber-300">₹${formatINR(totalDeductionSum)}</td>
                <td class="py-3.5 px-4 text-right font-mono text-emerald-400 text-sm">₹${formatINR(totalNetPayoutSum)}</td>
                <td class="py-3.5 px-4 text-right font-mono text-white text-sm">
                    <div>₹${formatINR(totalKistPerMember)}</div>
                    <div class="text-[10px] font-normal text-slate-400">Total Kist per member</div>
                </td>
            </tr>
        `;
    }

    ['input_total_amount', 'input_total_members', 'input_deduction_rate', 'input_special_month_index'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', updatePreview);
            el.addEventListener('change', updatePreview);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        updateSpecialMonthOptions({{ $committee->total_members }});
        updatePreview();
    });
</script>
@endsection
