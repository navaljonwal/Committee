<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-900 text-slate-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'ChitFund Pro - Dynamic BC & Committee Calculator')</title>

    <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#ecfdf5',
                            100: '#d1fae5',
                            400: '#34d399',
                            500: '#10b981',
                            600: '#059669',
                            700: '#047857',
                        },
                        amberGold: {
                            400: '#fbbf24',
                            500: '#f59e0b',
                            600: '#d97706',
                        },
                        darkBg: '#080c14',
                        cardBg: '#0f172a',
                    },
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
                        mono: ['"JetBrains Mono"', 'monospace'],
                    }
                }
            }
        }
    </script>

    <!-- FontAwesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <style>
        :root {
            --bg-deep: #080c14;
        }
        body {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            background-color: #080c14;
            color: #f1f5f9;
            background-image: 
                radial-gradient(at 0% 0%, rgba(16, 185, 129, 0.12) 0px, transparent 40%),
                radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.10) 0px, transparent 45%),
                radial-gradient(at 50% 100%, rgba(99, 102, 241, 0.08) 0px, transparent 55%),
                radial-gradient(at 80% 50%, rgba(245, 158, 11, 0.05) 0px, transparent 40%);
            background-attachment: fixed;
            -webkit-font-smoothing: antialiased;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace !important;
        }
        .glass-card {
            background: linear-gradient(135deg, rgba(20, 30, 48, 0.75) 0%, rgba(10, 15, 26, 0.85) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        }
        .glass-card-hover {
            transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-card-hover:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.18);
            box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
        }
        .glass-input {
            background: rgba(8, 13, 22, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #f8fafc;
            transition: all 0.2s ease;
        }
        .glass-input:focus {
            border-color: #10b981;
            background: rgba(8, 13, 22, 0.98);
            outline: none;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.22), 0 0 24px rgba(16, 185, 129, 0.2);
        }
        @keyframes shimmer-anim {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .shimmer-bar {
            position: relative;
            overflow: hidden;
        }
        .shimmer-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
            animation: shimmer-anim 2.5s infinite;
        }
        .glow-emerald {
            box-shadow: 0 0 25px -4px rgba(16, 185, 129, 0.35);
        }
        .glow-amber {
            box-shadow: 0 0 25px -4px rgba(245, 158, 11, 0.35);
        }
        .glow-cyan {
            box-shadow: 0 0 25px -4px rgba(6, 182, 212, 0.35);
        }
        .table-sticky-header th {
            position: sticky;
            top: 0;
            z-index: 10;
            background: rgba(10, 15, 26, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }
        ::-webkit-scrollbar {
            width: 7px;
            height: 7px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(8, 12, 20, 0.95);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.5);
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.8);
        }
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .print-only { display: block !important; }
        }
    </style>
</head>
<body class="h-full flex flex-col antialiased bg-darkBg text-slate-100 min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">

    <!-- Top Navigation Header -->
    <header class="no-print sticky top-0 z-50 border-b border-white/[0.08] bg-[#090d16]/85 backdrop-blur-xl shadow-lg shadow-black/20">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
            <div class="flex items-center min-w-0">
                <a href="{{ Auth::check() && Auth::user()->isMember() ? route('member.dashboard') : route('committees.index') }}" class="flex items-center space-x-2 sm:space-x-3 group min-w-0">
                    <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-all duration-300 shrink-0">
                        <i class="fa-solid fa-calculator text-slate-950 text-sm sm:text-lg font-black"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="text-base sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent truncate">
                                ChitFund<span class="text-emerald-400">Pro</span>
                            </span>
                            <span class="hidden xs:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">v2.0</span>
                        </div>
                        <span class="hidden md:block text-[10px] uppercase font-semibold text-slate-400 tracking-wider truncate">Committee &amp; BC Management</span>
                    </div>
                </a>
            </div>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center space-x-1.5">
                @auth
                    @if(Auth::user()->isAdmin())
                        <a href="{{ route('committees.index') }}" class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 {{ request()->routeIs('committees.index') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent' }}">
                            <i class="fa-solid fa-chart-pie text-xs {{ request()->routeIs('committees.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>Admin Dashboard</span>
                        </a>
                        <a href="{{ route('committees.create') }}" class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 {{ request()->routeIs('committees.create') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent' }}">
                            <i class="fa-solid fa-circle-plus text-xs {{ request()->routeIs('committees.create') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>New Committee</span>
                        </a>
                        <a href="{{ route('members.index') }}" class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 {{ request()->routeIs('members.index') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent' }}">
                            <i class="fa-solid fa-users text-xs {{ request()->routeIs('members.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>Members</span>
                        </a>
                    @else
                        <a href="{{ route('member.dashboard') }}" class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 {{ request()->routeIs('member.*') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm shadow-emerald-500/10' : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent' }}">
                            <i class="fa-solid fa-layer-group text-xs {{ request()->routeIs('member.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>My Committees</span>
                        </a>
                    @endif
                @endauth
            </nav>

            <!-- Auth Profile / Quick Actions -->
            <div class="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
                @auth
                    <div class="flex items-center space-x-1.5 sm:space-x-2 bg-slate-900/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/[0.09] shadow-sm">
                        <div class="relative">
                            <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                                {{ substr(Auth::user()->name, 0, 2) }}
                            </div>
                            <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-[#090d16]"></span>
                        </div>
                        <div class="text-left max-w-[85px] sm:max-w-[120px]">
                            <span class="block text-xs font-bold text-white leading-tight truncate">{{ Auth::user()->name }}</span>
                            <span class="block text-[9px] font-semibold uppercase tracking-wider text-emerald-400/90 truncate">
                                {{ Auth::user()->isAdmin() ? 'Organizer' : 'Member' }}
                            </span>
                        </div>
                    </div>

                    <!-- Direct Visible Logout Button -->
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button type="submit" title="Logout" class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-900/90 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors shadow-sm">
                            <i class="fa-solid fa-right-from-bracket text-xs sm:text-sm"></i>
                        </button>
                    </form>

                    <!-- Mobile Hamburger Toggle -->
                    <button type="button" onclick="toggleMobileDrawer()" class="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-white bg-slate-900/90 border border-white/[0.09] focus:outline-none" aria-label="Toggle Menu">
                        <i class="fa-solid fa-bars text-sm" id="mobileDrawerIcon"></i>
                    </button>
                @else
                    <a href="{{ route('login') }}" class="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20">
                        <i class="fa-solid fa-right-to-bracket mr-1 sm:mr-2"></i> Log In
                    </a>
                @endauth
            </div>
        </div>

        <!-- TOP Mobile Navigation Bar (Always Visible at Top of Screen on Phone View) -->
        @auth
            <nav class="md:hidden border-t border-white/[0.08] bg-[#0b101d]/95 backdrop-blur-xl px-2.5 py-1.5 shadow-md">
                <div class="flex items-center justify-between gap-1.5 max-w-lg mx-auto">
                    @if(Auth::user()->isAdmin())
                        <a href="{{ route('committees.index') }}" class="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('committees.index') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-chart-pie text-xs {{ request()->routeIs('committees.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="{{ route('committees.create') }}" class="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('committees.create') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-circle-plus text-xs {{ request()->routeIs('committees.create') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>New Chit</span>
                        </a>
                        <a href="{{ route('members.index') }}" class="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('members.index') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-users text-xs {{ request()->routeIs('members.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>Members</span>
                        </a>
                        <a href="{{ route('profile.edit') }}" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('profile.*') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-user-gear text-xs {{ request()->routeIs('profile.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span class="hidden xs:inline">Settings</span>
                        </a>
                    @else
                        <a href="{{ route('member.dashboard') }}" class="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('member.dashboard') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-layer-group text-xs {{ request()->routeIs('member.dashboard') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span>Committees</span>
                        </a>
                        @if(request()->routeIs('member.committees.show'))
                            <div class="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-bold tracking-tight bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-sm">
                                <i class="fa-solid fa-gavel text-xs text-emerald-400 animate-pulse"></i>
                                <span>Live Auction</span>
                            </div>
                        @endif
                        <a href="{{ route('profile.edit') }}" class="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all text-center {{ request()->routeIs('profile.*') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' : 'text-slate-300 hover:text-white bg-slate-900/60 border border-white/[0.06]' }}">
                            <i class="fa-solid fa-user-gear text-xs {{ request()->routeIs('profile.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                            <span class="hidden xs:inline">Profile</span>
                        </a>
                    @endif
                </div>
            </nav>
        @endauth

        <!-- Mobile Drawer Navigation -->
        @auth
            <div id="mobileDrawer" class="hidden md:hidden border-t border-slate-800/80 bg-[#090d16]/95 backdrop-blur-xl px-4 py-3 space-y-2 shadow-2xl transition-all">
                @if(Auth::user()->isAdmin())
                    <a href="{{ route('committees.index') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('committees.index') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-chart-pie w-4 text-center {{ request()->routeIs('committees.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>Admin Dashboard</span>
                    </a>
                    <a href="{{ route('committees.create') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('committees.create') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-circle-plus w-4 text-center {{ request()->routeIs('committees.create') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>New Committee</span>
                    </a>
                    <a href="{{ route('members.index') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('members.index') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-users w-4 text-center {{ request()->routeIs('members.index') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>Members Directory</span>
                    </a>
                    <a href="{{ route('profile.edit') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('profile.*') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-user-gear w-4 text-center {{ request()->routeIs('profile.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>Profile &amp; Password Settings</span>
                    </a>
                @else
                    <a href="{{ route('member.dashboard') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('member.*') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-layer-group w-4 text-center {{ request()->routeIs('member.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>My Committees</span>
                    </a>
                    <a href="{{ route('profile.edit') }}" class="px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 {{ request()->routeIs('profile.*') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-300 hover:bg-slate-800/60' }}">
                        <i class="fa-solid fa-user-gear w-4 text-center {{ request()->routeIs('profile.*') ? 'text-emerald-400' : 'text-slate-400' }}"></i>
                        <span>Profile Settings</span>
                    </a>
                @endif
                <form method="POST" action="{{ route('logout') }}" class="pt-2 border-t border-slate-800/80">
                    @csrf
                    <button type="submit" class="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 text-rose-400 hover:bg-rose-500/10 transition-colors text-left">
                        <i class="fa-solid fa-right-from-bracket w-4 text-center"></i>
                        <span>Log Out</span>
                    </button>
                </form>
            </div>
        @endauth
    </header>

    <!-- Main Content Body -->
    <main class="flex-1 py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
        <!-- Flash Messages -->
        @if(session('success'))
            <div class="no-print mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between shadow-lg">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
                    <span class="text-sm font-medium">{{ session('success') }}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-emerald-400 hover:text-emerald-200">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        @endif

        @if(session('error'))
            <div class="no-print mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center justify-between shadow-lg">
                <div class="flex items-center space-x-3">
                    <i class="fa-solid fa-triangle-exclamation text-rose-400 text-lg"></i>
                    <span class="text-sm font-medium">{{ session('error') }}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="text-rose-400 hover:text-rose-200">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        @endif

        @yield('content')
    </main>

    <!-- Custom Reusable Confirmation Modal -->
    <div id="confirmModal" class="fixed inset-0 z-50 hidden bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="glass-card w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-5 shadow-2xl">
            <div class="flex items-start space-x-4">
                <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shrink-0">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div class="space-y-1">
                    <h3 id="confirmModalTitle" class="text-base font-bold text-white">Confirmation Required</h3>
                    <p id="confirmModalMessage" class="text-xs text-slate-400 leading-relaxed">Are you sure you want to perform this action?</p>
                </div>
            </div>

            <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
                <button type="button" onclick="closeConfirmModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    Cancel
                </button>
                <button type="button" id="confirmModalSubmitBtn" class="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 transition-all">
                    Yes, Delete
                </button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="no-print border-t border-slate-800 py-6 mt-12 bg-slate-950/60 text-slate-500 text-center text-xs">
        <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                &copy; {{ date('Y') }} <span class="text-slate-300 font-semibold">ChitFund Pro</span>. Dynamic Private Committee & BC Schedule Manager.
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-slate-400"><i class="fa-solid fa-shield-halved text-emerald-400 mr-1"></i> Secure PDO Engine</span>
                <span class="text-slate-400"><i class="fa-solid fa-bolt text-amber-400 mr-1"></i> Realtime Calculation</span>
            </div>
        </div>
    </footer>

    <!-- Toast Notifications Container -->
    <div id="toastContainer" class="fixed top-20 right-5 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full"></div>

    <script>
        // Global Toast Notification Helper
        function showToast(message, type = 'success') {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-x-10 opacity-0 ${
                type === 'success' 
                    ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
                    : type === 'error'
                    ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                    : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`;

            const iconClass = type === 'success' 
                ? 'fa-solid fa-circle-check text-emerald-400' 
                : type === 'error'
                ? 'fa-solid fa-triangle-exclamation text-rose-400'
                : 'fa-solid fa-info-circle text-cyan-400';

            toast.innerHTML = `
                <div class="flex items-center space-x-3">
                    <i class="${iconClass} text-lg"></i>
                    <span class="text-xs font-semibold leading-snug">${message}</span>
                </div>
                <button onclick="this.parentElement.remove()" class="ml-4 opacity-70 hover:opacity-100">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            container.appendChild(toast);

            // Animate in
            requestAnimationFrame(() => {
                toast.classList.remove('translate-x-10', 'opacity-0');
            });

            // Auto dismiss after 4.5 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-10', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 4500);
        }

        // Global AJAX Form Handler
        async function submitAjaxForm(form, onSuccess = null) {
            const formData = new FormData(form);
            const submitBtn = form.querySelector('button[type="submit"]');
            let origBtnHtml = '';

            if (submitBtn) {
                origBtnHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Processing...`;
            }

            try {
                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                        'Accept': 'application/json',
                    },
                    body: formData
                });

                const data = await response.json();

                if (response.ok && (data.success || data.status)) {
                    showToast(data.message || 'Action completed successfully!', 'success');
                    if (onSuccess) {
                        onSuccess(data);
                    } else if (data.redirect) {
                        setTimeout(() => { window.location.href = data.redirect; }, 600);
                    } else {
                        setTimeout(() => { window.location.reload(); }, 800);
                    }
                } else {
                    const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join('<br>') : 'An error occurred.');
                    showToast(errorMsg, 'error');
                }
            } catch (err) {
                showToast('Network request failed. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnHtml;
                }
            }
        }

        let activeFormToSubmit = null;

        function openConfirmModalForForm(form) {
            activeFormToSubmit = form;

            const confirmMessage = form.dataset.confirm || "Are you sure you want to delete this item? This action cannot be undone.";
            const confirmTitle = form.dataset.confirmTitle || "Confirmation Required";
            const confirmBtnText = form.dataset.confirmBtn || "Yes, Delete";
            const btnClass = form.dataset.confirmClass || "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20";

            document.getElementById('confirmModalTitle').innerText = confirmTitle;
            document.getElementById('confirmModalMessage').innerText = confirmMessage;

            const submitBtn = document.getElementById('confirmModalSubmitBtn');
            submitBtn.innerText = confirmBtnText;
            submitBtn.className = `px-5 py-2 rounded-xl text-xs font-bold transition-all ${btnClass}`;

            document.getElementById('confirmModal').classList.remove('hidden');
        }

        function showConfirmModal(event, message = "Are you sure you want to delete this item? This action cannot be undone.", title = "Confirmation Required", btnText = "Yes, Delete", btnClass = "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20") {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const form = event ? event.target.closest('form') : activeFormToSubmit;
            if (form) {
                if (message) form.dataset.confirm = message;
                if (title) form.dataset.confirmTitle = title;
                if (btnText) form.dataset.confirmBtn = btnText;
                if (btnClass) form.dataset.confirmClass = btnClass;
                openConfirmModalForForm(form);
            }
            return false;
        }

        function closeConfirmModal() {
            document.getElementById('confirmModal').classList.add('hidden');
            activeFormToSubmit = null;
        }

        document.getElementById('confirmModalSubmitBtn')?.addEventListener('click', function() {
            if (activeFormToSubmit) {
                const targetForm = activeFormToSubmit;
                targetForm.dataset.confirmed = "true";
                closeConfirmModal();
                if (targetForm.dataset.ajax === 'true') {
                    submitAjaxForm(targetForm);
                } else {
                    targetForm.submit();
                }
            } else {
                closeConfirmModal();
            }
        });

        // Global Event Interceptor for form submissions
        document.addEventListener('submit', function(e) {
            const form = e.target;
            if (!form) return;

            const hasDeleteMethod = form.querySelector('input[name="_method"][value="DELETE"]') !== null || (form.method && form.method.toUpperCase() === 'DELETE');
            const requiresConfirm = (form.dataset && form.dataset.confirm) || hasDeleteMethod;

            // If confirmation is required and form is NOT yet confirmed by user modal click:
            if (requiresConfirm && (!form.dataset || form.dataset.confirmed !== 'true')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                openConfirmModalForForm(form);
                return false;
            }

            // Clean up confirmed flag after submit processing
            if (form.dataset && form.dataset.confirmed) {
                delete form.dataset.confirmed;
            }

            // Global AJAX form submit handler
            if (form.dataset && form.dataset.ajax === 'true') {
                e.preventDefault();
                submitAjaxForm(form);
            }
        }, true);

        // Mobile Drawer Toggle
        function toggleMobileDrawer() {
            const drawer = document.getElementById('mobileDrawer');
            const icon = document.getElementById('mobileDrawerIcon');
            if (!drawer) return;
            drawer.classList.toggle('hidden');
            if (drawer.classList.contains('hidden')) {
                if (icon) {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            } else {
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                }
            }
        }
    </script>



    @yield('scripts')
</body>
</html>
