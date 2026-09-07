<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\CommitteeMemberPayment;
use App\Models\CommitteeSchedule;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommitteeMemberUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_updating_committee_members_preserves_old_schedule_data_and_payment_records()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        // Create committee
        $committee = Committee::create([
            'name' => 'Test Kameti',
            'total_amount' => 100000,
            'total_members' => 5,
            'deduction_rate' => 2.0,
            'special_month_index' => 4,
            'start_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $m1 = Member::create(['name' => 'Member One', 'phone' => '1111111111']);
        $m2 = Member::create(['name' => 'Member Two', 'phone' => '2222222222']);
        $m3 = Member::create(['name' => 'Member Three', 'phone' => '3333333333']);

        $committee->members()->sync([$m1->id, $m2->id]);
        $committee->generateSchedules();

        $schedule1 = $committee->schedules()->where('month_no', 1)->first();
        
        // Mark winner & custom auction bid on schedule 1
        $schedule1->update([
            'member_id' => $m1->id,
            'custom_deduction_amount' => 15000,
            'deduction_amount' => 15000,
            'is_custom_bid' => true,
            'payout_status' => 'paid',
            'payout_mode' => 'cash',
        ]);

        // Mark m1's payment as paid
        $p1 = CommitteeMemberPayment::where('schedule_id', $schedule1->id)->where('member_id', $m1->id)->first();
        $p1->update(['payment_status' => 'paid', 'payment_date' => now()->toDateString()]);

        // Act: Update committee members (Add m3)
        $response = $this->actingAs($admin)
            ->post(route('committees.updateMembers', $committee->id), [
                'members' => [$m1->id, $m2->id, $m3->id],
            ]);

        $response->assertRedirect();

        // Assert Schedule 1 custom bid, winner, and payout status are unchanged!
        $schedule1->refresh();
        $this->assertEquals($m1->id, $schedule1->member_id);
        $this->assertTrue($schedule1->is_custom_bid);
        $this->assertEquals(15000, (float)$schedule1->custom_deduction_amount);
        $this->assertEquals('paid', $schedule1->payout_status);

        // Assert m1's payment status is still 'paid'
        $p1->refresh();
        $this->assertEquals('paid', $p1->payment_status);

        // Assert m3 now has a pending payment record for schedule 1
        $p3 = CommitteeMemberPayment::where('schedule_id', $schedule1->id)->where('member_id', $m3->id)->first();
        $this->assertNotNull($p3);
        $this->assertEquals('pending', $p3->payment_status);
    }
}
