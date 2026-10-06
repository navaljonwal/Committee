import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  BellRing, 
  PlusCircle, 
  Command, 
  Layers, 
  ShieldCheck, 
  Shield 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Header({ onOpenMobileSidebar, onOpenSearch }) {
  const { user } = useAuth();
  const location = useLocation();
  const [reminderCount, setReminderCount] = useState(0);

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

  // Don't show header on login or print views
  if (location.pathname === '/login' || location.pathname.includes('/print')) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  return (
    <header className="no-print h-14 sm:h-16 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-3 shadow-2xs">
      
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand title */}
        <Link 
          to={isAdmin ? "/" : "/member/dashboard"}
          className="md:hidden flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-slate-900">
            ChitFund <span className="text-orange-600">Pro</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Bar (Desktop & Mobile) */}
      <div className="flex-1 max-w-xl mx-auto px-2">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 sm:py-2.5 rounded-2xl bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-200 text-xs sm:text-sm text-slate-400 hover:text-slate-600 transition shadow-2xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-600 transition-colors shrink-0" />
            <span className="text-slate-400 group-hover:text-slate-600 truncate text-xs sm:text-sm">
              Search committees, members, kist...
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 shadow-2xs shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        
        {/* Tamper-proof verified badge (desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Ledger</span>
        </div>

        {/* Create Committee quick CTA (Desktop, Admin only) */}
        {isAdmin && (
          <Link
            to="/committees/create"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20 btn-press shimmer-sweep hover:shadow-orange-500/30"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Kameti</span>
          </Link>
        )}

        {/* Reminders Alert Bell */}
        {isAdmin && (
          <Link
            to="/reminders"
            className="relative p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all btn-press"
            title="Payment Reminders Center"
          >
            <BellRing className={`w-4 h-4 sm:w-5 sm:h-5 ${reminderCount > 0 ? 'text-orange-600 animate-bell-shake' : ''}`} />
            {reminderCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pop-in animate-live-red">
                {reminderCount > 9 ? '9+' : reminderCount}
              </span>
            )}
          </Link>
        )}

        {/* User Avatar & Status */}
        <Link
          to={isAdmin ? "/profile" : "/member/dashboard"}
          className="flex items-center gap-2 pl-1.5 sm:pl-2.5 border-l border-slate-200 group"
          title="Profile Settings"
        >
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 border border-orange-200 group-hover:border-orange-400 group-hover:scale-105 flex items-center justify-center text-xs font-extrabold shadow-2xs transition-all duration-200">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px] group-hover:text-orange-600 transition-colors">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {isAdmin ? 'Admin' : 'Member'}
            </div>
          </div>
        </Link>

      </div>

    </header>
  );
}
