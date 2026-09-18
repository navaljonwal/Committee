import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  IndianRupee, 
  Users, 
  Award, 
  Banknote, 
  Gavel, 
  FileSpreadsheet, 
  Printer, 
  Edit, 
  AlertCircle,
  ExternalLink,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/client';
import WinnerModal from '../components/WinnerModal';
import PayoutModal from '../components/PayoutModal';
import BiddingModal from '../components/BiddingModal';
import { encodeId } from '../utils/hashids';

export default function CommitteeDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [approvingBidId, setApprovingBidId] = useState(null);
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  // Modals state
  const [activeWinnerSchedule, setActiveWinnerSchedule] = useState(null);
  const [activePayoutSchedule, setActivePayoutSchedule] = useState(null);
  const [activeBiddingSchedule, setActiveBiddingSchedule] = useState(null);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/committees/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load committee details');
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const res = await api.get(`/committees/${id}`);
      if (res.data?.success) {
        setData(res.data);
      }
    } catch {
      // silent background refresh
    }
  };

  useEffect(() => {
    loadDetail();

    // Auto-poll every 3.5s to show live bids without page refresh
    const interval = setInterval(() => {
      silentRefresh();
    }, 3500);

    return () => clearInterval(interval);
  }, [id]);

  const handleQuickApproveBid = async (bid, scheduleMonthNo) => {
    if (!window.confirm(`Approve top bid of ₹${parseFloat(bid.bid_amount).toLocaleString('en-IN')} by ${bid.member_name} for Month ${scheduleMonthNo}?\n\nThis will set ${bid.member_name} as the winner and calculate payout accordingly.`)) {
      return;
    }
    setApprovingBidId(bid.id);
    setErrorMsg('');
    try {
      const res = await api.post(`/committees/schedules/bids/${encodeId(bid.id)}/approve`);
      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Bid approved successfully!');
        silentRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to approve bid');
    } finally {
      setApprovingBidId(null);
    }
  };

  const handleToggleFutureVisibility = async () => {
    setTogglingVisibility(true);
    setErrorMsg('');
    try {
      const committeeParam = (typeof id === 'string' && !/^\d+$/.test(id)) ? id : encodeId(id);
      const res = await api.post(`/committees/${committeeParam}/toggle-future-visibility`);
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setData(prev => {
          if (!prev || !prev.committee) return prev;
          return {
            ...prev,
            committee: {
              ...prev.committee,
              show_future_installments: res.data.show_future_installments
            }
          };
        });
        silentRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update visibility');
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleToggleScheduleVisibility = async (schedId) => {
    setErrorMsg('');
    try {
      const schedParam = (typeof schedId === 'string' && !/^\d+$/.test(schedId)) ? schedId : encodeId(schedId);
      const res = await api.post(`/committees/schedules/${schedParam}/toggle-installment-visibility`);
      if (res.data?.success) {
        setSuccessMsg(res.data.message);
        setData(prev => {
          if (!prev || !prev.schedules) return prev;
          return {
            ...prev,
            schedules: prev.schedules.map(s => 
              s.id === schedId ? { ...s, is_installment_visible: res.data.is_installment_visible } : s
            )
          };
        });
        silentRefresh();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update month visibility');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading Committee Schedule...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.committee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-lg font-bold text-slate-900">Committee Not Found</h2>
        <Link to="/" className="text-xs text-orange-600 hover:underline mt-2 inline-block font-semibold">Return to Dashboard</Link>
      </div>
    );
  }

  const { committee, schedules, members, totals } = data;
  const isCompleted = committee.status === 'completed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back and Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Committees
        </Link>

        <div className="flex items-center flex-wrap gap-2">
          <Link
            to={`/committees/${id}/edit`}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Committee
          </Link>

          <a
            href={`/api/committees/${id}/export/csv`}
            download
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </a>

          <Link
            to={`/committees/${id}/print`}
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-orange-500" /> Print A4
          </Link>
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold hover:text-emerald-900">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center justify-between shadow-xs">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 font-bold hover:text-rose-900">×</button>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {committee.name}
              </h1>
              <span className={`text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                committee.status === 'active' 
                  ? 'bg-orange-50 text-orange-700 border-orange-200' 
                  : isCompleted 
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {committee.status}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
              <span>Start: <strong className="text-slate-800 font-sans">{committee.start_date ? new Date(committee.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</strong></span>
              <span>•</span>
              <span>Rounds: <strong className="text-slate-800 font-sans">{committee.total_members} Months</strong></span>
              <span>•</span>
              <span>Rate: <strong className="text-orange-600 font-sans">{committee.deduction_rate}%</strong></span>
              <span>•</span>
              <span>Zero-Deduct Round: <strong className="text-amber-600 font-sans">{committee.special_month_index > 0 ? `Month ${committee.total_members - committee.special_month_index + 1}` : 'None'}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pool Value (V)</span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                ₹{parseFloat(committee.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Enrolled Members Horizontal Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-slate-700">
              Enrolled Members ({members.length} members holding {members.reduce((acc, m) => acc + parseInt(m.seats || 1, 10), 0)}/{committee.total_members} seats):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-h-20 overflow-y-auto">
            {members.map(m => (
              <span key={m.id} className="text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
                <span className="font-semibold text-slate-900">{m.name}</span>
                {m.seats > 1 && (
                  <span className="bg-orange-100 text-orange-800 px-1 rounded text-[10px] font-bold">
                    {m.seats} seats
                  </span>
                )}
                {m.won_count > 0 && (
                  <Award className="w-3.5 h-3.5 text-amber-500" title={`Won ${m.won_count} round(s)`} />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Table Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Draw Matrix & Kisht Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review monthly payouts, manage draw winners, auction deductions, disbursements, and collection ledgers
            </p>
          </div>
        </div>

        {/* Member Visibility Control Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl flex-shrink-0 ${committee.show_future_installments ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {committee.show_future_installments ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Member Payment Ledger Visibility:</span>
                {committee.show_future_installments ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    All Future Installments Visible to Members
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                    Next Months Hidden from Members (Default)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {committee.show_future_installments
                  ? 'Members can see estimated installment & total amounts for all future rounds in their ledger.'
                  : 'Members only see Month & Draw Date for upcoming rounds. Installments show "—" until draw is done or unlocked.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleFutureVisibility}
            disabled={togglingVisibility || isCompleted}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer disabled:opacity-40 ${
              committee.show_future_installments
                ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {committee.show_future_installments ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                Hide Future from Members
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Show Future to Members
              </>
            )}
          </button>
        </div>

        <div className="sm:hidden text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
          ← Scroll sideways to see all columns & actions →
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-orange-50/70 text-slate-800 uppercase tracking-wider font-bold border-b border-orange-200">
              <tr>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3 text-right">Deduction (₹)</th>
                <th className="py-3 px-3 text-right">Net Payout (₹)</th>
                <th className="py-3 px-3 text-right">Kist / Member (₹)</th>
                <th className="py-3 px-4">Winner / Live Bids</th>
                <th className="py-3 px-3 text-center">Draw Date</th>
                <th className="py-3 px-3 text-center">Disbursement</th>
                <th className="py-3 px-3 text-center">Payments</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {schedules.map((s) => {
                const isSpecial = (s.index_n === parseInt(committee.special_month_index, 10));
                const pStats = s.payment_stats || { total: 0, paid_count: 0 };
                const allPaid = pStats.total > 0 && pStats.paid_count === pStats.total;

                return (
                  <tr 
                    key={s.id} 
                    className={`hover:bg-orange-50/30 transition ${
                      s.is_custom_bid 
                        ? 'bg-orange-50/40' 
                        : isSpecial 
                          ? 'bg-amber-50/50' 
                          : ''
                    }`}
                  >
                    
                    {/* Month # */}
                    <td className="py-3 px-3 font-sans font-extrabold text-slate-900 whitespace-nowrap">
                      Month {s.month_no}
                    </td>

                    {/* Deduction */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-semibold text-slate-900">
                      <div>₹{parseFloat(s.deduction_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      {s.is_custom_bid ? (
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 block mt-0.5">
                          Auction Bid
                        </span>
                      ) : isSpecial ? (
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 block mt-0.5">
                          Zero Deduction
                        </span>
                      ) : null}
                    </td>

                    {/* Net Payout */}
                    <td className="py-3 px-3 text-right font-bold text-orange-600 whitespace-nowrap">
                      ₹{parseFloat(s.net_payout).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Installment */}
                    <td className="py-3 px-3 text-right text-slate-900 font-semibold whitespace-nowrap">
                      ₹{parseFloat(s.installment_per_member).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Winner / Live Bids */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      {s.winner_name ? (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900">{s.winner_name}</span>
                            {s.is_custom_bid ? (
                              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                Auction Winner
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : s.bids && s.bids.length > 0 ? (
                        <div className="space-y-1.5 py-0.5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-300 text-orange-950 shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600"></span>
                            </span>
                            <span className="font-extrabold text-xs font-mono text-orange-700">
                              ₹{parseFloat(s.bids[0].bid_amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              ({s.bids[0].member_name})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuickApproveBid(s.bids[0], s.month_no)}
                              disabled={isCompleted || approvingBidId === s.bids[0].id}
                              className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-xs hover:shadow transition disabled:opacity-50 cursor-pointer"
                              title={`Approve ₹${parseFloat(s.bids[0].bid_amount).toLocaleString('en-IN')} bid by ${s.bids[0].member_name}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              {approvingBidId === s.bids[0].id ? 'Approving...' : 'Approve (स्वीकार करें)'}
                            </button>

                            {s.bids.length > 1 && (
                              <button
                                onClick={() => setActiveBiddingSchedule(s)}
                                className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                                title="View all bids"
                              >
                                +{s.bids.length - 1} more
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending Draw</span>
                      )}
                    </td>

                    {/* Draw Date */}
                    <td className="py-3 px-3 text-center font-sans text-slate-600 font-medium whitespace-nowrap">
                      {s.draw_date ? new Date(s.draw_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>

                    {/* Payout Status */}
                    <td className="py-3 px-3 text-center font-sans whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        s.payout_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {s.payout_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>

                    {/* Payment stats */}
                    <td className="py-3 px-3 text-center font-sans whitespace-nowrap">
                      <Link
                        to={`/schedules/${encodeId(s.id)}/payments`}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold inline-flex items-center gap-1 transition ${
                          allPaid
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-700'
                        }`}
                      >
                        {pStats.paid_count}/{pStats.total} Paid
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    </td>

                    {/* Quick Row Actions */}
                    <td className="py-3 px-3 text-right font-sans whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        
                        {/* Winner Button */}
                        <button
                          onClick={() => setActiveWinnerSchedule(s)}
                          disabled={isCompleted}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-40"
                          title="Assign Winner"
                        >
                          <Award className="w-4 h-4" />
                        </button>

                        {/* Bidding Button */}
                        <button
                          onClick={() => setActiveBiddingSchedule(s)}
                          disabled={isCompleted}
                          className="relative p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-40"
                          title={`Auction Bidding & Deduction (${s.bids?.length || 0} bids)`}
                        >
                          <Gavel className="w-4 h-4" />
                          {s.bids && s.bids.length > 0 && !s.winner_name && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[9px] font-bold text-white shadow-xs">
                              {s.bids.length}
                            </span>
                          )}
                        </button>

                        {/* Payout Button */}
                        <button
                          onClick={() => setActivePayoutSchedule(s)}
                          disabled={isCompleted}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40"
                          title="Disburse Payout"
                        >
                          <Banknote className="w-4 h-4" />
                        </button>

                        {/* Member Visibility Toggle for this Month */}
                        <button
                          onClick={() => handleToggleScheduleVisibility(s.id)}
                          disabled={isCompleted}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-40 cursor-pointer"
                          title={
                            s.is_installment_visible || committee.show_future_installments
                              ? `Month ${s.month_no} installment is VISIBLE to members. Click to toggle.`
                              : `Month ${s.month_no} installment is HIDDEN from members. Click to reveal.`
                          }
                        >
                          {s.is_installment_visible || committee.show_future_installments ? (
                            <Eye className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
            
            {/* Grand Totals */}
            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900 font-mono">
              <tr>
                <td className="py-3.5 px-3 font-sans font-extrabold">GRAND TOTALS</td>
                <td className="py-3.5 px-3 text-right text-amber-700">
                  ₹{totals.grand_total_deductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right text-orange-600 font-extrabold">
                  ₹{totals.grand_total_net_payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3.5 px-3 text-right text-slate-900 font-extrabold">
                  ₹{totals.grand_total_kist_per_member.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td colSpan="5" className="py-3.5 px-3 font-sans text-xs text-slate-600 text-right">
                  Total Individual Contribution: <strong className="text-slate-900 font-mono">₹{totals.grand_total_kist_per_member.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modals */}
      <WinnerModal
        isOpen={Boolean(activeWinnerSchedule)}
        onClose={() => setActiveWinnerSchedule(null)}
        schedule={activeWinnerSchedule}
        members={members}
        onSaveSuccess={(msg) => {
          setSuccessMsg(msg);
          loadDetail();
        }}
      />

      <PayoutModal
        isOpen={Boolean(activePayoutSchedule)}
        onClose={() => setActivePayoutSchedule(null)}
        schedule={activePayoutSchedule}
        onSaveSuccess={(msg) => {
          setSuccessMsg(msg);
          loadDetail();
        }}
      />

      <BiddingModal
        isOpen={Boolean(activeBiddingSchedule)}
        onClose={() => setActiveBiddingSchedule(null)}
        schedule={activeBiddingSchedule}
        onSaveSuccess={(msg) => {
          setSuccessMsg(msg);
          loadDetail();
        }}
      />

    </div>
  );
}
