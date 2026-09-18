import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Users, 
  PlusCircle, 
  LogOut, 
  Shield, 
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="no-print bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to={isAdmin ? "/" : "/member/dashboard"} className="flex items-center space-x-2.5">
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

          {/* Navigation Links */}
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
          <div className="flex items-center space-x-3">
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

            <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-orange-500' : 'bg-amber-500'}`} />
                  {isAdmin ? 'Administrator' : 'Member'}
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
    </nav>
  );
}
