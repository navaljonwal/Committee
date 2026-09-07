<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            $table->decimal('penalty_amount', 15, 2)->default(0.00)->after('amount_paid');
            $table->string('remarks', 255)->nullable()->after('penalty_amount');
        });
    }

    public function down(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            $table->dropColumn(['penalty_amount', 'remarks']);
        });
    }
};
