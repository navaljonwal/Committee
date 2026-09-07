<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\CommitteeMemberPayment;
use App\Models\CommitteeSchedule;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarkAllPaidTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_mark_all_schedule_payments_as_paid()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $committee = Committee::create([
            'name' => 'Bulk Payment Committee',
            'total_amount' => 100000,
            'total_members' => 3,
            'deduction_rate' => 1.5,
            'special_month_index' => 3,
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $m1 = Member::create(['name' => 'Member A', 'phone' => '1000000001']);
        $m2 = Member::create(['name' => 'Member B', 'phone' => '1000000002']);
        $committee->members()->attach([$m1->id, $m2->id]);
        $committee->generateSchedules();

        $schedule = $committee->schedules()->first();

        // Initial state: payments are pending
        $pendingCount = CommitteeMemberPayment::where('schedule_id', $schedule->id)->where('payment_status', 'pending')->count();
        $this->assertEquals(2, $pendingCount);

        // Act: POST mark all paid
        $response = $this->actingAs($admin)->post(route('schedules.payments.markAllPaid', $schedule->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Assert all payments are now paid with today's date
        $paidCount = CommitteeMemberPayment::where('schedule_id', $schedule->id)->where('payment_status', 'paid')->count();
        $this->assertEquals(2, $paidCount);
    }
}
