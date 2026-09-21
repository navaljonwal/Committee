import React, { useState, useEffect } from 'react';
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
  MessageCircle
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

  const handleMarkAllPaid = async () => {
    const confirmed = await showConfirm({
      title: 'Mark All as Paid?',
      message: `Mark all ${payments.length} member payments for Month ${schedule.month_no} as PAID?\n\nThis will update all remaining unpaid members for this month.`,
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
              {schedule.committee_name} • Monthly Installment: <span className="text-orange-600 font-bold font-mono">₹{parseFloat(schedule.installment_per_member).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid Seats</span>
          <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {stats.paid_count} / {stats.total_payments}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Seats paid for this month</span>
        </div>

        <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Seats</span>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {stats.pending_count}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Awaiting contribution</span>
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
        <div className="sm:hidden text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
          ← Scroll sideways to see all payment columns →
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4 text-center">Seat #</th>
                <th className="py-3 px-4 text-right">Installment (₹)</th>
                <th className="py-3 px-4 text-right">Late Penalty (₹)</th>
                <th className="py-3 px-4 text-right">Total Due (₹)</th>
                <th className="py-3 px-4 text-center">Payment Status</th>
                <th className="py-3 px-4 text-center">Paid Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {payments.map((p) => {
                const isPaid = p.payment_status === 'paid';
                const isEditingThisPenalty = editingPenaltyId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-orange-50/30 transition duration-150">
                    
                    {/* Name */}
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      <div>{p.member_name}</div>
                      <div className="text-[10px] font-normal text-slate-400 font-mono">{p.member_phone || 'No phone'}</div>
                    </td>

                    {/* Seat # */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                        Seat {p.seat_no}
                      </span>
                    </td>

                    {/* Installment */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      ₹{parseFloat(p.amount_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Penalty */}
                    <td className="py-3 px-4 text-right font-sans">
                      {isEditingThisPenalty ? (
                        <div className="flex items-center justify-end gap-1 font-mono">
                          <input
                            type="number"
                            min="0"
                            value={penaltyAmount}
                            onChange={(e) => setPenaltyAmount(e.target.value)}
                            className="w-16 bg-white border border-orange-300 rounded px-1.5 py-0.5 text-xs text-orange-700 text-right focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => handleSavePenalty(p.id)}
                            className="p-1 text-emerald-600 hover:text-emerald-700"
                            title="Save Penalty"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => !isCompleted && handleOpenPenalty(p)} 
                          className="cursor-pointer hover:underline text-amber-600 font-mono font-semibold"
                          title="Click to edit penalty"
                        >
                          ₹{parseFloat(p.penalty_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>

                    {/* Total Due */}
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{parseFloat(p.total_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center font-sans">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isPaid 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-center font-sans text-slate-500">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>

                    {/* 1-Click Status Toggle + WhatsApp Reminder */}
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPaid && p.member_phone && (() => {
                          const waLink = makeWhatsAppPaymentReminder({
                            phone: p.member_phone,
                            memberName: p.member_name,
                            committeeName: schedule.committee_name,
                            monthNo: schedule.month_no,
                            amountDue: p.total_due,
                            drawDate: schedule.draw_date
                          });
                          return waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Send WhatsApp reminder to ${p.member_name}`}
                              className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          ) : null;
                        })()}
                        <button
                          onClick={() => handleTogglePayment(p.id)}
                          disabled={isCompleted}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs active:scale-[0.98] ${
                            isPaid
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                              : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-600/20'
                          } disabled:opacity-40`}
                        >
                          {isPaid ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
