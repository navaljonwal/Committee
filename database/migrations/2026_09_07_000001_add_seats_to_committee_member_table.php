<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('committee_member', function (Blueprint $table) {
            $table->integer('seats')->default(1)->after('member_id');
        });
    }

    public function down(): void
    {
        Schema::table('committee_member', function (Blueprint $table) {
            $table->dropColumn('seats');
        });
    }
};
