<?php

namespace App\Http\Controllers;

use App\Models\Committee;
use Illuminate\Http\Response;

class ExportController extends Controller
{
    /**
     * Export committee schedule to CSV file.
     */
    public function exportCsv($id)
    {
        $committee = Committee::with('schedules.winner')->findOrFail($id);
        $schedules = $committee->schedules;

        $filename = "Committee_" . str_replace(' ', '_', $committee->name) . "_Schedule.csv";

        $headers = [
            "Content-type" => "text/csv; charset=utf-8",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($committee, $schedules) {
            $file = fopen('php://output', 'w');

            // Header Info
            fputcsv($file, ["Committee Name:", $committee->name]);
            fputcsv($file, ["Chit Amount (V):", "INR " . number_format($committee->total_amount, 2)]);
            fputcsv($file, ["Total Members (M):", $committee->total_members]);
            fputcsv($file, ["Deduction Rate (%):", $committee->deduction_rate . "%"]);
            fputcsv($file, ["Start Date:", $committee->start_date ? $committee->start_date->format('Y-m-d') : 'N/A']);
            fputcsv($file, ["End Date (Maturity):", $committee->end_date ? $committee->end_date->format('Y-m-d') : 'N/A']);
            fputcsv($file, []);

            // Table Headers
            fputcsv($file, [
                'Month / Kisht No.',
                'Formula Multiplier (N)',
                'Total Deduction (INR)',
                'Winner Payout Amount (INR)',
                'Monthly Installment (Kist) Per Member (INR)',
                'Status / Winner',
                'Estimated Draw Date'
            ]);

            $totalDeductions = 0;
            $totalNetPayout = 0;
            $totalKist = 0;

            foreach ($schedules as $s) {
                $isSpecial = ($s->index_n === (int)$committee->special_month_index);
                $tag = "";
                if ($s->is_custom_bid) {
                    $tag = " [AUCTION BID DEDUCTION]";
                } elseif ($isSpecial) {
                    $tag = " [ZERO DEDUCTION / SPECIAL MONTH]";
                }

                $totalDeductions += $s->deduction_amount;
                $totalNetPayout += $s->net_payout;
                $totalKist += $s->installment_per_member;

                fputcsv($file, [
                    'Month ' . $s->month_no . $tag,
                    $s->index_n,
                    number_format($s->deduction_amount, 2, '.', ''),
                    number_format($s->net_payout, 2, '.', ''),
                    number_format($s->installment_per_member, 2, '.', ''),
                    $s->winner ? $s->winner->name : 'Pending Draw',
                    $s->draw_date ? $s->draw_date->format('Y-m-d') : 'N/A'
                ]);
            }

            // Grand Totals Row
            fputcsv($file, []);
            fputcsv($file, [
                'GRAND TOTALS',
                '-',
                number_format($totalDeductions, 2, '.', ''),
                number_format($totalNetPayout, 2, '.', ''),
                number_format($totalKist, 2, '.', ''),
                'Total Member Contribution: INR ' . number_format($totalKist, 2),
                '-'
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Printable A4 View optimized layout.
     */
    public function printView($id)
    {
        $committee = Committee::with(['schedules.winner', 'members'])->findOrFail($id);
        $schedules = $committee->schedules;

        $grandTotalDeductions = $schedules->sum('deduction_amount');
        $grandTotalNetPayout = $schedules->sum('net_payout');
        $grandTotalKistPerMember = $schedules->sum('installment_per_member');

        return view('committees.print', compact(
            'committee',
            'schedules',
            'grandTotalDeductions',
            'grandTotalNetPayout',
            'grandTotalKistPerMember'
        ));
    }
}
