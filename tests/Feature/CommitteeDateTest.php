<?php

namespace Tests\Feature;

use App\Models\Committee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommitteeDateTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);
    }

    public function test_committee_calculates_correct_end_date()
    {
        $committee = Committee::create([
            'name' => 'Test 10 Month Committee',
            'total_amount' => 100000,
            'total_members' => 10,
            'deduction_rate' => 1.5,
            'special_month_index' => 9,
            'start_date' => '2026-01-10',
            'status' => 'active',
        ]);
        $committee->generateSchedules();

        $this->assertEquals('2026-01-10', $committee->start_date->format('Y-m-d'));
        $this->assertEquals('2026-10-10', $committee->end_date->format('Y-m-d'));
    }

    public function test_committee_show_page_displays_dates()
    {
        $committee = Committee::create([
            'name' => 'Gold Committee',
            'total_amount' => 200000,
            'total_members' => 20,
            'deduction_rate' => 1.5,
            'special_month_index' => 19,
            'start_date' => '2025-05-01',
            'status' => 'active',
        ]);
        $committee->generateSchedules();

        $response = $this->actingAs($this->admin)->get(route('committees.show', $committee->id));
        $response->assertStatus(200);
        $response->assertSee('01 May 2025');
        $response->assertSee('Start Date');
        $response->assertSee('End Date');
        $response->assertSee('Draw Date');
    }

    public function test_admin_can_update_committee_start_date()
    {
        $committee = Committee::create([
            'name' => 'Date Shift Committee',
            'total_amount' => 100000,
            'total_members' => 5,
            'deduction_rate' => 1.0,
            'special_month_index' => 4,
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);
        $committee->generateSchedules();

        $response = $this->actingAs($this->admin)->post(route('committees.updateDate', $committee->id), [
            'start_date' => '2026-06-15',
        ]);

        $response->assertRedirect();
        $committee->refresh();

        $this->assertEquals('2026-06-15', $committee->start_date->format('Y-m-d'));
        $firstSchedule = $committee->schedules()->where('month_no', 1)->first();
        $lastSchedule = $committee->schedules()->where('month_no', 5)->first();

        $this->assertEquals('2026-06-15', $firstSchedule->draw_date->format('Y-m-d'));
        $this->assertEquals('2026-10-15', $lastSchedule->draw_date->format('Y-m-d'));
        $this->assertEquals('2026-10-15', $committee->end_date->format('Y-m-d'));
    }

    public function test_admin_can_update_individual_schedule_draw_date()
    {
        $committee = Committee::create([
            'name' => 'Single Draw Date Committee',
            'total_amount' => 100000,
            'total_members' => 5,
            'deduction_rate' => 1.0,
            'special_month_index' => 4,
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);
        $committee->generateSchedules();
        $schedule = $committee->schedules()->where('month_no', 2)->first();

        $response = $this->actingAs($this->admin)->post(route('schedules.updateDate', $schedule->id), [
            'draw_date' => '2026-02-14',
        ]);

        $response->assertRedirect();
        $schedule->refresh();

        $this->assertEquals('2026-02-14', $schedule->draw_date->format('Y-m-d'));
    }
}
