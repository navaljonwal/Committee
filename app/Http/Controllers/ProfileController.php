<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Show the profile edit form (Admin only).
     */
    public function edit()
    {
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403, 'Unauthorized. Only administrators can access profile and password settings.');
        return view('profile.edit', compact('user'));
    }

    /**
     * Update user profile information (Name, Email, Phone).
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403, 'Unauthorized.');

        $validated = $request->validate([
            'name'  => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone,' . $user->id],
        ]);

        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ]);

        // If member is linked to this user, sync name & phone
        if ($user->member) {
            $user->member->update([
                'name'  => $validated['name'],
                'phone' => $validated['phone'],
            ]);
        }

        return redirect()->route('profile.edit')->with('success', 'Profile information updated successfully!');
    }

    /**
     * Update user password (Admin only).
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();
        abort_if(!$user->isAdmin(), 403, 'Unauthorized.');

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = Auth::user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('profile.edit')->with('success', 'Password changed successfully! Next time please use your new password.');
    }
}
