<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print Schedule - {{ $committee->name }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @media print {
            @page { size: A4 portrait; margin: 12mm; }
            body { background: white !important; color: black !important; font-size: 11px; }
            .no-print { display: none !important; }
        }
        body { font-family: sans-serif; background: #f8fafc; color: #0f172a; }
    </style>
</head>
<body class="p-8 max-w-4xl mx-auto bg-white min-h-screen">

    <!-- Top Action Bar for Screen view -->
    <div class="no-print mb-6 flex items-center justify-between p-4 bg-slate-100 rounded-xl border border-slate-300">
        <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-800 text-sm">A4 Print Preview Document</span>
        </div>
        <div class="flex items-center space-x-3">
            <button onclick="window.print()" class="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow">
                <i class="fa-solid fa-print mr-1"></i> Print Now (Ctrl+P)
            </button>
            <button onclick="window.close()" class="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold">
                Close
            </button>
        </div>
    </div>

    <!-- Printable Header -->
    <div class="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight uppercase">{{ $committee->name }}</h1>
            <p class="text-xs text-slate-600 font-semibold mt-1">Official Chit Fund (BC) Monthly Payout & Installment Schedule</p>
        </div>
        <div class="text-right text-xs">
            <div class="font-bold text-slate-900">Chit Value: ₹{{ number_format($committee->total_amount, 2) }}</div>
            <div class="text-slate-600">Total Members: {{ $committee->total_members }} ({{ $committee->total_members }} Months)</div>
            <div class="text-slate-600">Monthly Rate: {{ $committee->deduction_rate }}%</div>
            <div class="text-slate-800 font-bold mt-1">Start Date: {{ $committee->start_date ? $committee->start_date->format('d M Y') : 'N/A' }}</div>
            <div class="text-emerald-700 font-bold">End Date: {{ $committee->end_date ? $committee->end_date->format('d M Y') : 'N/A' }}</div>
            <div class="text-slate-500 text-[10px] mt-1">Printed on: {{ date('d M Y, h:i A') }}</div>
        </div>
    </div>

    <!-- Table -->
    <table class="w-full text-left border-collapse border border-slate-400 text-xs">
        <thead>
            <tr class="bg-slate-200 text-slate-900 uppercase font-extrabold text-[10px] border-b border-slate-400">
                <th class="p-2 border border-slate-400 text-center">Kisht No.</th>
                <th class="p-2 border border-slate-400 text-center">Draw Date</th>
                <th class="p-2 border border-slate-400 text-right">Deduction Amount</th>
                <th class="p-2 border border-slate-400 text-right">Winner Net Payout</th>
                <th class="p-2 border border-slate-400 text-right">Kist / Member</th>
                <th class="p-2 border border-slate-400">Winner Member</th>
            </tr>
        </thead>
        <tbody>
            @foreach($schedules as $s)
                @php
                    $isSpecial = ($s->index_n === (int)$committee->special_month_index);
                @endphp
                <tr class="{{ $isSpecial ? 'bg-amber-100 font-bold' : ($loop->even ? 'bg-slate-50' : 'bg-white') }}">
                    <td class="p-2 border border-slate-400 text-center font-bold">
                        Month {{ $s->month_no }}
                        @if($s->is_custom_bid)
                            <span class="block text-[9px] text-amber-900 font-extrabold uppercase">(Auction Bid)</span>
                        @elseif($isSpecial)
                            <span class="block text-[9px] text-amber-800 font-extrabold uppercase">(0% Deduction Slot)</span>
                        @endif
                    </td>
                    <td class="p-2 border border-slate-400 text-center font-mono">
                        {{ $s->draw_date ? $s->draw_date->format('d M Y') : '-' }}
                    </td>
                    <td class="p-2 border border-slate-400 text-right font-mono">
                        @if($isSpecial && !$s->is_custom_bid)
                            <span class="text-amber-800 font-black">₹0.00 (Zero Round)</span>
                        @else
                            ₹{{ number_format($s->deduction_amount, 2) }}
                        @endif
                    </td>
                    <td class="p-2 border border-slate-400 text-right font-mono font-bold text-emerald-800">
                        ₹{{ number_format($s->net_payout, 2) }}
                    </td>
                    <td class="p-2 border border-slate-400 text-right font-mono font-bold">
                        ₹{{ number_format($s->installment_per_member, 2) }}
                    </td>
                    <td class="p-2 border border-slate-400">
                        <span class="font-semibold">{{ $s->winner ? $s->winner->name : 'Pending Draw' }}</span>
                        @if($s->winner && $s->payout_status === 'paid')
                            <span class="block text-[9px] text-emerald-700 font-bold">[Paid via {{ strtoupper($s->payout_mode ?? 'cash') }}]</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="bg-slate-900 text-white font-bold text-xs">
                <td class="p-2.5 border border-slate-900 uppercase">Grand Totals</td>
                <td class="p-2.5 border border-slate-900 text-center font-mono text-[10px]">{{ $committee->total_members }} Draws</td>
                <td class="p-2.5 border border-slate-900 text-right font-mono">₹{{ number_format($grandTotalDeductions, 2) }}</td>
                <td class="p-2.5 border border-slate-900 text-right font-mono text-emerald-400">₹{{ number_format($grandTotalNetPayout, 2) }}</td>
                <td class="p-2.5 border border-slate-900 text-right font-mono">₹{{ number_format($grandTotalKistPerMember, 2) }}</td>
                <td class="p-2.5 border border-slate-900 text-[10px] text-slate-300">Total Per Member</td>
            </tr>
        </tfoot>
    </table>

    <!-- Printable Signatures Footer -->
    <div class="mt-12 grid grid-cols-2 gap-8 text-xs pt-8 border-t border-slate-300">
        <div>
            <div class="font-bold text-slate-800">Organizer Signature:</div>
            <div class="h-12 border-b border-dashed border-slate-400 w-48 mt-2"></div>
        </div>
        <div class="text-right">
            <div class="font-bold text-slate-800">Committee Stamp:</div>
            <div class="h-12 border-b border-dashed border-slate-400 w-48 ml-auto mt-2"></div>
        </div>
    </div>

    <script>
        // Auto trigger print on page load if opened directly for printing
        window.addEventListener('load', () => {
            // window.print();
        });
    </script>
</body>
</html>
