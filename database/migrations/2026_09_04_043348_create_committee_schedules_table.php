<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('committee_id')->constrained('committees')->onDelete('cascade');
            $table->integer('month_no');
            $table->integer('index_n');
            $table->decimal('deduction_amount', 15, 2);
            $table->decimal('net_payout', 15, 2);
            $table->decimal('installment_per_member', 15, 2);
            $table->foreignId('member_id')->nullable()->constrained('members')->onDelete('set null');
            $table->date('draw_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committee_schedules');
    }
};
