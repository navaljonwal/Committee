import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  BellRing
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { useAuth } from '../context/AuthContext';
import { usePopup } from '../context/PopupContext';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dateStr }) {
  const days = daysFromNow(dateStr);
  if (days === null) return null;
  if (days < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Overdue by {Math.abs(days)}d</span>;
  if (days === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">Due Today!</span>;
  if (days <= 3) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">In {days}d</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{formatDate(dateStr)}</span>;
}

export default function MemberDashboard() {
  const { user } = useAuth();
  const { toast } = usePopup();

  const [data, setData] = useState({ member: null, committees: [], myBids: [], pendingPayments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/member/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load member dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  const { member, committees, myBids, pendingPayments } = data;

  // Calculate current active month reminder per committee (only ONE current month per committee)
  const currentMonthReminders = committees.map((c) => {
    const commPending = pendingPayments.filter(
      (p) => p.committee_id === c.id || p.committee_name === c.name
    );
    if (commPending.length === 0) return null;

    const minMonth = Math.min(...commPending.map((p) => parseInt(p.month_no, 10)));
    const thisMonthPayments = commPending.filter(
      (p) => parseInt(p.month_no, 10) === minMonth
    );
    const totalDue = thisMonthPayments.reduce(
      (acc, p) => acc + parseFloat(p.total_due || 0),
      0
    );
    const penalty = thisMonthPayments.reduce(
      (acc, p) => acc + parseFloat(p.penalty_amount || 0),
      0
    );
    const drawDate = thisMonthPayments[0]?.draw_date;
    const seatsCount = thisMonthPayments.length;

    return {
      committee: c,
      monthNo: minMonth,
      totalDue,
      penalty,
      drawDate,
      seatsCount
    };
  }).filter(Boolean);

  const totalCurrentMonthDue = currentMonthReminders.reduce((acc, r) => acc + r.totalDue, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Member Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Namaste, {member ? member.name : user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              Check active committee installments, view payment sheets, and participate in live auctions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Current Month Due</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                ₹{totalCurrentMonthDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Current Month Payment Reminders (Only current active month per committee) ── */}
      {currentMonthReminders.length > 0 ? (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                <BellRing className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Current Month Installment Reminder ({currentMonthReminders.length})
                  </h2>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                    Due Now
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Is mahine ka installment samay par jama karein. Kisi bhi committee par click karke uski puri Payment Sheet dekhein.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Due</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                ₹{totalCurrentMonthDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {currentMonthReminders.map((r) => (
              <div
                key={r.committee.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/90 shadow-xs flex flex-col justify-between gap-4 hover:border-orange-400 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                      {r.committee.name}
                    </h3>
                    <div className="text-right shrink-0">
                      <div className="font-black text-base sm:text-lg text-rose-600 font-mono">
                        ₹{r.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      {r.penalty > 0 && (
                        <div className="text-[10px] font-semibold text-amber-600">
                          +₹{r.penalty} penalty
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      Month {r.monthNo} Installment
                    </span>
                    {r.seatsCount > 1 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                        {r.seatsCount} Seats Combined
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <DueBadge dateStr={r.drawDate} />
                  </div>

                  <Link
                    to={`/member/committees/${encodeId(r.committee.id)}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-md shadow-orange-600/20 active:scale-95"
                  >
                    <span>Open Payment Sheet</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-emerald-900">Sabhi Payments Up-to-date Hain! 🎉</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Is mahine ka koi bhi installment pending nahi hai.
            </p>
          </div>
        </div>
      )}

      {/* Enrolled Committees Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            My Enrolled Committees ({committees.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Click any committee to view its full Payment Sheet & Bidding Room
          </span>
        </div>

        {committees.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-500 text-xs font-medium">
            You are not enrolled in any committee yet. Contact the organizer to add you.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((c) => {
              const wonCount = parseInt(c.won_count || 0, 10);
              const seats = parseInt(c.seats || 1, 10);
              const remaining = Math.max(0, seats - wonCount);

              // Check if this committee has an active pending installment
              const commPending = pendingPayments.filter(
                (p) => p.committee_id === c.id || p.committee_name === c.name
              );
              const hasDue = commPending.length > 0;
              const nextMonth = hasDue ? Math.min(...commPending.map(p => parseInt(p.month_no, 10))) : null;

              return (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 flex flex-col justify-between hover:border-orange-300 hover:shadow-md transition duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {c.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                        {c.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-4">
                      <div className="text-xs text-slate-500 font-medium">Total Pool Value</div>
                      <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
                        ₹{parseFloat(c.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 font-medium">
                      <div className="flex items-center justify-between">
                        <span>My Seats Held:</span>
                        <span className="font-bold text-slate-800 font-mono">{seats} Seat(s)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Draws Won:</span>
                        <span className="font-bold text-orange-600 font-mono">{wonCount} Won / {remaining} Left</span>
                      </div>
                      {hasDue && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-amber-700 font-semibold">Active Round:</span>
                          <span className="font-bold text-amber-700 font-mono">Month {nextMonth} Due</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <Link
                      to={`/member/committees/${encodeId(c.id)}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-lg shadow-orange-600/25 active:scale-[0.98]"
                    >
                      <CreditCard className="w-4 h-4" /> View Payment Sheet & Bids
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Submitted Bids History */}
      {myBids.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            My Submitted Auction Bids History
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                {myBids.map((b) => (
                  <tr key={b.id} className="hover:bg-orange-50/30 transition duration-150">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{b.committee_name}</td>
                    <td className="py-3 px-4 font-sans">Month {b.month_no}</td>
                    <td className="py-3 px-4 text-right font-black text-orange-600">
                      ₹{parseFloat(b.bid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : b.status === 'rejected'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500 italic">
                      {b.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
