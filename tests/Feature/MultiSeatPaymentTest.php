<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\CommitteeMemberPayment;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiSeatPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_multi_seat_member_has_multiple_payment_entries_per_schedule()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $committee = Committee::create([
            'name' => 'Multi-Seat Payment Committee',
            'total_amount' => 100000,
            'total_members' => 3,
            'deduction_rate' => 1.5,
            'special_month_index' => 3,
            'start_date' => '2026-10-01',
            'status' => 'active',
        ]);

        $m1 = Member::create(['name' => 'Rahul Sharma', 'phone' => '9876543210']);
        $m2 = Member::create(['name' => 'Sita Ram', 'phone' => '9876543211']);

        // Attach Rahul with 2 seats, Sita with 1 seat
        $committee->members()->attach([
            $m1->id => ['seats' => 2],
            $m2->id => ['seats' => 1],
        ]);

        $committee->generateSchedules();

        $schedule1 = $committee->schedules()->where('month_no', 1)->first();

        // Total payment records for Month 1 should be 3 (2 for Rahul + 1 for Sita)
        $payments = CommitteeMemberPayment::where('schedule_id', $schedule1->id)->get();
        $this->assertCount(3, $payments);

        $rahulPayments = $payments->where('member_id', $m1->id);
        $this->assertCount(2, $rahulPayments);

        $seatNumbers = $rahulPayments->pluck('seat_no')->toArray();
        $this->assertEqualsCanonicalizing([1, 2], $seatNumbers);

        // Toggle payment status of Rahul Seat 1
        $seat1Payment = $rahulPayments->where('seat_no', 1)->first();
        $responseToggle = $this->actingAs($admin)->post(route('payments.toggle', $seat1Payment->id));
        $responseToggle->assertSessionHas('success');

        $seat1Payment->refresh();
        $this->assertEquals('paid', $seat1Payment->payment_status);

        // Rahul Seat 2 should remain pending
        $seat2Payment = $rahulPayments->where('seat_no', 2)->first();
        $seat2Payment->refresh();
        $this->assertEquals('pending', $seat2Payment->payment_status);
    }
}
