@extends('layouts.app')

@section('title', 'Create & Calculate Committee - ChitFund Pro')

@section('content')
<div class="space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-extrabold text-white flex items-center gap-3">
                <i class="fa-solid fa-calculator text-emerald-400"></i>
                <span>Committee Chit Calculation Setup</span>
            </h1>
            <p class="text-slate-400 text-sm mt-1">Configure chit fund parameters. Total Months dynamically equals Total Members (M).</p>
        </div>
        <a href="{{ route('committees.index') }}" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <i class="fa-solid fa-arrow-left mr-1.5"></i> Back to Dashboard
        </a>
    </div>

    <!-- Main Layout: Form Left, Real-time Preview Right -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Form Column (4 cols) -->
        <div class="lg:col-span-4 space-y-6">
            <form action="{{ route('committees.store') }}" method="POST" id="committeeForm" data-ajax="true" class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                @csrf

                <div class="border-b border-slate-800 pb-4">
                    <h2 class="text-base font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-emerald-400"></i>
                        <span>Committee Parameters</span>
                    </h2>
                </div>

                <!-- Committee Name -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Committee Name</label>
                    <input type="text" name="name" id="input_name" value="Royal Fortune Committee (2 Lakhs)" required
                           class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none placeholder-slate-500" placeholder="e.g. Diwali BC 2026">
                </div>

                <!-- Preset Quick Buttons for Amount -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Quick Chit Amount Presets</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="setPresetAmount(100000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 transition-colors">₹1 Lakh</button>
                        <button type="button" onclick="setPresetAmount(200000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 transition-colors">₹2 Lakhs</button>
                        <button type="button" onclick="setPresetAmount(500000)" class="py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/40 transition-colors">₹5 Lakhs</button>
                    </div>
                </div>

                <!-- Total Amount -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Total Chit Amount (V)</label>
                    <div class="relative">
                        <span class="absolute left-4 top-2.5 text-slate-400 font-bold">₹</span>
                        <input type="number" name="total_amount" id="input_total_amount" value="200000" min="1000" step="1000" required
                               class="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none" placeholder="200000">
                    </div>
                    <span id="formatted_amount_text" class="text-[11px] text-emerald-400 font-semibold block">₹2,00,000 Pool Value</span>
                </div>

                <!-- Total Members & Monthly Rate Grid -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Total Members (M)</label>
                        <input type="number" name="total_members" id="input_total_members" value="20" min="1" max="100" required
                               class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                        <span class="text-[10px] text-slate-400 block">Total Months = Members</span>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Deduction % (R)</label>
                        <div class="relative">
                            <input type="number" name="deduction_rate" id="input_deduction_rate" value="1.5" min="0" max="50" step="0.1" required
                                   class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold focus:outline-none">
                            <span class="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">%</span>
                        </div>
                    </div>
                </div>

                <!-- Special Month Index Selection -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Zero Deduction Round (Full Draw)</label>
                    <select name="special_month_index" id="input_special_month_index" class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-amber-400 font-semibold focus:outline-none">
                        <!-- Populated dynamically via JS based on Total Members M -->
                    </select>
                    <span class="text-[11px] text-slate-400 block">Deduction will be ₹0 for this round (winner gets 100% full amount).</span>
                </div>

                <!-- Start Date -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Committee Start Date</label>
                    <input type="date" name="start_date" id="input_start_date" value="{{ date('Y-m-d') }}" required
                           class="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white focus:outline-none">
                </div>

                <!-- Select Initial Members (Optional, capped to Total Members M) -->
                @if(isset($members) && $members->count() > 0)
                <div class="space-y-2 pt-3 border-t border-slate-800">
                    <div class="flex items-center justify-between">
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Attach Members (<span id="memberCountText" class="text-emerald-400 font-bold">0</span> / <span id="memberMaxText" class="text-amber-400 font-bold">20</span>)
                        </label>
                        <div class="flex items-center gap-2 text-[11px]">
                            <button type="button" onclick="autoSelectMembers()" class="text-cyan-400 hover:text-cyan-300 font-bold underline">
                                Select First <span id="btnAutoCount">20</span>
                            </button>
                            <span class="text-slate-600">|</span>
                            <button type="button" onclick="clearAllMembers()" class="text-slate-400 hover:text-white underline">
                                Clear
                            </button>
                        </div>
                    </div>
                    <div class="max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1" id="membersCheckboxContainer">
                        @foreach($members as $index => $m)
                            <label class="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer select-none p-1.5 rounded hover:bg-slate-800/40 transition-colors member-item">
                                <div class="flex items-center space-x-2.5">
                                    <span class="text-[10px] font-mono text-slate-500 w-5 text-right">{{ $index + 1 }}.</span>
                                    <input type="checkbox" name="members[]" value="{{ $m->id }}"
                                           class="member-checkbox rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500">
                                    <span class="font-medium text-white">{{ $m->name }}</span>
                                </div>
                                <span class="text-slate-500 text-[11px] font-mono">{{ $m->phone ? $m->phone : '' }}</span>
                            </label>
                        @endforeach
                    </div>
                    <div id="memberLimitWarning" class="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 hidden flex items-center gap-1.5">
                        <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
                        <span id="memberLimitWarningText">You can only select up to 20 members for this 20-month committee!</span>
                    </div>
                </div>
                @endif

                <!-- Submit Button -->
                <button type="submit" class="w-full py-3 px-6 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i>
                    <span>Calculate & Create Committee</span>
                </button>
            </form>
        </div>

        <!-- Preview Column (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
            <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 gap-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-base font-bold text-white">Live Dynamic Calculation Schedule</h2>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Realtime Preview</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Calculated formula unit deduction: <span id="summary_base_unit" class="text-emerald-400 font-bold">₹3,000</span> per unit.</p>
                    </div>

                    <div class="text-right text-xs text-slate-400">
                        <span id="summary_member_share" class="block text-slate-300 font-semibold">Base Kist: ₹10,000 / member</span>
                    </div>
                </div>

                <!-- Interactive Preview Table -->
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
                            <!-- Populated dynamically via JS -->
                        </tbody>
                        <tfoot id="previewTableFooter" class="bg-slate-950/90 text-xs font-bold text-white border-t-2 border-slate-700">
                            <!-- Populated dynamically via JS -->
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
    function formatINR(val) {
        return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);
    }

    function setPresetAmount(amt) {
        document.getElementById('input_total_amount').value = amt;
        updatePreview();
    }

    let currentM = 20;

    function updateSpecialMonthOptions(m) {
        const select = document.getElementById('input_special_month_index');
        const selectedVal = select.value ? parseInt(select.value) : (m - 1);
        select.innerHTML = '';

        const defaultN = m - 1; // Month 2

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

        // Update amount text & base share
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

    function getMaxMembers() {
        return parseInt(document.getElementById('input_total_members').value) || 20;
    }

    function updateMemberSelectionUI() {
        const max = getMaxMembers();
        const checkedBoxes = document.querySelectorAll('.member-checkbox:checked');
        const count = checkedBoxes.length;

        const countText = document.getElementById('memberCountText');
        const maxText = document.getElementById('memberMaxText');
        const btnAutoCount = document.getElementById('btnAutoCount');

        if (countText) countText.innerText = count;
        if (maxText) maxText.innerText = max;
        if (btnAutoCount) btnAutoCount.innerText = max;
    }

    function autoSelectMembers() {
        const max = getMaxMembers();
        const checkboxes = document.querySelectorAll('.member-checkbox');
        checkboxes.forEach((cb, idx) => {
            cb.checked = (idx < max);
        });
        const warning = document.getElementById('memberLimitWarning');
        if (warning) warning.classList.add('hidden');
        updateMemberSelectionUI();
    }

    function clearAllMembers() {
        const checkboxes = document.querySelectorAll('.member-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        const warning = document.getElementById('memberLimitWarning');
        if (warning) warning.classList.add('hidden');
        updateMemberSelectionUI();
    }

    // Attach event listeners for real-time calculation preview
    ['input_total_amount', 'input_total_members', 'input_deduction_rate', 'input_special_month_index'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                updatePreview();
                updateMemberSelectionUI();
            });
            el.addEventListener('change', () => {
                updatePreview();
                updateMemberSelectionUI();
            });
        }
    });

    // Initial setup
    document.addEventListener('DOMContentLoaded', () => {
        updateSpecialMonthOptions(20);
        updatePreview();

        // Checkbox listeners to enforce maximum member count M
        document.querySelectorAll('.member-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
                const max = getMaxMembers();
                const checkedBoxes = document.querySelectorAll('.member-checkbox:checked');
                const warning = document.getElementById('memberLimitWarning');
                const warningText = document.getElementById('memberLimitWarningText');

                if (checkedBoxes.length > max) {
                    this.checked = false;
                    if (warning && warningText) {
                        warningText.innerText = `You can only select up to ${max} members for this ${max}-month committee!`;
                        warning.classList.remove('hidden');
                    }
                } else {
                    if (warning) warning.classList.add('hidden');
                }
                updateMemberSelectionUI();
            });
        });

        // Auto select first M members on initial load
        autoSelectMembers();
    });
</script>
@endsection
