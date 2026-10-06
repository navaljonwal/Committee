import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Layers, 
  Users, 
  PlusCircle, 
  BellRing, 
  Shield, 
  LayoutDashboard, 
  ArrowRight,
  Command,
  IndianRupee,
  Phone,
  Calendar,
  X
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { useAuth } from '../context/AuthContext';

export default function CommandPalette({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [committees, setCommittees] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Pre-fetch committees and members for fast live filtering
      if (user) {
        setLoading(true);
        const isAdmin = user.role === 'admin';
        const p1 = isAdmin 
          ? api.get('/committees').catch(() => ({ data: { success: false } }))
          : api.get('/member/dashboard').catch(() => ({ data: { success: false } }));
        const p2 = isAdmin 
          ? api.get('/members').catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } });

        Promise.all([p1, p2]).then(([cRes, mRes]) => {
          if (cRes.data?.success) {
            setCommittees(cRes.data.committees || []);
          }
          if (mRes.data?.success) {
            setMembers(mRes.data.members || []);
          }
        }).finally(() => {
          setLoading(false);
        });
      }
    }
  }, [isOpen, user]);

  // Global shortcut: ⌘K, Ctrl+K, or Slash "/" when not in an input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // will be handled by parent if boolean
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = user?.role === 'admin';
  const q = query.trim().toLowerCase();

  // Navigation commands
  const defaultActions = [
    ...(isAdmin ? [
      {
        id: 'nav-committees',
        type: 'action',
        title: 'View All Committees',
        subtitle: 'Manage and monitor all active & past kametis',
        icon: Layers,
        path: '/'
      },
      {
        id: 'nav-create',
        type: 'action',
        title: 'Create New Committee',
        subtitle: 'Set up pool value, members count & monthly draws',
        icon: PlusCircle,
        path: '/committees/create'
      },
      {
        id: 'nav-members',
        type: 'action',
        title: 'Members Directory',
        subtitle: 'View member details, contact numbers & credentials',
        icon: Users,
        path: '/members'
      },
      {
        id: 'nav-reminders',
        type: 'action',
        title: 'Payment Reminders Center',
        subtitle: 'Send instant WhatsApp reminders for pending installments',
        icon: BellRing,
        path: '/reminders'
      },
      {
        id: 'nav-profile',
        type: 'action',
        title: 'Profile & Security',
        subtitle: 'Update account password & profile credentials',
        icon: Shield,
        path: '/profile'
      }
    ] : [
      {
        id: 'nav-member-dash',
        type: 'action',
        title: 'Member Dashboard',
        subtitle: 'View your enrolled kametis, dues & auction records',
        icon: LayoutDashboard,
        path: '/member/dashboard'
      }
    ])
  ];

  // Filter actions
  const filteredActions = defaultActions.filter(a => 
    !q || a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
  );

  // Filter committees
  const filteredCommittees = committees.filter(c => 
    !q || 
    c.name?.toLowerCase().includes(q) || 
    String(c.total_amount || '').includes(q) ||
    String(c.installment_per_member || '').includes(q)
  ).slice(0, 5);

  // Filter members (admin only)
  const filteredMembers = isAdmin ? members.filter(m => 
    !q || 
    m.name?.toLowerCase().includes(q) || 
    m.phone?.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  // Flattened results for keyboard navigation
  const allResults = [
    ...filteredCommittees.map(c => ({
      id: `comm-${c.id}`,
      type: 'committee',
      data: c,
      title: c.name,
      subtitle: `Pool: ₹${parseFloat(c.total_amount || 0).toLocaleString('en-IN')} • ${c.total_members} Months`,
      path: isAdmin ? `/committees/${encodeId(c.id)}` : `/member/committees/${encodeId(c.id)}`,
      icon: Layers
    })),
    ...filteredMembers.map(m => ({
      id: `mem-${m.id}`,
      type: 'member',
      data: m,
      title: m.name,
      subtitle: `Phone: ${m.phone || 'N/A'} • Enrolled seats: ${m.seats_count || 1}`,
      path: `/members`,
      icon: Users
    })),
    ...filteredActions.map(a => ({
      ...a,
      id: `act-${a.id}`
    }))
  ];

  const handleSelect = (item) => {
    if (item && item.path) {
      navigate(item.path);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (allResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allResults[selectedIndex];
      if (current) handleSelect(current);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/90 bg-slate-50/70">
          <Search className="w-5 h-5 text-orange-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search committees, members, kist, or quick actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-400 shadow-2xs">
              <Command className="w-3 h-3" /> K
            </kbd>
          )}
        </div>

        {/* Results Stream */}
        <div className="overflow-y-auto p-3 divide-y divide-slate-100 flex-1">
          {loading && allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
              <span>Indexing kametis and members...</span>
            </div>
          ) : allResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm space-y-1">
              <p className="font-semibold text-slate-700">No results found for "{query}"</p>
              <p className="text-xs text-slate-400">Try searching with committee title, pool amount, or member name.</p>
            </div>
          ) : (
            <div className="space-y-4 py-1">
              
              {/* Committees Section */}
              {filteredCommittees.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Committees & Kametis
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredCommittees.map((c) => {
                      const idx = allResults.findIndex(r => r.id === `comm-${c.id}`);
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelect({ path: isAdmin ? `/committees/${encodeId(c.id)}` : `/member/committees/${encodeId(c.id)}` })}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                            isSelected 
                              ? 'bg-orange-50 border border-orange-200 text-orange-950' 
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 truncate">{c.name}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                Pool: ₹{parseFloat(c.total_amount || 0).toLocaleString('en-IN')} • {c.total_members} Months
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase font-sans">
                            {c.status || 'Active'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Members Section */}
              {filteredMembers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Registered Members
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredMembers.map((m) => {
                      const idx = allResults.findIndex(r => r.id === `mem-${m.id}`);
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelect({ path: '/members' })}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                            isSelected 
                              ? 'bg-orange-50 border border-orange-200 text-orange-950' 
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {m.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 truncate">{m.name}</div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {m.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions Section */}
              {filteredActions.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Quick Navigation & Actions
                  </div>
                  <div className="space-y-1 mt-1">
                    {filteredActions.map((a) => {
                      const idx = allResults.findIndex(r => r.id === `act-${a.id}`);
                      const isSelected = selectedIndex === idx;
                      const Icon = a.icon;
                      return (
                        <div
                          key={a.id}
                          onClick={() => handleSelect(a)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition ${
                            isSelected 
                              ? 'bg-orange-50 border border-orange-200 text-orange-950' 
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-slate-900 truncate">{a.title}</div>
                              <div className="text-xs text-slate-500 truncate mt-0.5">{a.subtitle}</div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer Shortcut Guide */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-slate-400 font-sans font-medium hidden sm:inline">ChitFund Pro Live Search</span>
        </div>
      </div>
    </div>
  );
}
