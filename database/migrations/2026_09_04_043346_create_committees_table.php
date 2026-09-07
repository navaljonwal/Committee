<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('committees', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->decimal('total_amount', 15, 2);
            $table->integer('total_members')->default(20);
            $table->decimal('deduction_rate', 5, 2)->default(1.50);
            $table->integer('special_month_index')->default(19);
            $table->date('start_date');
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('committees');
    }
};
