<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\CommitteeSchedule;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberPortalDrawDateTest extends TestCase
{
    use RefreshDatabase;

    public function test_bidding_is_only_allowed_on_exact_draw_date()
    {
        $todayStr = now()->toDateString();

        $committee = Committee::create([
            'name' => 'Date Restricted Kameti',
            'total_amount' => 100000,
            'total_members' => 3,
            'deduction_rate' => 2.0,
            'special_month_index' => 3,
            'start_date' => $todayStr,
            'status' => 'active',
        ]);

        $member = Member::create(['name' => 'Member Test', 'phone' => '9999999999']);
        $user = User::factory()->create(['role' => 'member', 'member_id' => $member->id]);
        $committee->members()->attach($member->id);

        // Schedule 1: Today (draw_date = today)
        $schedule1 = CommitteeSchedule::create([
            'committee_id' => $committee->id,
            'month_no' => 1,
            'index_n' => 3,
            'deduction_amount' => 6000,
            'net_payout' => 94000,
            'installment_per_member' => 31333.33,
            'draw_date' => now()->toDateString(),
        ]);

        // Schedule 2: Future date (draw_date = tomorrow)
        $scheduleFuture = CommitteeSchedule::create([
            'committee_id' => $committee->id,
            'month_no' => 2,
            'index_n' => 2,
            'deduction_amount' => 4000,
            'net_payout' => 96000,
            'installment_per_member' => 32000,
            'draw_date' => now()->addDay()->toDateString(),
        ]);

        // Schedule 3: Past date (draw_date = yesterday)
        $schedulePast = CommitteeSchedule::create([
            'committee_id' => $committee->id,
            'month_no' => 3,
            'index_n' => 1,
            'deduction_amount' => 2000,
            'net_payout' => 98000,
            'installment_per_member' => 32666.67,
            'draw_date' => now()->subDay()->toDateString(),
        ]);

        // Test 1: Bidding on FUTURE draw date fails
        $resFuture = $this->actingAs($user)->post(route('member.bids.submit', $scheduleFuture->id), [
            'bid_amount' => 4000,
        ]);
        $resFuture->assertSessionHas('error');

        // Test 2: Bidding on PAST draw date fails
        $resPast = $this->actingAs($user)->post(route('member.bids.submit', $schedulePast->id), [
            'bid_amount' => 2000,
        ]);
        $resPast->assertSessionHas('error');

        // Test 3: Bidding on TODAY'S draw date succeeds
        $resToday = $this->actingAs($user)->post(route('member.bids.submit', $schedule1->id), [
            'bid_amount' => 6000,
        ]);
        $resToday->assertSessionHas('success');
    }
}
