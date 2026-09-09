<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Deduplicate any potential duplicate records before creating the unique constraint
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement("
                DELETE FROM committee_member_payments
                WHERE id IN (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY schedule_id, member_id, seat_no
                                   ORDER BY CASE WHEN payment_status = 'paid' THEN 0 ELSE 1 END, id ASC
                               ) as rnum
                        FROM committee_member_payments
                    ) t
                    WHERE t.rnum > 1
                )
            ");
        } else {
            // MySQL / SQLite deduplication
            $duplicates = DB::table('committee_member_payments')
                ->select('schedule_id', 'member_id', 'seat_no')
                ->groupBy('schedule_id', 'member_id', 'seat_no')
                ->havingRaw('COUNT(*) > 1')
                ->get();

            foreach ($duplicates as $dup) {
                $records = DB::table('committee_member_payments')
                    ->where('schedule_id', $dup->schedule_id)
                    ->where('member_id', $dup->member_id)
                    ->where('seat_no', $dup->seat_no)
                    ->orderByRaw("CASE WHEN payment_status = 'paid' THEN 0 ELSE 1 END, id ASC")
                    ->get();

                $idsToDelete = $records->slice(1)->pluck('id')->toArray();
                if (!empty($idsToDelete)) {
                    DB::table('committee_member_payments')->whereIn('id', $idsToDelete)->delete();
                }
            }
        }

        // 2. Drop existing non-unique index if present, and add unique constraint
        Schema::table('committee_member_payments', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_cmp_schedule_member_seat');
            } catch (\Throwable $e) {}

            try {
                $table->unique(['schedule_id', 'member_id', 'seat_no'], 'uniq_cmp_schedule_member_seat');
            } catch (\Throwable $e) {}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            try {
                $table->dropUnique('uniq_cmp_schedule_member_seat');
            } catch (\Throwable $e) {}

            try {
                $table->index(['schedule_id', 'member_id', 'seat_no'], 'idx_cmp_schedule_member_seat');
            } catch (\Throwable $e) {}
        });
    }
};
