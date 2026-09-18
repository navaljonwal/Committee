import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gavel, 
  Calendar, 
  IndianRupee, 
  Award, 
  Check, 
  Clock, 
  AlertCircle, 
  Radio, 
  CheckCircle2, 
  TrendingUp, 
  CreditCard,
  BellRing
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';

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

export default function MemberCommittee() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [liveBidsData, setLiveBidsData] = useState({ bids: {}, highest_bids: {}, lock_status: {} });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('payments');

  // Bid submission state
  const [activeBidScheduleId, setActiveBidScheduleId] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidRemarks, setBidRemarks] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/member/committees/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load committee');
    } finally {
      setLoading(false);
    }
  };

  const pollLiveBids = async () => {
    try {
      const res = await api.get(`/member/committees/${id}/live-bids`);
      if (res.data) {
        setLiveBidsData(res.data);
      }
    } catch (err) {
      // silent poll error
    }
  };

  useEffect(() => {
    loadInitialData();
    pollLiveBids();

    // Fast 2.5s auto-polling as rock-solid background fallback
    const interval = setInterval(pollLiveBids, 2500);

    // Instant Real-Time Live Bidding via Server-Sent Events (SSE)
    let eventSource = null;
    const token = localStorage.getItem('kameti_token') || localStorage.getItem('token') || '';
    try {
      const baseUrl = api.defaults.baseURL || '/api';
      const streamUrl = `${baseUrl}/member/committees/${id}/live-stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const streamData = JSON.parse(event.data);
          if (streamData && streamData.bids) {
            setLiveBidsData(streamData);
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch {
      // EventSource fallback to polling
    }

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [id]);

  const handleOpenBid = (schedule) => {
    setActiveBidScheduleId(schedule.id);
    const myBid = data?.myBids?.[schedule.id];
    const topBid = liveBidsData?.highest_bids?.[schedule.id];
    const minNext = topBid?.min_next_bid || parseFloat(schedule.deduction_amount || 0);

    setBidAmount(myBid ? myBid.bid_amount : minNext);
    setBidRemarks(myBid ? (myBid.remarks || '') : '');
    setErrorMsg('');
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBid(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/member/schedules/${encodeId(activeBidScheduleId)}/bid`, {
        bid_amount: parseFloat(bidAmount),
        remarks: bidRemarks
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setActiveBidScheduleId(null);
        if (res.data.data) {
          setLiveBidsData(res.data.data);
        } else {
          pollLiveBids();
        }
        loadInitialData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.committee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-800 font-medium">
        Committee not found or you are not enrolled.
      </div>
    );
  }

  const { committee, schedules, totalSeats, wonCount, remainingSeats, alreadyWonAllSeats, myPayments } = data;
  const { bids, highest_bids, lock_status } = liveBidsData;

  // Calculate current active month reminder for this committee (first pending month)
  const currentPendingSchedule = schedules?.find((s) => {
    const pList = myPayments?.[s.id] || [];
    return pList.some((p) => p.payment_status === 'pending');
  });

  const pendingPaymentsForCurrentMonth = currentPendingSchedule
    ? (myPayments?.[currentPendingSchedule.id] || []).filter((p) => p.payment_status === 'pending')
    : [];

  const currentMonthDue = pendingPaymentsForCurrentMonth.reduce(
    (acc, p) => acc + (parseFloat(p.amount_paid) + parseFloat(p.penalty_amount || 0)),
    0
  );
  const currentMonthPenalty = pendingPaymentsForCurrentMonth.reduce(
    (acc, p) => acc + parseFloat(p.penalty_amount || 0),
    0
  );

  // Overall payment statistics for this committee
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;
  let totalPenaltyAmount = 0;

  if (schedules && myPayments) {
    for (const s of schedules) {
      const pList = myPayments[s.id] || [];
      const isPastOrDue = !currentPendingSchedule || s.month_no <= currentPendingSchedule.month_no;
      const isSchedVisible = 
        isPastOrDue || 
        Boolean(s.winner_name) || 
        Boolean(s.is_custom_bid && s.custom_deduction_amount !== null && s.is_custom_bid !== '0' && s.is_custom_bid !== 0) || 
        Boolean(committee.show_future_installments && committee.show_future_installments !== '0' && committee.show_future_installments !== 0) || 
        Boolean(s.is_installment_visible && s.is_installment_visible !== '0' && s.is_installment_visible !== 0);

      for (const p of pList) {
        const amt = parseFloat(p.amount_paid || 0);
        const pen = parseFloat(p.penalty_amount || 0);
        if (p.payment_status === 'paid') {
          totalPaidAmount += amt;
        } else if (isSchedVisible) {
          totalPendingAmount += (amt + pen);
          totalPenaltyAmount += pen;
        }
      }
    }
  }

  const paidMonthsCount = schedules?.filter(s => {
    const pList = myPayments?.[s.id] || [];
    return pList.length > 0 && pList.every(p => p.payment_status === 'paid');
  }).length || 0;
  const pendingMonthsCount = (schedules?.length || 0) - paidMonthsCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/member/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-4" />
          Real-Time Live Auction Active (Instant Sync)
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs font-medium">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-base">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between shadow-xs font-medium">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 font-bold text-base">×</button>
        </div>
      )}

      {/* Committee Overview Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {committee.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3 font-medium">
              <span>Pool Value: <strong className="text-orange-600 font-mono font-bold">₹{parseFloat(committee.total_amount).toLocaleString('en-IN')}</strong></span>
              <span>•</span>
              <span>Total Duration: <strong className="text-slate-800 font-sans font-bold">{committee.total_members} Months</strong></span>
              <span>•</span>
              <span>My Registration: <strong className="text-slate-800 font-sans font-bold">{totalSeats} Seat(s)</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-amber-600 font-sans font-bold">{wonCount} Won ({remainingSeats} Left to Win)</strong></span>
            </p>
          </div>

          {alreadyWonAllSeats && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>You have won draws for all {totalSeats} of your registered seats in this committee.</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Committee Payment Reminder Card ── */}
      {currentPendingSchedule ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black text-slate-900">
                  Current Month Installment Reminder (चालू माह किस्त अनुस्मारक)
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wide">
                  Month {currentPendingSchedule.month_no} Due
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-2 flex-wrap">
                <span>Draw Date: <strong className="text-slate-800">{currentPendingSchedule.draw_date ? formatDate(currentPendingSchedule.draw_date) : 'Upcoming'}</strong></span>
                {daysFromNow(currentPendingSchedule.draw_date) !== null && (
                  <DueBadge dateStr={currentPendingSchedule.draw_date} />
                )}
                {pendingPaymentsForCurrentMonth.length > 1 && (
                  <span className="text-slate-500 font-semibold">({pendingPaymentsForCurrentMonth.length} Seats Combined)</span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Amount Due</span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
              ₹{currentMonthDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {currentMonthPenalty > 0 && (
              <span className="text-[11px] text-amber-600 font-semibold block">
                (+₹{currentMonthPenalty} late penalty)
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-emerald-900">Sabhi Installments Up-to-date Hain! 🎉</h3>
            <p className="text-xs text-emerald-700 mt-0.5">
              Is committee ke aapke sabhi installments jama ho chuke hain. Koi pending installment nahi hai.
            </p>
          </div>
        </div>
      )}

      {/* ── View Toggle Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('payments')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'payments'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
              : 'bg-white text-slate-600 hover:bg-orange-50 border border-slate-200 hover:border-orange-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>My Payment Sheet (भुगतान पत्र)</span>
        </button>

        <button
          onClick={() => setActiveTab('auction')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'auction'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
              : 'bg-white text-slate-600 hover:bg-orange-50 border border-slate-200 hover:border-orange-200'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Auction Rounds & Bids (नीलामी कक्ष)</span>
        </button>
      </div>

      {/* ── Tab 1: Payment Sheet ── */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Pool Value</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                ₹{parseFloat(committee.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{committee.total_members} Total Months</span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Installments Paid</span>
              <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
                ₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-emerald-600 mt-0.5 block">{paidMonthsCount} Month(s) Cleared</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                {committee.show_future_installments ? 'Installments Pending' : 'Current Due Amount'}
              </span>
              <span className="text-xl font-black text-rose-600 font-mono mt-1 block">
                ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-amber-700 mt-0.5 block">
                {pendingMonthsCount} Month(s) Remaining {!committee.show_future_installments && '• Next months on draw'}
              </span>
            </div>
          </div>

          {/* Payment Sheet Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span>My Committee Payment Ledger ({schedules.length} Months)</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {totalSeats} Registered Seat{totalSeats > 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4">Draw Date</th>
                    <th className="py-3 px-4 text-center">Seats</th>
                    <th className="py-3 px-4 text-right">Installment (₹)</th>
                    <th className="py-3 px-4 text-right">Penalty (₹)</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4">Round Winner / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {schedules.map((s) => {
                    const payments = myPayments?.[s.id] || [];
                    const isCurrentDue = s.id === currentPendingSchedule?.id;

                    const hasPayments = payments.length > 0;
                    const seatsCount = hasPayments ? payments.length : (totalSeats || 1);
                    const totalBaseAmount = hasPayments
                      ? payments.reduce((acc, p) => acc + parseFloat(p.amount_paid || 0), 0)
                      : parseFloat(s.installment_per_member || 0) * seatsCount;
                    const totalPenalty = hasPayments
                      ? payments.reduce((acc, p) => acc + parseFloat(p.penalty_amount || 0), 0)
                      : 0;
                    const totalDue = totalBaseAmount + totalPenalty;

                    // Status across seats for this month
                    const allPaid = hasPayments && payments.every(p => p.payment_status === 'paid');
                    const anyPaid = hasPayments && payments.some(p => p.payment_status === 'paid');
                    const paidDate = payments.find(p => p.payment_date)?.payment_date;

                    // Visibility for this month's installment details:
                    // Paid months, current due month, and rounds with finalized winners/bids are always visible.
                    // Future upcoming rounds are hidden unless enabled by admin.
                    const isInstallmentVisible = 
                      allPaid || 
                      isCurrentDue || 
                      Boolean(s.winner_name) || 
                      Boolean(s.is_custom_bid && s.custom_deduction_amount !== null && s.is_custom_bid !== '0' && s.is_custom_bid !== 0) || 
                      Boolean(committee.show_future_installments && committee.show_future_installments !== '0' && committee.show_future_installments !== 0) || 
                      Boolean(s.is_installment_visible && s.is_installment_visible !== '0' && s.is_installment_visible !== 0);

                    return (
                      <tr
                        key={s.id}
                        className={`transition ${
                          isCurrentDue
                            ? 'bg-amber-50/60 hover:bg-amber-50 font-semibold'
                            : allPaid
                              ? 'hover:bg-emerald-50/20'
                              : 'hover:bg-orange-50/30'
                        }`}
                      >
                        {/* Month */}
                        <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                          Month {s.month_no}
                        </td>

                        {/* Draw Date */}
                        <td className="py-3.5 px-4 font-sans text-slate-600">
                          {s.draw_date ? formatDate(s.draw_date) : 'N/A'}
                        </td>

                        {/* Seats */}
                        <td className="py-3.5 px-4 text-center font-sans">
                          {seatsCount > 1 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 font-bold border border-orange-200 text-[11px]">
                              {seatsCount} Seats
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              Seat #{payments[0]?.seat_no || 1}
                            </span>
                          )}
                        </td>

                        {/* Installment Amount */}
                        <td className="py-3.5 px-4 text-right font-medium">
                          {isInstallmentVisible ? (
                            <>
                              <div>₹{totalBaseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                              {seatsCount > 1 && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  (₹{parseFloat(s.installment_per_member).toLocaleString('en-IN')} × {seatsCount})
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 font-mono font-bold text-sm">—</span>
                          )}
                        </td>

                        {/* Penalty */}
                        <td className="py-3.5 px-4 text-right text-amber-600 font-semibold">
                          {isInstallmentVisible ? (
                            totalPenalty > 0 ? `₹${totalPenalty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'
                          ) : (
                            <span className="text-slate-400 font-mono font-bold text-sm">—</span>
                          )}
                        </td>

                        {/* Total Due */}
                        <td className={`py-3.5 px-4 text-right font-black ${allPaid ? 'text-emerald-700' : isInstallmentVisible ? 'text-rose-600' : 'text-slate-400'}`}>
                          {isInstallmentVisible ? (
                            `₹${totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-slate-400 font-mono font-bold text-sm">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center font-sans">
                          {allPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> PAID {paidDate ? `(${formatDate(paidDate)})` : ''}
                            </span>
                          ) : anyPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              PARTIAL
                            </span>
                          ) : isCurrentDue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
                              DUE NOW
                            </span>
                          ) : isInstallmentVisible ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              PENDING
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              UPCOMING
                            </span>
                          )}
                        </td>

                        {/* Round Winner / Remarks */}
                        <td className="py-3.5 px-4 font-sans text-xs text-slate-600">
                          {s.winner_name ? (
                            <span className="text-slate-800 font-medium">Winner: <strong>{s.winner_name}</strong></span>
                          ) : isInstallmentVisible ? (
                            <span className="text-slate-400 italic">Round open</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Decided after draw</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!committee.show_future_installments && (
              <div className="text-[11px] text-slate-600 bg-orange-50/50 border border-orange-200/80 rounded-xl p-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                <span>
                  <strong>Notice:</strong> Next months' installments and totals (—) will be decided during their respective monthly auction draws.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Auction Rounds & Bidding Room ── */}
      {activeTab === 'auction' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-orange-600" />
            Auction Rounds & Draw Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((s) => {
              const lInfo = lock_status?.[s.id] || {};
              const hBid = highest_bids?.[s.id] || {};
              const roundBids = bids?.[s.id] || [];

              const todayStr = (() => {
                try {
                  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
                } catch {
                  const d = new Date();
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
              })();

              const rawDrawDate = s.draw_date ? String(s.draw_date).split('T')[0] : (lInfo.draw_date || null);
              const isLocked = lInfo.is_locked || s.is_custom_bid;
              const isWinnerAssigned = Boolean(s.winner_name || s.member_id);

              let dateStatus = lInfo.date_status || 'today';
              if (rawDrawDate) {
                if (rawDrawDate === todayStr) {
                  dateStatus = 'today';
                } else if (todayStr < rawDrawDate) {
                  dateStatus = 'before';
                } else {
                  // Draw date is today or past
                  if (isWinnerAssigned || isLocked) {
                    dateStatus = 'after';
                  } else {
                    dateStatus = 'today';
                  }
                }
              }

              const canBid = !alreadyWonAllSeats && !isLocked && !isWinnerAssigned && dateStatus === 'today';

              const myBid = roundBids.find(b => b.my_bid);

              return (
                <div
                  key={s.id}
                  className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition duration-200 shadow-xs ${
                    dateStatus === 'today' && !isLocked 
                      ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Month header & Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">Month {s.month_no}</span>
                        {dateStatus === 'today' && !isLocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 animate-pulse">
                            LIVE AUCTION TODAY
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-mono text-slate-500 font-medium">
                        {rawDrawDate || 'N/A'}
                      </span>
                    </div>

                    {/* Pricing info */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-mono mb-4">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Starting Base Deduction:</span>
                        <span className="text-slate-900 font-bold">₹{parseFloat(s.deduction_amount || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Current Top Bid:</span>
                        <span className="text-orange-600 font-bold">
                          {hBid.amount ? `₹${parseFloat(hBid.amount).toLocaleString('en-IN')} (${hBid.name})` : 'No bids placed yet'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span>Net Payout to Winner:</span>
                        <span className="text-slate-900 font-black">₹{parseFloat(s.net_payout).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Status / Winner message */}
                    {isWinnerAssigned && (
                      <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-medium">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Winner Assigned: <strong>{s.winner_name || 'Member'}</strong></span>
                      </div>
                    )}

                    {/* My Bid info if placed */}
                    {myBid && (
                      <div className="mb-4 p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 flex items-center justify-between font-medium">
                        <span>My Submitted Bid: <strong>₹{parseFloat(myBid.bid_amount).toLocaleString('en-IN')}</strong></span>
                        <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">{myBid.status}</span>
                      </div>
                    )}

                    {/* Recent Bids Feed */}
                    {roundBids.length > 0 && (
                      <div className="mb-4">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Live Auction Room ({roundBids.length} bids placed)
                        </div>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {roundBids.map((b) => (
                            <div key={b.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                              <span className="text-slate-700 font-medium">{b.name} {b.my_bid ? '(You)' : ''}</span>
                              <span className="font-mono font-bold text-orange-600">₹{parseFloat(b.bid_amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bidding Button or Date Guard Message */}
                  <div className="pt-3 border-t border-slate-100">
                    {canBid ? (
                      <button
                        onClick={() => handleOpenBid(s)}
                        className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-600/25 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <Gavel className="w-4 h-4" />
                        {myBid ? 'Update My Auction Bid' : 'Place Live Auction Bid'}
                      </button>
                    ) : (
                      <div className="text-center text-[11px] text-slate-400 italic py-1 font-medium">
                        {isLocked 
                          ? 'Bidding closed by organizer' 
                          : dateStatus === 'before'
                            ? `Bidding opens on ${rawDrawDate || lInfo.draw_date || 'draw date'}`
                            : dateStatus === 'after'
                              ? 'Bidding closed (past draw date)'
                              : alreadyWonAllSeats
                                ? 'All your registered seats have won'
                                : 'Bidding unavailable'}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bid Submission Modal */}
      {activeBidScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Place Auction Bid</h3>
              </div>
              <button onClick={() => setActiveBidScheduleId(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleBidSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deduction Bid Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Rule: Your bid must be strictly higher than the current highest bid.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={bidRemarks}
                  onChange={(e) => setBidRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveBidScheduleId(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {submittingBid ? 'Submitting...' : 'Confirm Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
