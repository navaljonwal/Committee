import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Check, 
  IndianRupee,
  Calendar,
  Layers,
  Award,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { makeWhatsAppPaymentReminder } from '../utils/whatsapp';
import { usePopup } from '../context/PopupContext';

export default function SchedulePayments() {
  const { scheduleId } = useParams();
  const { showConfirm, toast } = usePopup();

  const [schedule, setSchedule] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState({});

  // Penalty edit states
  const [editingPenaltyId, setEditingPenaltyId] = useState(null);
  const [penaltyAmount, setPenaltyAmount] = useState(0);
  const [penaltyRemarks, setPenaltyRemarks] = useState('');

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/schedules/${scheduleId}/payments`);
      if (res.data.success) {
        setSchedule(res.data.schedule);
        setPayments(res.data.payments);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [scheduleId]);

  const toggleExpand = (memberId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // Group payments by member so names do not repeat
  const memberGroups = useMemo(() => {
    if (!payments || payments.length === 0) return [];
    const map = new Map();

    payments.forEach((p) => {
      const mId = p.member_id;
      if (!map.has(mId)) {
        map.set(mId, {
          member_id: mId,
          member_name: p.member_name,
          member_phone: p.member_phone,
          payments: [],
          total_installment: 0,
          total_penalty: 0,
          total_due: 0,
          pending_due: 0,
          paid_count: 0,
          pending_count: 0,
          seat_numbers: [],
          pending_seat_numbers: []
        });
      }
      const g = map.get(mId);
      g.payments.push(p);
      g.total_installment += parseFloat(p.amount_paid || 0);
      g.total_penalty += parseFloat(p.penalty_amount || 0);
      g.total_due += parseFloat(p.total_due || 0);
      g.seat_numbers.push(`Seat #${p.seat_no}`);

      if (p.payment_status === 'paid') {
        g.paid_count += 1;
      } else {
        g.pending_count += 1;
        g.pending_due += parseFloat(p.total_due || 0);
        g.pending_seat_numbers.push(`Seat #${p.seat_no}`);
      }
    });

    return Array.from(map.values()).map(g => {
      const isAllPaid = g.pending_count === 0;
      const isAllPending = g.paid_count === 0;
      const isPartial = !isAllPaid && !isAllPending;

      const paidDates = g.payments
        .filter(p => p.payment_status === 'paid' && p.payment_date)
        .map(p => new Date(p.payment_date).getTime());
      const latestPaidDate = paidDates.length > 0 ? new Date(Math.max(...paidDates)) : null;

      return {
        ...g,
        isAllPaid,
        isAllPending,
        isPartial,
        latestPaidDate
      };
    });
  }, [payments]);

  // Toggle single seat payment
  const handleTogglePayment = async (paymentId) => {
    try {
      const res = await api.post(`/payments/${encodeId(paymentId)}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle payment status');
    }
  };

  // Toggle all seats for a member in this schedule
  const handleToggleMember = async (memberId) => {
    try {
      const res = await api.post(`/payments/schedules/${scheduleId}/members/${encodeId(memberId)}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update member payments');
    }
  };

  const handleMarkAllPaid = async () => {
    const confirmed = await showConfirm({
      title: 'Mark All as Paid?',
      message: `Mark all ${payments.length} seats (${memberGroups.length} members) for Month ${schedule.month_no} as PAID?\n\nThis will update all remaining unpaid members for this month.`,
      confirmText: 'Mark All Paid',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await api.post(`/payments/schedules/${scheduleId}/mark-all-paid`);
      if (res.data.success) {
        toast.success(res.data.message);
        loadPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPenalty = (p) => {
    setEditingPenaltyId(p.id);
    setPenaltyAmount(p.penalty_amount || 0);
    setPenaltyRemarks(p.remarks || '');
  };

  const handleSavePenalty = async (paymentId) => {
    try {
      const res = await api.post(`/payments/${encodeId(paymentId)}/penalty`, {
        penalty_amount: parseFloat(penaltyAmount || 0),
        remarks: penaltyRemarks
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setEditingPenaltyId(null);
        loadPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update penalty');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-800 font-medium">
        Schedule not found
      </div>
    );
  }

  const isCompleted = schedule.committee_status === 'completed';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/committees/${encodeId(schedule.committee_id)}`}
            className="p-2.5 bg-white border border-slate-200 shadow-xs rounded-xl text-slate-500 hover:text-orange-600 hover:border-orange-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-orange-600" />
              Member Payments Ledger — Month {schedule.month_no}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {schedule.committee_name} • Monthly Installment per Seat: <span className="text-orange-600 font-bold font-mono">₹{parseFloat(schedule.installment_per_member).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {!isCompleted && stats.pending_count > 0 && (
          <button
            onClick={handleMarkAllPaid}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition flex items-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Mark All as Paid
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Seats</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.paid_count} Seats
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {stats.paid_count} / {stats.total_payments}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
            {memberGroups.filter(g => g.isAllPaid).length} of {memberGroups.length} members fully paid
          </span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Seats</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {stats.pending_count} Seats
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {stats.pending_count}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">
            {memberGroups.filter(g => !g.isAllPaid).length} members awaiting payment
          </span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Collected</span>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{(stats.total_collected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Includes late penalties</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pending</span>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">
            ₹{(stats.total_pending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Remaining to collect</span>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900">Member Contributions</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {memberGroups.length} Members ({payments.length} Seats)
            </span>
          </div>
          <div className="sm:hidden text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            ← Scroll sideways to see all columns →
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4 text-center">Seats</th>
                <th className="py-3 px-4 text-right">Installment (₹)</th>
                <th className="py-3 px-4 text-right">Late Penalty (₹)</th>
                <th className="py-3 px-4 text-right">Total Due (₹)</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Paid Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {memberGroups.map((g) => {
                const hasMultipleSeats = g.payments.length > 1;
                const isExpanded = !!expandedMembers[g.member_id];
                const singlePayment = !hasMultipleSeats ? g.payments[0] : null;
                const isEditingThisPenalty = singlePayment && editingPenaltyId === singlePayment.id;

                // WhatsApp reminder link for this member (totals all pending seats)
                const waLink = (!g.isAllPaid && g.member_phone) ? makeWhatsAppPaymentReminder({
                  phone: g.member_phone,
                  memberName: g.member_name,
                  committeeName: schedule.committee_name,
                  monthNo: schedule.month_no,
                  amountDue: g.pending_due,
                  drawDate: schedule.draw_date,
                  seatsCount: g.pending_count,
                  seatNumbers: g.pending_seat_numbers.join(', ')
                }) : null;

                return (
                  <React.Fragment key={g.member_id}>
                    <tr className={`hover:bg-orange-50/30 transition duration-150 ${isExpanded ? 'bg-orange-50/20' : ''}`}>
                      
                      {/* Name */}
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          {hasMultipleSeats && (
                            <button
                              onClick={() => toggleExpand(g.member_id)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                              title={isExpanded ? 'Collapse seats breakdown' : 'Expand seats breakdown'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-orange-600" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{g.member_name}</span>
                              {hasMultipleSeats && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  {g.payments.length} Seats
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-normal text-slate-400 font-mono">
                              {g.member_phone || 'No phone'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seats Badge */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {hasMultipleSeats ? (
                          <button
                            onClick={() => toggleExpand(g.member_id)}
                            className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-[11px] font-mono transition"
                            title="Click to view/hide seat breakdown"
                          >
                            <span>{g.payments.map(p => `#${p.seat_no}`).join(', ')}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-amber-700" /> : <ChevronDown className="w-3 h-3 text-amber-700" />}
                          </button>
                        ) : (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200 font-mono text-[11px]">
                            Seat {singlePayment.seat_no}
                          </span>
                        )}
                      </td>

                      {/* Installment */}
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        <div>
                          ₹{g.total_installment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {hasMultipleSeats && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({g.payments.length} × ₹{parseFloat(schedule.installment_per_member).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                          </div>
                        )}
                      </td>

                      {/* Late Penalty */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        {singlePayment ? (
                          isEditingThisPenalty ? (
                            <div className="flex items-center justify-end gap-1 font-mono">
                              <input
                                type="number"
                                min="0"
                                value={penaltyAmount}
                                onChange={(e) => setPenaltyAmount(e.target.value)}
                                className="w-16 bg-white border border-orange-300 rounded px-1.5 py-0.5 text-xs text-orange-700 text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <button
                                onClick={() => handleSavePenalty(singlePayment.id)}
                                className="p-1 text-emerald-600 hover:text-emerald-700"
                                title="Save Penalty"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              onClick={() => !isCompleted && handleOpenPenalty(singlePayment)} 
                              className="cursor-pointer hover:underline text-amber-600 font-mono font-semibold"
                              title="Click to edit penalty"
                            >
                              ₹{g.total_penalty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          )
                        ) : (
                          <div 
                            onClick={() => toggleExpand(g.member_id)}
                            className="cursor-pointer hover:underline text-amber-600 font-mono font-semibold"
                            title="Click to expand and edit penalty per seat"
                          >
                            ₹{g.total_penalty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Total Due */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        <div>
                          ₹{g.total_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {g.isPartial && (
                          <div className="text-[10px] text-rose-600 font-semibold font-mono">
                            Pending: ₹{g.pending_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        {g.isAllPaid ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            PAID
                          </span>
                        ) : g.isAllPending ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                            PENDING
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                            PARTIAL ({g.paid_count}/{g.payments.length} PAID)
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-center font-sans text-slate-500">
                        {g.isAllPaid && g.latestPaidDate ? (
                          g.latestPaidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        ) : g.isPartial && g.latestPaidDate ? (
                          <div>
                            <div>{g.latestPaidDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <span className="text-[10px] text-slate-400">({g.paid_count} of {g.payments.length} paid)</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Reminder (Totals all pending seats) */}
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Send WhatsApp reminder to ${g.member_name} for ₹${g.pending_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}${hasMultipleSeats ? ` (${g.pending_count} seat${g.pending_count > 1 ? 's' : ''})` : ''}`}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Member Status Toggle Button */}
                          <button
                            onClick={() => hasMultipleSeats ? handleToggleMember(g.member_id) : handleTogglePayment(singlePayment.id)}
                            disabled={isCompleted}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs active:scale-[0.98] ${
                              g.isAllPaid
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-600/20'
                            } disabled:opacity-40`}
                          >
                            {g.isAllPaid 
                              ? (hasMultipleSeats ? 'Mark All Pending' : 'Mark Pending') 
                              : (g.isPartial ? 'Mark All Paid' : (hasMultipleSeats ? 'Mark All Paid' : 'Mark Paid'))}
                          </button>
                        </div>
                      </td>

                    </tr>

                    {/* Expandable breakdown for multi-seat member */}
                    {hasMultipleSeats && isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={8} className="py-3 px-4 sm:px-8">
                          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-orange-500" />
                                Individual Seat Breakdown for {g.member_name}
                              </span>
                              <span className="text-slate-400 font-normal">{g.payments.length} seats total</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {g.payments.map((p) => {
                                const pPaid = p.payment_status === 'paid';
                                const isEditingP = editingPenaltyId === p.id;
                                return (
                                  <div key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                                    <div className="flex items-center gap-2 font-sans font-semibold text-slate-800">
                                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-xs">
                                        Seat #{p.seat_no}
                                      </span>
                                      <span className="text-slate-500 font-normal">
                                        Installment: <b className="font-mono text-slate-800">₹{parseFloat(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b>
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      {/* Seat Penalty */}
                                      <div className="text-right">
                                        <span className="text-[10px] text-slate-400 font-sans block">Late Penalty:</span>
                                        {isEditingP ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              min="0"
                                              value={penaltyAmount}
                                              onChange={(e) => setPenaltyAmount(e.target.value)}
                                              className="w-14 bg-white border border-orange-300 rounded px-1 py-0.5 text-xs text-orange-700 text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                                            />
                                            <button 
                                              onClick={() => handleSavePenalty(p.id)} 
                                              className="p-0.5 text-emerald-600 hover:text-emerald-700"
                                              title="Save Penalty"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ) : (
                                          <span 
                                            onClick={() => !isCompleted && handleOpenPenalty(p)}
                                            className="cursor-pointer hover:underline text-amber-600 font-semibold"
                                            title="Click to edit penalty"
                                          >
                                            ₹{parseFloat(p.penalty_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>

                                      {/* Seat Total */}
                                      <div className="text-right font-black text-slate-900">
                                        <span className="text-[10px] text-slate-400 font-sans block">Total:</span>
                                        ₹{parseFloat(p.total_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </div>

                                      {/* Seat Status */}
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-sans ${
                                        pPaid 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        {pPaid ? 'PAID' : 'PENDING'}
                                      </span>

                                      {/* Single Seat Toggle */}
                                      <button
                                        onClick={() => handleTogglePayment(p.id)}
                                        disabled={isCompleted}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border font-sans ${
                                          pPaid
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                            : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600'
                                        } disabled:opacity-40`}
                                      >
                                        {pPaid ? 'Mark Pending' : 'Mark Paid'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
