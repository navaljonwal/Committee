import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Users, 
  PlusCircle, 
  BellRing, 
  Shield, 
  LayoutDashboard,
  User
} from 'lucide-react';
import api from '../api/client';

export default function BottomNav() {
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

  // Don't show bottom nav on login or print views
  if (location.pathname === '/login' || location.pathname.includes('/print')) {
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
        {isAdmin ? (
          <>
            {/* Pools */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/') && location.pathname === '/' 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Layers className="w-5 h-5" />
                {isActive('/') && location.pathname === '/' && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Committees</span>
            </Link>

            {/* Members */}
            <Link
              to="/members"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/members') 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                {isActive('/members') && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Members</span>
            </Link>

            {/* Raised Center Create Action */}
            <Link
              to="/committees/create"
              className="flex flex-col items-center justify-center -mt-6 flex-shrink-0 group"
              aria-label="Create New Committee"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-lg shadow-orange-500/35 flex items-center justify-center text-white active:scale-90 transition-transform border-2 border-white">
                <PlusCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black text-orange-600 mt-0.5 tracking-tight">Create</span>
            </Link>

            {/* Reminders */}
            <Link
              to="/reminders"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/reminders') 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <BellRing className="w-5 h-5" />
                {reminderCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border border-white">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                )}
                {isActive('/reminders') && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Reminders</span>
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/profile') 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Shield className="w-5 h-5" />
                {isActive('/profile') && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Profile</span>
            </Link>
          </>
        ) : (
          <>
            {/* Member: Dashboard */}
            <Link
              to="/member/dashboard"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/member/dashboard') 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <LayoutDashboard className="w-5 h-5" />
                {isActive('/member/dashboard') && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Dashboard</span>
            </Link>

            {/* Member: My Kametis */}
            <a
              href="/member/dashboard#my-kametis"
              onClick={() => {
                if (location.pathname === '/member/dashboard') {
                  const el = document.getElementById('my-kametis');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 hover:text-orange-600 font-medium transition-all"
            >
              <div className="relative">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">My Kametis</span>
            </a>

            {/* Member: Profile */}
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive('/profile') 
                  ? 'text-orange-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <User className="w-5 h-5" />
                {isActive('/profile') && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-600 rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Profile</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
