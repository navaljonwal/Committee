@extends('layouts.app')

@section('title', 'My Profile & Security Settings - ChitFund Pro')

@section('content')
<div class="max-w-4xl mx-auto space-y-6">
    <!-- Breadcrumb & Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
            <div class="flex items-center space-x-2 text-xs text-slate-400 font-semibold mb-1">
                @if($user->isAdmin())
                    <a href="{{ route('committees.index') }}" class="hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Dashboard
                    </a>
                @else
                    <a href="{{ route('member.dashboard') }}" class="hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-arrow-left text-[10px]"></i> Member Portal
                    </a>
                @endif
                <span>/</span>
                <span class="text-emerald-400 font-bold">Profile &amp; Security</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                <i class="fa-solid fa-user-shield text-emerald-400"></i>
                <span>Account Settings</span>
            </h1>
            <p class="text-xs sm:text-sm text-slate-400 mt-1">
                Manage your name, contact email, phone number, and account password.
            </p>
        </div>

        <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{{ $user->role === 'admin' ? 'Organizer Admin' : 'Member Account' }}</span>
            </span>
        </div>
    </div>

    <!-- Error Summary Alerts -->
    @if ($errors->any())
        <div class="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm space-y-1 shadow-lg shadow-rose-500/10">
            <div class="flex items-center gap-2 font-bold text-rose-400">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>Please fix the errors below:</span>
            </div>
            <ul class="list-disc list-inside text-xs space-y-0.5 pl-2 text-rose-200">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Card 1: Account Information (Name, Email, Phone) -->
        <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-5 relative overflow-hidden flex flex-col justify-between">
            <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg shadow-sm">
                            <i class="fa-solid fa-id-card"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-white">Profile Details</h2>
                            <p class="text-xs text-slate-400">Update your email &amp; identity</p>
                        </div>
                    </div>
                </div>

                <form method="POST" action="{{ route('profile.update') }}" class="space-y-4">
                    @csrf
                    @method('PUT')

                    <!-- Name Field -->
                    <div class="space-y-1.5">
                        <label for="name" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Full Name <span class="text-emerald-400">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-user"></i>
                            </div>
                            <input type="text"
                                   name="name"
                                   id="name"
                                   value="{{ old('name', $user->name) }}"
                                   required
                                   class="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm focus:ring-2 focus:ring-emerald-500 @error('name') border-rose-500 @enderror"
                                   placeholder="Your Name">
                        </div>
                        @error('name')
                            <span class="text-xs text-rose-400 block">{{ $message }}</span>
                        @enderror
                    </div>

                    <!-- Email Field -->
                    <div class="space-y-1.5">
                        <label for="email" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Email Address <span class="text-emerald-400">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-envelope"></i>
                            </div>
                            <input type="email"
                                   name="email"
                                   id="email"
                                   value="{{ old('email', $user->email) }}"
                                   required
                                   class="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-emerald-500 @error('email') border-rose-500 @enderror"
                                   placeholder="admin@kameti.com">
                        </div>
                        <span class="text-[11px] text-slate-400 block">Used for logging in to your admin panel.</span>
                        @error('email')
                            <span class="text-xs text-rose-400 block">{{ $message }}</span>
                        @enderror
                    </div>

                    <!-- Phone Field -->
                    <div class="space-y-1.5">
                        <label for="phone" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Phone Number
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-phone"></i>
                            </div>
                            <input type="text"
                                   name="phone"
                                   id="phone"
                                   value="{{ old('phone', $user->phone) }}"
                                   class="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-emerald-500 @error('phone') border-rose-500 @enderror"
                                   placeholder="9876543210">
                        </div>
                        <span class="text-[11px] text-slate-400 block">Optional phone number for quick credentials access.</span>
                        @error('phone')
                            <span class="text-xs text-rose-400 block">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="pt-2">
                        <button type="submit" class="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]">
                            <i class="fa-solid fa-floppy-disk"></i>
                            <span>Save Profile Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Card 2: Change Password -->
        <div class="glass-card p-5 sm:p-7 rounded-3xl border border-slate-800 space-y-5 relative overflow-hidden flex flex-col justify-between">
            <div class="space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg shadow-sm">
                            <i class="fa-solid fa-key"></i>
                        </div>
                        <div>
                            <h2 class="text-base font-bold text-white">Change Password</h2>
                            <p class="text-xs text-slate-400">Update your security credential</p>
                        </div>
                    </div>
                </div>

                <form method="POST" action="{{ route('profile.password') }}" class="space-y-4">
                    @csrf
                    @method('PUT')

                    <!-- Current Password -->
                    <div class="space-y-1.5">
                        <label for="current_password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Current Password <span class="text-amber-400">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-lock"></i>
                            </div>
                            <input type="password"
                                   name="current_password"
                                   id="current_password"
                                   required
                                   class="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-amber-500 @error('current_password') border-rose-500 @enderror"
                                   placeholder="Enter your current password">
                            <button type="button" onclick="togglePasswordVisibility('current_password', this)" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                        @error('current_password')
                            <span class="text-xs text-rose-400 block">{{ $message }}</span>
                        @enderror
                    </div>

                    <!-- New Password -->
                    <div class="space-y-1.5">
                        <label for="password" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            New Password <span class="text-amber-400">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <input type="password"
                                   name="password"
                                   id="password"
                                   required
                                   class="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-amber-500 @error('password') border-rose-500 @enderror"
                                   placeholder="At least 6 characters">
                            <button type="button" onclick="togglePasswordVisibility('password', this)" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                        @error('password')
                            <span class="text-xs text-rose-400 block">{{ $message }}</span>
                        @enderror
                    </div>

                    <!-- Confirm New Password -->
                    <div class="space-y-1.5">
                        <label for="password_confirmation" class="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Confirm New Password <span class="text-amber-400">*</span>
                        </label>
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                                <i class="fa-solid fa-check-double"></i>
                            </div>
                            <input type="password"
                                   name="password_confirmation"
                                   id="password_confirmation"
                                   required
                                   class="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm font-mono focus:ring-2 focus:ring-amber-500"
                                   placeholder="Re-type your new password">
                            <button type="button" onclick="togglePasswordVisibility('password_confirmation', this)" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200">
                                <i class="fa-solid fa-eye text-xs"></i>
                            </button>
                        </div>
                    </div>

                    <div class="pt-2">
                        <button type="submit" class="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]">
                            <i class="fa-solid fa-shield-halved"></i>
                            <span>Update Password</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
function togglePasswordVisibility(fieldId, btn) {
    const input = document.getElementById(fieldId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
</script>
@endsection
