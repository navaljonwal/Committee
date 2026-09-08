<?php

namespace Database\Seeders;

use App\Models\Committee;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    /**
     * Seed sample members and test committees for development.
     */
    public function run(): void
    {
        $sampleMembers = [
            ['name' => 'Rajesh Sharma', 'phone' => '9876543210'],
            ['name' => 'Amit Kumar', 'phone' => '9876543211'],
            ['name' => 'Priya Verma', 'phone' => '9876543212'],
            ['name' => 'Vikram Singh', 'phone' => '9876543213'],
            ['name' => 'Sunita Gupta', 'phone' => '9876543214'],
            ['name' => 'Suresh Yadav', 'phone' => '9876543215'],
            ['name' => 'Pooja Malhotra', 'phone' => '9876543216'],
            ['name' => 'Ramesh Agarwal', 'phone' => '9876543217'],
            ['name' => 'Neha Saxena', 'phone' => '9876543218'],
            ['name' => 'Deepak Mishra', 'phone' => '9876543219'],
            ['name' => 'Manish Choudhary', 'phone' => '9876543220'],
            ['name' => 'Kavita Joshi', 'phone' => '9876543221'],
            ['name' => 'Sanjay Jain', 'phone' => '9876543222'],
            ['name' => 'Anjali Bansal', 'phone' => '9876543223'],
            ['name' => 'Ravi Singhal', 'phone' => '9876543224'],
            ['name' => 'Alok Srivastava', 'phone' => '9876543225'],
            ['name' => 'Meena Mittal', 'phone' => '9876543226'],
            ['name' => 'Gaurav Trivedi', 'phone' => '9876543227'],
            ['name' => 'Shweta Pandey', 'phone' => '9876543228'],
            ['name' => 'Vikas Kapoor', 'phone' => '9876543229'],
        ];

        $createdMembers = [];
        foreach ($sampleMembers as $m) {
            $member = Member::create($m);
            $createdMembers[] = $member;

            User::updateOrCreate(
                ['member_id' => $member->id],
                [
                    'name' => $member->name,
                    'email' => strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $member->name)) . '@kameti.com',
                    'phone' => $member->phone,
                    'password' => Hash::make('member123'),
                    'role' => 'member',
                ]
            );
        }

        // Create sample committee ₹2,00,000, 20 members, 1.5% deduction rate
        $committee = Committee::create([
            'name' => 'Royal Fortune BC Committee (2 Lakhs)',
            'total_amount' => 200000.00,
            'total_members' => 20,
            'deduction_rate' => 1.50,
            'special_month_index' => 19, // Month 2 is Index N = 19 (Zero Deduction Slot)
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);

        // Attach members to committee
        $memberIds = collect($createdMembers)->pluck('id')->toArray();
        $committee->members()->sync($memberIds);

        // Generate dynamic calculation schedule
        $committee->generateSchedules();

        // Assign some winner members for first few months
        $schedules = $committee->schedules;
        if (isset($schedules[0])) {
            $schedules[0]->update(['member_id' => $createdMembers[0]->id]);
        }
        if (isset($schedules[1])) { // Month 2 (Special month - Organizer slot)
            $schedules[1]->update(['member_id' => $createdMembers[1]->id]);
        }
        if (isset($schedules[2])) {
            $schedules[2]->update(['member_id' => $createdMembers[2]->id]);
        }

        // Create a second sample committee ₹5,00,000, 20 members, 1.5% rate
        $committee2 = Committee::create([
            'name' => 'Gold Merchant Committee (5 Lakhs)',
            'total_amount' => 500000.00,
            'total_members' => 20,
            'deduction_rate' => 1.50,
            'special_month_index' => 19,
            'start_date' => '2026-03-01',
            'status' => 'active',
        ]);
        $committee2->members()->sync($memberIds);
        $committee2->generateSchedules();
    }
}
