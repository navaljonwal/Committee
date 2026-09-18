import React, { useState } from 'react';
import { X, Gavel, Check, Lock, AlertCircle, ArrowUpRight } from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';

export default function BiddingModal({ isOpen, onClose, schedule, onSaveSuccess }) {
  if (!isOpen || !schedule) return null;

  const [customDeduction, setCustomDeduction] = useState(
    schedule.custom_deduction_amount !== null ? schedule.custom_deduction_amount : schedule.deduction_amount
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const bids = schedule.bids || [];

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/committees/schedules/${encodeId(schedule.id)}/bid`, {
        custom_deduction_amount: parseFloat(customDeduction || 0)
      });
      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update deduction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveBid = async (bidId, memberName, amount) => {
    if (!window.confirm(`Approve ₹${parseFloat(amount).toLocaleString('en-IN')} bid by ${memberName}? This will close bidding and set this member as the winner.`)) {
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/committees/schedules/bids/${encodeId(bidId)}/approve`);
      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to approve bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockDefault = async () => {
    if (!window.confirm(`Lock Month ${schedule.month_no} at default formula deduction (₹${parseFloat(schedule.formula_deduction || 0).toLocaleString('en-IN')})?`)) {
      return;
    }
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/committees/schedules/${encodeId(schedule.id)}/lock-default`);
      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to lock default formula');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-orange-600" />
              Auction Bidding & Deduction — Month {schedule.month_no}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Default Formula: <span className="font-mono text-slate-700 font-bold">₹{parseFloat(schedule.formula_deduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> • Current Deduction: <span className="font-mono text-orange-600 font-bold">₹{parseFloat(schedule.deduction_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            {errorMsg}
          </div>
        )}

        <div className="p-6 space-y-6">
          
          {/* Member Bids Stream */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Live Member Bids ({bids.length})
            </h4>

            {bids.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                No member has submitted an auction bid for this round yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {bids.map((b, idx) => (
                  <div 
                    key={b.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      b.status === 'approved' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                        : idx === 0 
                          ? 'bg-orange-50 border-orange-200 text-orange-950' 
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span>{b.member_name}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-orange-200/60 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                            Highest Bid
                          </span>
                        )}
                        {b.status === 'approved' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            Winner Approved
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-mono mt-0.5 font-medium">
                        Bid: ₹{parseFloat(b.bid_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {b.remarks && <span className="text-slate-400 ml-2 italic">"{b.remarks}"</span>}
                      </div>
                    </div>

                    {b.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApproveBid(b.id, b.member_name, b.bid_amount)}
                        disabled={submitting}
                        className="px-3 py-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-md shadow-orange-600/20 flex items-center gap-1 active:scale-[0.98]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve & Win
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Custom Deduction Override */}
          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Manual Custom Deduction Override
            </h4>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  placeholder="Enter custom deduction amount (₹)"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition shadow-md shadow-orange-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  Save Deduction
                </button>
              </div>
            </form>
          </div>

          {/* Lock at Formula Default */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              No auction bidding for this month?
            </span>
            <button
              type="button"
              onClick={handleLockDefault}
              disabled={submitting}
              className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Lock at Formula Default (₹{parseFloat(schedule.formula_deduction || 0).toLocaleString('en-IN')})
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
