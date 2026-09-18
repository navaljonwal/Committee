import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Users, 
  PlusCircle, 
  LogOut, 
  Shield, 
  LayoutDashboard,
  Menu,
  X,
  BellRing
} from 'lucide-react';
import api from '../api/client';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  // Fetch reminder count for badge
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchCount = async () => {
      try {
        const res = await api.get('/reminders');
        if (res.data.success) setReminderCount(res.data.counts?.total || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isActive = (path) => location.pathname === path;

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="no-print bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-orange-600" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to={isAdmin ? "/" : "/member/dashboard"} className="flex items-center space-x-2.5" onClick={closeMobile}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  ChitFund <span className="text-orange-600 font-extrabold">Pro</span>
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400 block -mt-1">
                  Kameti Management
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5">
            {isAdmin ? (
              <>
                <Link
                  to="/"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive('/') 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Committees
                </Link>

                <Link
                  to="/committees/create"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive('/committees/create') 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-orange-500" />
                  New Committee
                </Link>

                <Link
                  to="/members"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive('/members') 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Members Directory
                </Link>

                <Link
                  to="/reminders"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 relative ${
                    isActive('/reminders') 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <span className="relative">
                    <BellRing className="w-4 h-4" />
                    {reminderCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                        {reminderCount > 9 ? '9+' : reminderCount}
                      </span>
                    )}
                  </span>
                  Reminders
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/member/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                    isActive('/member/dashboard') 
                      ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-xs' 
                      : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  My Dashboard
                </Link>
              </>
            )}
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAdmin && (
              <Link
                to="/reminders"
                className={`relative p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition ${
                  isActive('/reminders') ? 'text-orange-600 bg-orange-50 border border-orange-200' : ''
                }`}
                title="Reminder Center"
              >
                <BellRing className="w-4 h-4" />
                {reminderCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                )}
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/profile"
                className={`p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition ${
                  isActive('/profile') ? 'text-orange-600 bg-orange-50 border border-orange-200' : ''
                }`}
                title="Profile & Security"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}

            <div className="flex items-center space-x-2 sm:space-x-2.5 pl-1.5 sm:pl-2 border-l border-slate-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-orange-500' : 'bg-amber-500'}`} />
                  {isAdmin ? 'Admin' : 'Member'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">{user.name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
              </div>
            </div>
            {isAdmin && (
              <Link
                to="/profile"
                onClick={closeMobile}
                className="text-xs text-orange-600 font-semibold px-2 py-1 bg-orange-50 rounded-lg border border-orange-200"
              >
                Settings
              </Link>
            )}
          </div>

          {isAdmin ? (
            <>
              <Link
                to="/"
                onClick={closeMobile}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  isActive('/') 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-orange-500" />
                Committees Dashboard
              </Link>

              <Link
                to="/committees/create"
                onClick={closeMobile}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  isActive('/committees/create') 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-orange-500" />
                Create New Committee
              </Link>

              <Link
                to="/members"
                onClick={closeMobile}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                  isActive('/members') 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-orange-500" />
                Members Directory
              </Link>
            </>
          ) : (
            <Link
              to="/member/dashboard"
              onClick={closeMobile}
              className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                isActive('/member/dashboard') 
                  ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-orange-500" />
              My Dashboard
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                closeMobile();
                handleLogout();
              }}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
