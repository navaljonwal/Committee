import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Layers, 
  IndianRupee, 
  CreditCard, 
  Gavel, 
  Award, 
  ArrowUpRight, 
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  Bell,
  BellRing,
  User,
  Shield,
  Phone,
  Eye,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageCircle,
  ChevronDown,
  Users,
  RefreshCw
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { useAuth } from '../context/AuthContext';
import { usePopup } from '../context/PopupContext';
import { openWhatsAppUrl } from '../utils/whatsapp';

function formatDate(dateStr, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  if (!dateStr) return '';
  try {
    const s = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    const d = new Date(s);
    if (isNaN(d.getTime())) {
      return String(dateStr).split('T')[0];
    }
    return d.toLocaleDateString('en-IN', options);
  } catch {
    return String(dateStr).split('T')[0];
  }
}

function daysFromNow(dateStr) {
  if (!dateStr) return null;
  try {
    const s = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    const due = new Date(s);
    if (isNaN(due.getTime())) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  } catch {
    return null;
  }
}

function DueBadge({ dateStr }) {
  const days = daysFromNow(dateStr);
  const formatted = formatDate(dateStr);
  if (days === null && !formatted) return null;
  if (days !== null && days < 0) return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 animate-live-red">Overdue by {Math.abs(days)}d</span>;
  if (days !== null && days === 0) return <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-live-glow">Due Today!</span>;
  if (days !== null && days <= 3 && days > 0) return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">In {days}d</span>;
  return formatted ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{formatted}</span> : null;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { toast } = usePopup();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMemberId = searchParams.get('memberId');

  const [selectedMemberId, setSelectedMemberId] = useState(queryMemberId || '');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ 
    member: null, 
    committees: [], 
    myBids: [], 
    pendingPayments: [],
    allMembers: []
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (targetId = selectedMemberId, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const url = targetId ? `/member/dashboard?memberId=${targetId}` : '/member/dashboard';
      const res = await api.get(url);
      if (res.data?.success) {
        setData(res.data);
        if (res.data.member?.id && user?.role === 'admin' && !targetId) {
          setSelectedMemberId(String(res.data.member.id));
        }
      }
    } catch (err) {
      console.error('Failed to load member dashboard:', err);
      toast.error(err.response?.data?.message || 'Failed to load member dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedMemberId);
  }, [selectedMemberId]);

  const handleMemberChange = (newId) => {
    setSelectedMemberId(newId);
    if (newId) {
      setSearchParams({ memberId: newId });
    } else {
      setSearchParams({});
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedMemberId, true);
  };

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Loading Member Dashboard...</span>
      </div>
    );
  }

  const member = data?.member || null;
  const committees = Array.isArray(data?.committees) ? data.committees.filter(Boolean) : [];
  const myBids = Array.isArray(data?.myBids) ? data.myBids.filter(Boolean) : [];
  const pendingPayments = Array.isArray(data?.pendingPayments) ? data.pendingPayments.filter(Boolean) : [];
  const allMembers = Array.isArray(data?.allMembers) ? data.allMembers.filter(Boolean) : [];

  // Calculate current active month reminder per committee (only ONE current month per committee)
  const currentMonthReminders = committees.map((c) => {
    if (!c || !c.id) return null;
    const commPending = pendingPayments.filter(
      (p) => p && (String(p.committee_id) === String(c.id) || p.committee_name === c.name)
    );
    if (commPending.length === 0) return null;

    const validMonths = commPending
      .map((p) => parseInt(p.month_no, 10))
      .filter((n) => !isNaN(n));
    
    const minMonth = validMonths.length > 0 ? Math.min(...validMonths) : 1;

    const thisMonthPayments = commPending.filter(
      (p) => parseInt(p.month_no, 10) === minMonth
    );
    const totalDue = thisMonthPayments.reduce(
      (acc, p) => acc + (parseFloat(p?.total_due) || 0),
      0
    );
    const penalty = thisMonthPayments.reduce(
      (acc, p) => acc + (parseFloat(p?.penalty_amount) || 0),
      0
    );
    const drawDate = thisMonthPayments[0]?.draw_date || null;
    const dueDate = thisMonthPayments[0]?.due_date || null;
    const graceDays = thisMonthPayments[0]?.payment_grace_days || 5;
    const penaltyPerSeat = thisMonthPayments[0]?.late_penalty_amount || 100;
    const seatsCount = thisMonthPayments.length;

    return {
      committee: c,
      monthNo: minMonth,
      totalDue,
      penalty,
      drawDate,
      dueDate,
      graceDays,
      penaltyPerSeat,
      seatsCount
    };
  }).filter(Boolean);

  const totalCurrentMonthDue = currentMonthReminders.reduce(
    (acc, r) => acc + (parseFloat(r?.totalDue) || 0),
    0
  );
  const totalWonDraws = committees.reduce(
    (acc, c) => acc + (parseInt(c?.won_count, 10) || 0),
    0
  );
  const totalSeats = committees.reduce(
    (acc, c) => acc + (parseInt(c?.seats, 10) || 1),
    0
  );

  const displayName = String(member?.name || user?.name || 'Member');
  const displayPhone = String(member?.phone || user?.phone || '');
  const memberInitials = (displayName || 'M').substring(0, 2).toUpperCase();

  const handleShareWhatsApp = (targetMember) => {
    const m = targetMember || member;
    if (!m) return;

    const rawPass = m.plain_password || '';
    const loginUser = m.phone || m.user_email || `member${m.id}@kameti.com`;
    const loginUrl = `${window.location.origin}/login`;

    const message = `Namaste ${m.name} ji! 🙏\n\nAapka Kameti / ChitFund Pro Portal Login Details:\n\n🌐 *Login Portal:* ${loginUrl}\n👤 *User ID / Mobile:* ${loginUser}\n🔑 *Password:* ${rawPass || '(Aapka set kiya hua password)'}\n\nAap is link par login karke apni sabhi active kametis, mahine ki kist aur live auction bids dekh sakte hain.\n\nDhanyawad! ✨`;

    let phoneClean = (m.phone || '').replace(/[^0-9]/g, '');
    let waUrl = '';

    if (phoneClean) {
      if (phoneClean.length === 10) {
        phoneClean = '91' + phoneClean;
      }
      waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
    } else {
      waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }

    openWhatsAppUrl(waUrl);
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* ── MNC-Grade Admin Switcher Bar ── */}
      {user?.role === 'admin' && allMembers.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Shield className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                    Admin Impersonation Mode
                  </span>
                  <span className="text-xs text-indigo-200/70 hidden sm:inline">• Live Member View</span>
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  Member Portal Preview & Passbook Inspector
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition border border-white/10"
                title="Refresh Member Dashboard Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition border border-white/10"
              >
                <span>Admin Home</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Member Selector Dropdown & Info */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5 border-t border-indigo-500/20 items-center">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-semibold text-indigo-200 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select Member to View Dashboard ({allMembers.length} Members Registered):</span>
              </label>
              <div className="relative">
                <select
                  value={member?.id ? String(member.id) : (selectedMemberId || '')}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full bg-slate-800/90 border border-indigo-400/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer appearance-none pr-10"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={String(m.id)} className="bg-slate-900 text-white">
                      {m.name} {m.phone ? `(${m.phone})` : ''} — {m.enrolled_count || 0} Kameti(s)
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-indigo-300">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4 flex items-end justify-start sm:justify-end gap-2 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(member)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 active:scale-95"
                title="Send login credentials to this member via WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Login via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MNC-Grade Member Header Card ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 relative overflow-hidden shadow-xl border border-slate-700/50">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg shadow-orange-500/30 border-2 border-white/20">
                {memberInitials}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" title="Active Member" />
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-orange-300 text-[10px] font-bold mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {user?.role === 'admin' ? `Admin Previewing Member #${member?.id || ''}` : 'Verified Member'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                Namaste, {displayName}! 👋
              </h1>
              {displayPhone && (
                <p className="text-xs text-slate-300 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" /> {displayPhone}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar (MNC FinTech Style) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-white/5 backdrop-blur-md p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-white/10">
            <div className="text-center sm:text-left px-2">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Due This Month
              </span>
              <span className="text-base sm:text-xl font-black text-rose-400 font-mono mt-0.5 block">
                ₹{(Number(totalCurrentMonthDue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
            </div>

            <div className="text-center sm:text-left px-2 border-x border-white/10">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                My Kametis
              </span>
              <span className="text-base sm:text-xl font-black text-white font-mono mt-0.5 block">
                {committees.length} <span className="text-xs font-sans text-slate-400 font-normal">({totalSeats}s)</span>
              </span>
            </div>

            <div className="text-center sm:text-left px-2">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Won Draws
              </span>
              <span className="text-base sm:text-xl font-black text-amber-400 font-mono mt-0.5 block">
                {totalWonDraws} Won
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Current Month Payment Reminders (High Priority Urgent Card) ── */}
      {currentMonthReminders.length > 0 ? (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                <BellRing className="w-5 h-5 text-white animate-bell-shake" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Current Installment Due ({currentMonthReminders.length})
                  </h2>
                  <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                    Action Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Is mahine ka installment samay par jama karein penalty se bachne ke liye.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-amber-200 sm:border-0">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Pending Now:</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono">
                ₹{(Number(totalCurrentMonthDue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {currentMonthReminders.map((r) => {
              if (!r || !r.committee) return null;
              return (
                <div
                  key={r.committee.id || r.monthNo}
                  className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col justify-between gap-3.5 hover:border-orange-400 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                          {r.committee.name || 'Kameti'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px]">
                            Month {r.monthNo} Installment
                          </span>
                          {r.seatsCount > 1 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {r.seatsCount} Seats Combined
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-lg text-rose-600 font-mono leading-none">
                          ₹{(Number(r.totalDue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </div>
                        {r.penalty > 0 ? (
                          <div className="text-[10px] font-bold text-rose-600 mt-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            +₹{r.penalty} late fee
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1">
                            ₹{r.penaltyPerSeat}/seat penalty after {r.graceDays}d
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                      {r.drawDate && (
                        <span>Bidding: <strong className="text-slate-700">{formatDate(r.drawDate, { day: '2-digit', month: 'short' })}</strong></span>
                      )}
                      {r.dueDate && (
                        <span>Due: <strong className="text-amber-700">{formatDate(r.dueDate, { day: '2-digit', month: 'short' })}</strong></span>
                      )}
                      <DueBadge dateStr={r.dueDate || r.drawDate} />
                    </div>

                    <Link
                      to={`/member/committees/${encodeId(r.committee.id)}${user?.role === 'admin' && member?.id ? `?memberId=${member.id}` : ''}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 active:scale-95"
                    >
                      <span>View Sheet & Pay</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : committees.length > 0 ? (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-emerald-950">Sabhi Payments Up-to-date Hain! 🎉</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Is mahine ka aapka koi bhi installment pending nahi hai. Next round ki date notice par dekhein.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── When Member Has 0 Kametis Enrolled ── */}
      {committees.length === 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center space-y-3.5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Layers className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {displayName} Abhi Kisi Bhi Kameti Mein Shamil Nahi Hain
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {user?.role === 'admin' 
                ? 'Is member ko kisi bhi kameti mein add nahi kiya gaya hai. Upar dropdown se doosra member select karein ya Committees page par jaakar member ko seat allot karein.' 
                : 'Aapke is registered account par abhi koi active kameti assign nahi hui hai. Kripya apne Committee Organizer se sampark karein taaki wo aapko Kameti group mein add karein.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            {user?.role === 'admin' ? (
              <Link
                to="/committees"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-md"
              >
                <span>View Committees & Enroll Members</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(`Namaste, mera naam ${displayName} hai (${displayPhone}). Kripya mujhe Kameti group mein add karein.`);
                  openWhatsAppUrl(`https://wa.me/?text=${text}`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-700/20 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact Organizer on WhatsApp</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Enrolled Committees Section (MNC Banking Passbook Style) ── */}
      {committees.length > 0 && (
        <div id="my-kametis" className="scroll-mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <span>My Enrolled Kametis ({committees.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Click any committee to open full statement & auction bids
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {committees.map((c) => {
              if (!c || !c.id) return null;
              const wonCount = parseInt(c.won_count || 0, 10);
              const seats = parseInt(c.seats || 1, 10);
              const remaining = Math.max(0, seats - wonCount);
              const totalMonths = parseInt(c.total_members || c.schedules_count || 20, 10);
              const poolAmount = parseFloat(c.total_amount || 0);
              const monthlyAmount = totalMonths > 0 ? Math.round(poolAmount / totalMonths) : 0;

              // Check if this committee has an active pending installment
              const commPending = pendingPayments.filter(
                (p) => p && (String(p.committee_id) === String(c.id) || p.committee_name === c.name)
              );
              const hasDue = commPending.length > 0;
              const nextMonth = hasDue ? Math.min(...commPending.map(p => parseInt(p.month_no, 10)).filter(n => !isNaN(n))) : null;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between hover:border-orange-300 hover:shadow-md transition duration-200 group"
                >
                  <div>
                    {/* Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-orange-600 transition leading-snug">
                          {c.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {totalMonths} Months Duration
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        c.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Financial Metrics Box */}
                    <div className="grid grid-cols-2 gap-2 bg-gradient-to-r from-orange-50/60 to-amber-50/40 p-3 rounded-xl border border-orange-100 mb-3.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Pool Value
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
                          ₹{(Number(poolAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="border-l border-orange-200/60 pl-2.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Monthly / Seat
                        </span>
                        <span className="text-base sm:text-lg font-black text-orange-600 font-mono mt-0.5 block">
                          ₹{(Number(monthlyAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Seat & Winning Breakdown */}
                    <div className="space-y-2 text-xs text-slate-600 font-medium">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">My Seats Held:</span>
                        <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                          {seats} Seat(s)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Draws Status:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          <span className="text-emerald-600">{wonCount} Won</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-600">{remaining} Left</span>
                        </span>
                      </div>

                      {hasDue && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            Active Installment:
                          </span>
                          <span className="font-black text-rose-600 font-mono">
                            Month {nextMonth} Due
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Passbook & Action CTA */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link
                      to={`/member/committees/${encodeId(c.id)}${user?.role === 'admin' && member?.id ? `?memberId=${member.id}` : ''}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 active:scale-[0.98]"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Open Passbook & Live Bids</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── My Submitted Bids History (FinTech style) ── */}
      {myBids.length > 0 && (
        <div className="bg-white border border-slate-200/90 shadow-2xs rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <span>My Auction Bids History ({myBids.length})</span>
            </h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Committee</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">My Bid Deduction (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {myBids.map((b) => {
                  if (!b) return null;
                  return (
                    <tr key={b.id} className="hover:bg-orange-50/30 transition duration-150">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{b.committee_name || '-'}</td>
                      <td className="py-3 px-4 font-sans">Month {b.month_no}</td>
                      <td className="py-3 px-4 text-right font-black text-orange-600">
                        ₹{(Number(b.bid_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          b.status === 'approved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : b.status === 'rejected'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {String(b.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-500 italic">
                        {b.remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Bid Cards (FinTech style) */}
          <div className="md:hidden space-y-2.5">
            {myBids.map((b) => {
              if (!b) return null;
              return (
                <div key={b.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-900">{b.committee_name || '-'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-mono">
                      Month {b.month_no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-mono">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">My Bid Deduction</span>
                      <span className="text-sm font-black text-orange-600">
                        ₹{(Number(b.bid_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-sans ${
                        b.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : b.status === 'rejected'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {String(b.status || 'pending').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {b.remarks && (
                    <p className="text-[10px] text-slate-400 italic pt-0.5">{b.remarks}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick Help & Contact Organizer Footer ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Need Help or Payment Verification?</h4>
            <p className="text-[11px] text-slate-500">Contact your Kameti Organizer for cash receipts or payment clearance.</p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          ChitFund Pro • 100% Verified Ledger
        </div>
      </div>

    </div>
  );
}
