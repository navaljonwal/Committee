<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MemberController extends Controller
{
    public function index()
    {
        $members = Member::with(['user', 'committees'])
            ->withCount(['committees', 'wonSchedules'])
            ->orderBy('name', 'asc')
            ->get();

        return view('members.index', compact('members'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:4',
        ]);

        if (!empty($validated['password'])) {
            $rawPassword = $validated['password'];
        } else {
            // Auto default password: Name (first word) + mobile number ke last 4 digits (e.g. rahul3210)
            $firstName = explode(' ', trim($validated['name']))[0] ?? 'member';
            $cleanName = strtolower(preg_replace('/[^\p{L}\p{N}]/u', '', $firstName));
            if (empty($cleanName)) {
                $cleanName = 'member';
            }

            $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone'] ?? '');
            $phoneDigits = strlen($cleanPhone) >= 4 ? substr($cleanPhone, -4) : '1234';

            $rawPassword = $cleanName . $phoneDigits;
        }

        $member = Member::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'plain_password' => $rawPassword,
        ]);

        // Create linked User account for member
        $phone = $validated['phone'] ?: ('9' . sprintf('%09d', $member->id));

        User::create([
            'member_id' => $member->id,
            'name' => $member->name,
            'email' => 'member' . $member->id . '@kameti.com',
            'phone' => $phone,
            'password' => Hash::make($rawPassword),
            'role' => 'member',
        ]);

        \Illuminate\Support\Facades\Cache::forget('all_members_list');
        $msg = 'Member & login account created! Password: ' . $rawPassword;

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'member'  => $member,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    public function update(Request $request, $id)
    {
        $member = Member::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:4',
        ]);

        $updateMemberData = [
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
        ];
        if (!empty($validated['password'])) {
            $updateMemberData['plain_password'] = $validated['password'];
        }
        $member->update($updateMemberData);

        // Update linked User account
        $user = User::where('member_id', $member->id)->first();
        if (!$user) {
            $user = User::create([
                'member_id' => $member->id,
                'name' => $member->name,
                'email' => 'member' . $member->id . '@kameti.com',
                'phone' => $validated['phone'] ?: ('9' . sprintf('%09d', $member->id)),
                'password' => Hash::make($validated['password'] ?? ($member->plain_password ?? 'member123')),
                'role' => 'member',
            ]);
        } else {
            $updateData = [
                'name' => $member->name,
            ];
            if (!empty($validated['phone'])) {
                $updateData['phone'] = $validated['phone'];
            }
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }
            $user->update($updateData);
        }

        Cache::forget('all_members_list');
        $msg = 'Member details & login credentials updated!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'member'  => $member,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    public function destroy(Request $request, $id)
    {
        $member = Member::findOrFail($id);
        User::where('member_id', $member->id)->delete();
        $member->delete();
        \Illuminate\Support\Facades\Cache::forget('all_members_list');
        $msg = 'Member and login account deleted!';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }
}
