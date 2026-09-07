<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\Member;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommitteeEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_edit_committee()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $committee = Committee::create([
            'name' => 'Old Name Committee',
            'total_amount' => 100000,
            'total_members' => 5,
            'deduction_rate' => 1.5,
            'special_month_index' => 4,
            'start_date' => '2026-10-01',
            'status' => 'active',
        ]);
        $committee->generateSchedules();

        // 1. Test GET Edit Page
        $responseEdit = $this->actingAs($admin)->get(route('committees.edit', $committee->id));
        $responseEdit->assertStatus(200);
        $responseEdit->assertSee('Old Name Committee');

        // 2. Test PUT Update Committee
        $responseUpdate = $this->actingAs($admin)->put(route('committees.update', $committee->id), [
            'name' => 'Updated Super Committee',
            'total_amount' => 200000,
            'total_members' => 5,
            'deduction_rate' => 2.0,
            'special_month_index' => 4,
            'start_date' => '2026-11-01',
            'status' => 'active',
        ]);

        $responseUpdate->assertRedirect(route('committees.show', $committee));

        $committee->refresh();
        $this->assertEquals('Updated Super Committee', $committee->name);
        $this->assertEquals(200000, (float)$committee->total_amount);

        // Assert schedule draw date updated to 2026-11-01 for Month 1
        $schedule1 = $committee->schedules()->where('month_no', 1)->first();
        $this->assertEquals('2026-11-01', $schedule1->draw_date->format('Y-m-d'));
    }

    public function test_editing_committee_preserves_assigned_members_and_seats()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $committee = Committee::create([
            'name' => 'Member Preservation Committee',
            'total_amount' => 100000,
            'total_members' => 3,
            'deduction_rate' => 1.5,
            'special_month_index' => 3,
            'start_date' => '2026-10-01',
            'status' => 'active',
        ]);

        $m1 = Member::create(['name' => 'John Doe', 'phone' => '1111111111']);
        $committee->members()->attach([$m1->id => ['seats' => 2]]);
        $committee->generateSchedules();

        $this->assertEquals(1, $committee->members()->count());
        $this->assertEquals(2, $committee->getMemberSeatsCount($m1->id));

        // Update committee details without passing update_members_list
        $responseUpdate = $this->actingAs($admin)->put(route('committees.update', $committee->id), [
            'name' => 'Renamed Committee',
            'total_amount' => 120000,
            'total_members' => 3,
            'deduction_rate' => 1.5,
            'special_month_index' => 3,
            'start_date' => '2026-10-01',
            'status' => 'active',
        ]);

        $responseUpdate->assertRedirect(route('committees.show', $committee));

        $committee->refresh();
        $this->assertEquals('Renamed Committee', $committee->name);

        // Members and seat counts MUST remain preserved
        $this->assertEquals(1, $committee->members()->count());
        $this->assertEquals(2, $committee->getMemberSeatsCount($m1->id));
    }
}
