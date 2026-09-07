<!-- Winner Payout Disbursement Modal -->
<div id="payoutModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
    <div class="glass-card w-full max-w-2xl p-6 rounded-2xl border border-slate-800 space-y-5 my-8">
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                    <i class="fa-solid fa-hand-holding-dollar"></i>
                </div>
                <div>
                    <h3 class="text-base font-bold text-white">Winner Payout Disbursement</h3>
                    <div class="flex items-center space-x-2 text-xs text-slate-400">
                        <span>Month <span id="payoutModalMonthNo" class="font-bold text-emerald-400">1</span></span>
                        <span>•</span>
                        <span>Winner: <span id="payoutModalWinnerName" class="font-bold text-white">Member Name</span></span>
                    </div>
                </div>
            </div>
            <button type="button" onclick="closePayoutModal()" class="text-slate-400 hover:text-white">
                <i class="fa-solid fa-xmark text-lg"></i>
            </button>
        </div>

        <!-- Net Payout Amount Card -->
        <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Required Net Payout</span>
                <span id="payoutModalNetPayout" class="text-xl font-black font-mono text-emerald-400">₹0.00</span>
            </div>
            <div class="text-right">
                <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Disbursed Calculated</span>
                <span id="payoutModalTotalDisbursed" class="text-xl font-black font-mono text-amber-300">₹0.00</span>
            </div>
        </div>

        <!-- Form -->
        <form id="payoutForm" action="" method="POST" data-ajax="true" class="space-y-5">
            @csrf

            <!-- Status, Date, Mode Row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <!-- Payout Status -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Payout Status</label>
                    <select name="payout_status" id="payout_input_status" class="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold focus:outline-none">
                        <option value="unpaid">UNPAID / PENDING</option>
                        <option value="paid">PAID / DISBURSED</option>
                    </select>
                </div>

                <!-- Payout Date -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Disbursement Date</label>
                    <input type="date" name="payout_date" id="payout_input_date" value="{{ date('Y-m-d') }}"
                           class="w-full px-3 py-2 rounded-xl glass-input text-xs text-white focus:outline-none">
                </div>

                <!-- Payout Mode -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Payment Method</label>
                    <select name="payout_mode" id="payout_input_mode" onchange="togglePayoutModeSections()" class="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold text-amber-300 focus:outline-none">
                        <option value="cash">CASH ONLY</option>
                        <option value="upi">UPI / ONLINE ONLY</option>
                        <option value="split">SPLIT (CASH + UPI)</option>
                    </select>
                </div>
            </div>

            <!-- UPI Details Section -->
            <div id="upiSection" class="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div class="flex items-center space-x-2 text-xs font-bold text-blue-400">
                    <i class="fa-solid fa-mobile-screen-button"></i>
                    <span>UPI / Online Payment Details</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[11px] font-semibold text-slate-300 mb-1">UPI Amount (₹)</label>
                        <input type="number" name="payout_upi_amount" id="payout_input_upi_amount" step="0.01" min="0" placeholder="e.g. 50000" oninput="calculatePayoutTotals()"
                               class="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono font-bold text-blue-300 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Transaction Ref / Payment No. (UTR / Txn ID)</label>
                        <input type="text" name="payout_upi_ref" id="payout_input_upi_ref" placeholder="e.g. 987654321012"
                               class="w-full px-3 py-2 rounded-xl glass-input text-xs text-white focus:outline-none">
                    </div>
                </div>
            </div>

            <!-- Cash & Currency Note Breakdown Section -->
            <div id="cashSection" class="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 text-xs font-bold text-emerald-400">
                        <i class="fa-solid fa-money-bill-wave"></i>
                        <span>Cash & Currency Note Denominations Counter</span>
                    </div>
                    <span class="text-xs font-mono font-bold text-emerald-300" id="cashCalculatedBadge">Total Cash: ₹0.00</span>
                </div>

                <p class="text-[11px] text-slate-400">Enter the count of each currency note handed over to the winner:</p>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <!-- 500 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹500 Notes</span>
                            <span id="subtotal_500" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_500" id="note_500" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 200 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹200 Notes</span>
                            <span id="subtotal_200" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_200" id="note_200" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 100 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹100 Notes</span>
                            <span id="subtotal_100" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_100" id="note_100" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 50 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹50 Notes</span>
                            <span id="subtotal_50" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_50" id="note_50" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 20 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹20 Notes</span>
                            <span id="subtotal_20" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_20" id="note_20" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 10 Note -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹10 Notes</span>
                            <span id="subtotal_10" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_10" id="note_10" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>

                    <!-- 5 Note/Coin -->
                    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 col-span-2 sm:col-span-2">
                        <div class="flex items-center justify-between text-slate-300 font-bold">
                            <span>₹5 Coins / Notes</span>
                            <span id="subtotal_5" class="text-[10px] font-mono text-emerald-400">₹0</span>
                        </div>
                        <input type="number" name="note_5" id="note_5" min="0" placeholder="0" oninput="calculatePayoutTotals()"
                               class="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs font-mono text-white text-center focus:outline-none">
                    </div>
                </div>

                <input type="hidden" name="payout_cash_amount" id="payout_input_cash_amount" value="0">
            </div>

            <!-- Remarks -->
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-300">Remarks / Disbursement Notes (Optional)</label>
                <input type="text" name="payout_remarks" id="payout_input_remarks" placeholder="e.g. Handed over cash and transferred remaining via PhonePe"
                       class="w-full px-3 py-2 rounded-xl glass-input text-xs text-white focus:outline-none">
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button type="button" onclick="closePayoutModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">Save Disbursement Record</button>
            </div>
        </form>
    </div>
</div>

<script>
    let currentRequiredNetPayout = 0;

    function openPayoutModalFromBtn(btn) {
        const ds = btn.dataset;
        let notes = {};
        try {
            notes = JSON.parse(ds.cashNotes || '{}');
        } catch (e) {
            notes = {};
        }

        openPayoutModal(
            ds.scheduleId,
            ds.monthNo,
            ds.netPayout,
            ds.winnerName,
            ds.payoutStatus,
            ds.payoutDate,
            ds.payoutMode,
            ds.upiAmount,
            ds.upiRef,
            ds.cashAmount,
            notes,
            ds.remarks
        );
    }

    function openPayoutModal(scheduleId, monthNo, netPayout, winnerName, payoutStatus, payoutDate, payoutMode, upiAmount, upiRef, cashAmount, cashNotes, remarks) {
        currentRequiredNetPayout = parseFloat(netPayout) || 0;
        const form = document.getElementById('payoutForm');
        form.action = `/schedules/${scheduleId}/payout`;

        document.getElementById('payoutModalMonthNo').innerText = monthNo;
        document.getElementById('payoutModalWinnerName').innerText = winnerName || 'Unassigned';
        document.getElementById('payoutModalNetPayout').innerText = '₹' + currentRequiredNetPayout.toLocaleString('en-IN', {minimumFractionDigits: 2});

        document.getElementById('payout_input_status').value = payoutStatus || 'unpaid';
        document.getElementById('payout_input_date').value = payoutDate || new Date().toISOString().split('T')[0];
        document.getElementById('payout_input_mode').value = payoutMode || 'cash';
        document.getElementById('payout_input_upi_amount').value = upiAmount || '';
        document.getElementById('payout_input_upi_ref').value = upiRef || '';
        document.getElementById('payout_input_remarks').value = remarks || '';

        // Notes count setup
        const notesObj = cashNotes || {};
        document.getElementById('note_500').value = notesObj['500'] || '';
        document.getElementById('note_200').value = notesObj['200'] || '';
        document.getElementById('note_100').value = notesObj['100'] || '';
        document.getElementById('note_50').value = notesObj['50'] || '';
        document.getElementById('note_20').value = notesObj['20'] || '';
        document.getElementById('note_10').value = notesObj['10'] || '';
        document.getElementById('note_5').value = notesObj['5'] || '';

        togglePayoutModeSections();
        calculatePayoutTotals();

        document.getElementById('payoutModal').classList.remove('hidden');
    }

    function closePayoutModal() {
        document.getElementById('payoutModal').classList.add('hidden');
    }

    function togglePayoutModeSections() {
        const mode = document.getElementById('payout_input_mode').value;
        const upiSec = document.getElementById('upiSection');
        const cashSec = document.getElementById('cashSection');

        if (mode === 'upi') {
            upiSec.classList.remove('hidden');
            cashSec.classList.add('hidden');
        } else if (mode === 'cash') {
            upiSec.classList.add('hidden');
            cashSec.classList.remove('hidden');
        } else { // split
            upiSec.classList.remove('hidden');
            cashSec.classList.remove('hidden');
        }
        calculatePayoutTotals();
    }

    function calculatePayoutTotals() {
        const mode = document.getElementById('payout_input_mode').value;

        // Cash note calculation
        const c500 = (parseInt(document.getElementById('note_500').value) || 0) * 500;
        const c200 = (parseInt(document.getElementById('note_200').value) || 0) * 200;
        const c100 = (parseInt(document.getElementById('note_100').value) || 0) * 100;
        const c50  = (parseInt(document.getElementById('note_50').value) || 0) * 50;
        const c20  = (parseInt(document.getElementById('note_20').value) || 0) * 20;
        const c10  = (parseInt(document.getElementById('note_10').value) || 0) * 10;
        const c5   = (parseInt(document.getElementById('note_5').value) || 0) * 5;

        document.getElementById('subtotal_500').innerText = '₹' + c500.toLocaleString('en-IN');
        document.getElementById('subtotal_200').innerText = '₹' + c200.toLocaleString('en-IN');
        document.getElementById('subtotal_100').innerText = '₹' + c100.toLocaleString('en-IN');
        document.getElementById('subtotal_50').innerText = '₹' + c50.toLocaleString('en-IN');
        document.getElementById('subtotal_20').innerText = '₹' + c20.toLocaleString('en-IN');
        document.getElementById('subtotal_10').innerText = '₹' + c10.toLocaleString('en-IN');
        document.getElementById('subtotal_5').innerText = '₹' + c5.toLocaleString('en-IN');

        const totalCashSum = c500 + c200 + c100 + c50 + c20 + c10 + c5;
        document.getElementById('payout_input_cash_amount').value = totalCashSum;
        document.getElementById('cashCalculatedBadge').innerText = 'Total Cash: ₹' + totalCashSum.toLocaleString('en-IN', {minimumFractionDigits: 2});

        // UPI amount calculation
        const upiVal = parseFloat(document.getElementById('payout_input_upi_amount').value) || 0;

        let totalDisbursed = 0;
        if (mode === 'upi') {
            totalDisbursed = upiVal;
        } else if (mode === 'cash') {
            totalDisbursed = totalCashSum;
        } else {
            totalDisbursed = totalCashSum + upiVal;
        }

        const totalDisbursedEl = document.getElementById('payoutModalTotalDisbursed');
        totalDisbursedEl.innerText = '₹' + totalDisbursed.toLocaleString('en-IN', {minimumFractionDigits: 2});

        if (Math.abs(totalDisbursed - currentRequiredNetPayout) < 0.01 && totalDisbursed > 0) {
            totalDisbursedEl.className = 'text-xl font-black font-mono text-emerald-400';
        } else if (totalDisbursed > 0) {
            totalDisbursedEl.className = 'text-xl font-black font-mono text-amber-300';
        } else {
            totalDisbursedEl.className = 'text-xl font-black font-mono text-slate-400';
        }
    }
</script>
