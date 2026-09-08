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
        try {
            Schema::table('committee_member_payments', function (Blueprint $table) {
                $table->index(['schedule_id', 'payment_status'], 'idx_cmp_schedule_status');
                $table->index(['schedule_id', 'member_id', 'seat_no'], 'idx_cmp_schedule_member_seat');
            });
        } catch (\Throwable $e) {}

        try {
            Schema::table('member_bids', function (Blueprint $table) {
                $table->index(['schedule_id', 'bid_amount'], 'idx_mb_schedule_bid');
            });
        } catch (\Throwable $e) {}

        try {
            Schema::table('committee_schedules', function (Blueprint $table) {
                $table->index(['committee_id', 'month_no'], 'idx_cs_committee_month');
            });
        } catch (\Throwable $e) {}
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            $table->dropIndex('idx_cmp_schedule_status');
            $table->dropIndex('idx_cmp_schedule_member_seat');
        });

        Schema::table('member_bids', function (Blueprint $table) {
            $table->dropIndex('idx_mb_schedule_bid');
        });

        Schema::table('committee_schedules', function (Blueprint $table) {
            $table->dropIndex('idx_cs_committee_month');
        });
    }
};
