@extends('layouts.app')

@section('title', 'Login - ChitFund Pro')

@section('content')
<div class="min-h-[75vh] flex items-center justify-center py-6">
    <div class="w-full max-w-md space-y-6">
        <!-- Brand Header -->
        <div class="text-center space-y-2">
            <div class="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 items-center justify-center shadow-xl shadow-emerald-500/20 mb-2">
                <i class="fa-solid fa-user-shield text-white text-2xl"></i>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
            <p class="text-xs text-slate-400">Sign in to access your Committee Admin or Member Portal</p>
        </div>

        <!-- Login Card -->
        <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <form method="POST" action="{{ route('login.submit') }}" class="space-y-5">
                @csrf

                <!-- Identity Field (Phone / Email / Name) -->
                <div class="space-y-1.5">
                    <label for="identity" class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Phone Number / Email / Name
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <i class="fa-solid fa-user text-sm"></i>
                        </div>
                        <input type="text" name="identity" id="identity" value="{{ old('identity') }}" required autofocus
                            placeholder="Enter phone, email or name"
                            class="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all">
                    </div>
                    @error('identity')
                        <p class="text-xs text-rose-400 mt-1"><i class="fa-solid fa-circle-exclamation mr-1"></i>{{ $message }}</p>
                    @enderror
                </div>

                <!-- Password Field -->
                <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                        <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Password
                        </label>
                    </div>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <i class="fa-solid fa-lock text-sm"></i>
                        </div>
                        <input type="password" name="password" id="password" required
                            placeholder="••••••••"
                            class="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all">
                    </div>
                    @error('password')
                        <p class="text-xs text-rose-400 mt-1"><i class="fa-solid fa-circle-exclamation mr-1"></i>{{ $message }}</p>
                    @enderror
                </div>

                <!-- Login Button -->
                <button type="submit" class="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-900 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2">
                    <i class="fa-solid fa-right-to-bracket text-base"></i>
                    <span>Log In to Portal</span>
                </button>
            </form>
        </div>

        <!-- Default Credentials Helper Card -->
        <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3">
            <div class="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <i class="fa-solid fa-key"></i>
                <span>Default Login Credentials</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span class="block text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Admin / Organizer</span>
                    <span class="block text-slate-300 font-mono mt-1">admin@kameti.com</span>
                    <span class="block text-slate-400 text-[11px]">Pass: <code class="text-amber-400 font-mono">admin123</code></span>
                </div>
                <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <span class="block text-[10px] font-semibold text-teal-400 uppercase tracking-wider">Committee Member</span>
                    <span class="block text-slate-300 font-mono mt-1">Member Phone</span>
                    <span class="block text-slate-400 text-[11px]">Pass: <code class="text-amber-400 font-mono">member123</code></span>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
