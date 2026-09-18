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
  CheckCircle
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MemberDashboard() {
  const { user } = useAuth();

  const [data, setData] = useState({ member: null, committees: [], myBids: [], pendingPayments: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await api.get('/member/dashboard');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load member dashboard');
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

  const totalPendingAmount = pendingPayments.reduce((acc, p) => acc + parseFloat(p.total_due || 0), 0);

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
              Participate in live auction rounds, check your draw dates, and track installment dues
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl text-right shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Pending Dues</span>
              <span className="text-xl font-black text-rose-600 font-mono">
                ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 shadow-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Enrolled Committees Grid */}
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-orange-600" />
          My Enrolled Committees ({committees.length})
        </h2>

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
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                      to={`/member/committees/${c.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-lg shadow-orange-600/25 active:scale-[0.98]"
                    >
                      <Gavel className="w-4 h-4" /> Enter Live Bidding Room
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Payments Section */}
      {pendingPayments.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Pending Contribution Installments ({pendingPayments.length})
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Committee</th>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Seat #</th>
                  <th className="py-3 px-4 text-right">Installment (₹)</th>
                  <th className="py-3 px-4 text-right">Late Penalty (₹)</th>
                  <th className="py-3 px-4 text-right">Total Due (₹)</th>
                  <th className="py-3 px-4 text-center">Draw Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50/30 transition duration-150">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{p.committee_name}</td>
                    <td className="py-3 px-4 font-sans">Month {p.month_no}</td>
                    <td className="py-3 px-4 font-sans">Seat {p.seat_no}</td>
                    <td className="py-3 px-4 text-right font-medium">₹{parseFloat(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right text-amber-600 font-semibold">₹{parseFloat(p.penalty_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">₹{parseFloat(p.total_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-center font-sans text-slate-500">
                      {p.draw_date ? new Date(p.draw_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
