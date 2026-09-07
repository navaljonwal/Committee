<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('committee_schedules', function (Blueprint $table) {
            $table->string('payout_status', 20)->default('unpaid')->after('draw_date');
            $table->date('payout_date')->nullable()->after('payout_status');
            $table->string('payout_mode', 20)->nullable()->after('payout_date'); // 'cash', 'upi', 'split'
            $table->decimal('payout_upi_amount', 15, 2)->default(0.00)->after('payout_mode');
            $table->string('payout_upi_ref', 255)->nullable()->after('payout_upi_amount');
            $table->decimal('payout_cash_amount', 15, 2)->default(0.00)->after('payout_upi_ref');
            $table->json('payout_cash_notes')->nullable()->after('payout_cash_amount');
            $table->string('payout_remarks', 255)->nullable()->after('payout_cash_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('committee_schedules', function (Blueprint $table) {
            $table->dropColumn([
                'payout_status',
                'payout_date',
                'payout_mode',
                'payout_upi_amount',
                'payout_upi_ref',
                'payout_cash_amount',
                'payout_cash_notes',
                'payout_remarks',
            ]);
        });
    }
};
