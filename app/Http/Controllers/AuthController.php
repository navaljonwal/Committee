<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        if (Auth::check()) {
            if (Auth::user()->isAdmin()) {
                return redirect()->route('committees.index');
            }
            return redirect()->route('member.dashboard');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'identity' => 'required|string',
            'password'  => 'required|string',
        ]);

        $loginInput = trim($request->input('identity'));
        $password   = $request->input('password');

        // Try email first
        if (filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            if (Auth::attempt(['email' => $loginInput, 'password' => $password], $request->boolean('remember'))) {
                $request->session()->regenerate();
                return $this->redirectAfterLogin();
            }
        } else {
            // Try phone
            if (Auth::attempt(['phone' => $loginInput, 'password' => $password], $request->boolean('remember'))) {
                $request->session()->regenerate();
                return $this->redirectAfterLogin();
            }

            // Fallback: try name
            if (Auth::attempt(['name' => $loginInput, 'password' => $password], $request->boolean('remember'))) {
                $request->session()->regenerate();
                return $this->redirectAfterLogin();
            }
        }

        return redirect()->back()->withErrors([
            'identity' => 'Invalid credentials. Please check your Email / Phone / Name and Password.',
        ])->withInput($request->only('identity'));
    }

    private function redirectAfterLogin()
    {
        $user = Auth::user();
        if ($user->isAdmin()) {
            return redirect()->intended(route('committees.index'))->with('success', 'Welcome back, ' . $user->name . '!');
        }
        return redirect()->intended(route('member.dashboard'))->with('success', 'Welcome back, ' . $user->name . '!');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'Logged out successfully.');
    }
}
