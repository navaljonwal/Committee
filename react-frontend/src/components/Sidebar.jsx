import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Users, 
  PlusCircle, 
  BellRing, 
  Shield, 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Command, 
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Sidebar({ mobileOpen, onCloseMobile, onOpenSearch }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [reminderCount, setReminderCount] = useState(0);

  // Fetch reminder count for badge
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchCount = async () => {
      try {
        const res = await api.get('/reminders');
        if (res.data?.success) setReminderCount(res.data.counts?.total || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  // Don't show sidebar on login or print views
  if (location.pathname === '/login' || location.pathname.includes('/print')) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between">
        <Link 
          to={isAdmin ? "/" : "/member/dashboard"} 
          onClick={onCloseMobile}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-slate-900 leading-tight">
              ChitFund <span className="text-orange-600">Pro</span>
            </div>
            <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">
              Kameti Management
            </div>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Search Trigger Bar */}
      <div className="p-3.5 pb-2">
        <button
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            if (onOpenSearch) onOpenSearch();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50 hover:bg-orange-50/60 border border-slate-200 hover:border-orange-200 text-xs text-slate-500 hover:text-orange-600 transition shadow-2xs group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors" />
            <span className="font-medium">Quick search...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 font-mono text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 shadow-2xs">
            <Command className="w-3 h-3" /> K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-6">
        
        {/* Main Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
            {isAdmin ? 'Management' : 'Member Workspace'}
          </div>

          <nav className="space-y-1">
            {isAdmin ? (
              <>
                <Link
                  to="/"
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive('/') && location.pathname === '/'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers className={`w-4 h-4 ${isActive('/') && location.pathname === '/' ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>Committees List</span>
                  </div>
                  {isActive('/') && location.pathname === '/' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  )}
                </Link>

                <Link
                  to="/committees/create"
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive('/committees/create')
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className={`w-4 h-4 ${isActive('/committees/create') ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>Create Committee</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-orange-100 text-orange-700">
                    New
                  </span>
                </Link>

                <Link
                  to="/members"
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive('/members')
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className={`w-4 h-4 ${isActive('/members') ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>Members Directory</span>
                  </div>
                  {isActive('/members') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  )}
                </Link>

                <Link
                  to="/reminders"
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive('/reminders')
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BellRing className={`w-4 h-4 ${isActive('/reminders') ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>Reminders Center</span>
                  </div>
                  {reminderCount > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {reminderCount > 9 ? '9+' : reminderCount}
                    </span>
                  ) : isActive('/reminders') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/member/dashboard"
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive('/member/dashboard')
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className={`w-4 h-4 ${isActive('/member/dashboard') ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span>My Dashboard</span>
                  </div>
                  {isActive('/member/dashboard') && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Account & Settings Section */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-mono">
            System & Profile
          </div>

          <nav className="space-y-1">
            {isAdmin && (
              <Link
                to="/profile"
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  isActive('/profile')
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                    : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-4 h-4 ${isActive('/profile') ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span>Profile & Security</span>
                </div>
                {isActive('/profile') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                )}
              </Link>
            )}
          </nav>
        </div>

        {/* System Health / Verified Badge Box */}
        <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 border border-orange-100 rounded-2xl p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-orange-900">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Kameti Engine v2.4</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Automated interest formulas, draw auctions & instant WhatsApp ledger sync.
          </p>
        </div>

      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3.5 border-t border-slate-200/90 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 truncate leading-tight">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{isAdmin ? 'Admin' : 'Member'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 z-40 select-none">
        {navContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
