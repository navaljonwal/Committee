<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            $table->integer('seat_no')->default(1)->after('member_id');
        });
    }

    public function down(): void
    {
        Schema::table('committee_member_payments', function (Blueprint $table) {
            $table->dropColumn('seat_no');
        });
    }
};
