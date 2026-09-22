import React, { useState, useEffect } from 'react';
import { X, CheckCircle, IndianRupee, Banknote, Smartphone, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { usePopup } from '../context/PopupContext';

export default function PayoutModal({ isOpen, onClose, schedule, onSaveSuccess }) {
  if (!isOpen || !schedule) return null;

  const { toast } = usePopup();
  const netPayoutTarget = parseFloat(schedule.net_payout || 0);

  // Parse notes from schedule if available
  let initialNotes = {
    '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0
  };

  if (schedule.payout_cash_notes) {
    try {
      const parsed = typeof schedule.payout_cash_notes === 'string' 
        ? JSON.parse(schedule.payout_cash_notes) 
        : schedule.payout_cash_notes;
      if (parsed) {
        initialNotes = { ...initialNotes, ...parsed };
      }
    } catch (e) {}
  }

  const [status, setStatus] = useState(schedule.payout_status || 'unpaid');
  const [payoutDate, setPayoutDate] = useState(
    schedule.payout_date 
      ? new Date(schedule.payout_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [mode, setMode] = useState(schedule.payout_mode || 'cash');
  const [upiAmount, setUpiAmount] = useState(schedule.payout_upi_amount || '');
  const [upiRef, setUpiRef] = useState(schedule.payout_upi_ref || '');
  const [remarks, setRemarks] = useState(schedule.payout_remarks || '');
  const [notes, setNotes] = useState(initialNotes);
  const [submitting, setSubmitting] = useState(false);

  // Calculate Cash Total from notes
  const cashNotesTotal = (parseInt(notes['500'] || 0, 10) * 500) +
                         (parseInt(notes['200'] || 0, 10) * 200) +
                         (parseInt(notes['100'] || 0, 10) * 100) +
                         (parseInt(notes['50'] || 0, 10) * 50) +
                         (parseInt(notes['20'] || 0, 10) * 20) +
                         (parseInt(notes['10'] || 0, 10) * 10) +
                         (parseInt(notes['5'] || 0, 10) * 5);

  const parsedUpi = parseFloat(upiAmount || 0);
  const totalDisbursed = (mode === 'cash' ? cashNotesTotal : (mode === 'upi' ? parsedUpi : cashNotesTotal + parsedUpi));
  const diff = netPayoutTarget - totalDisbursed;

  const handleNoteChange = (denom, val) => {
    const num = Math.max(0, parseInt(val || 0, 10));
    setNotes(prev => ({ ...prev, [denom]: num }));
  };

  const handleQuickFill500 = () => {
    const count500 = Math.floor(netPayoutTarget / 500);
    const remainder = netPayoutTarget % 500;
    const count100 = Math.floor(remainder / 100);
    setNotes({
      '500': count500,
      '200': 0,
      '100': count100,
      '50': 0,
      '20': 0,
      '10': 0,
      '5': 0
    });
    setMode('cash');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        payout_status: status,
        payout_date: status === 'paid' ? payoutDate : null,
        payout_mode: mode,
        payout_upi_amount: mode === 'cash' ? 0 : parsedUpi,
        payout_upi_ref: mode === 'cash' ? null : upiRef,
        payout_cash_amount: mode === 'upi' ? 0 : cashNotesTotal,
        note_500: notes['500'],
        note_200: notes['200'],
        note_100: notes['100'],
        note_50: notes['50'],
        note_20: notes['20'],
        note_10: notes['10'],
        note_5: notes['5'],
        payout_remarks: remarks
      };

      const res = await api.post(`/committees/schedules/${encodeId(schedule.id)}/payout`, payload);
      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update disbursement details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-orange-600" />
              Disbursement Settlement — Month {schedule.month_no}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Winner: <span className="text-slate-900 font-bold">{schedule.winner_name || 'Pending Draw Assignment'}</span> • Target Net Payout: <span className="text-orange-600 font-bold font-mono">₹{netPayoutTarget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Status & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Settlement Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="unpaid">Unpaid / In Progress</option>
                <option value="paid">Paid & Disbursed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Date</label>
              <input
                type="date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
                disabled={status !== 'paid'}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Disbursement Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="cash">Cash Only</option>
                <option value="upi">UPI / Online Bank Transfer</option>
                <option value="split">Split (Cash + UPI)</option>
              </select>
            </div>
          </div>

          {/* Cash Denominations Section */}
          {(mode === 'cash' || mode === 'split') && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Physical Cash Note Count
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFill500}
                  className="text-[11px] text-orange-600 hover:text-orange-700 font-bold hover:underline"
                >
                  Auto Fill in ₹500 Notes
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['500', '200', '100', '50', '20', '10', '5'].map((denom) => (
                  <div key={denom} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-bold text-slate-900">₹{denom}</span>
                      <span className="text-[10px] text-orange-600 font-semibold font-mono">
                        = ₹{((parseInt(notes[denom] || 0, 10)) * parseInt(denom, 10)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={notes[denom] || ''}
                      onChange={(e) => handleNoteChange(denom, e.target.value)}
                      placeholder="0 notes"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-orange-500 text-center font-mono font-bold"
                    />
                  </div>
                ))}

                <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl flex flex-col justify-center text-center shadow-xs">
                  <span className="text-[10px] uppercase tracking-wider text-orange-700 font-bold">Total Cash Tally</span>
                  <span className="text-sm font-black text-orange-700 mt-0.5 font-mono">₹{cashNotesTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {/* UPI Section */}
          {(mode === 'upi' || mode === 'split') && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  UPI / Transfer Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  UPI Ref / UTR / Transaction No.
                </label>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 423456789012"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono"
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Settlement Remarks (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Handed over cash in presence of witnesses..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Settlement Tally Bar */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${
            Math.abs(diff) < 0.01 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <div className="flex items-center gap-2 text-xs font-medium">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>
                Disbursed: <strong className="font-mono">₹{totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> / Target: <strong className="font-mono">₹{netPayoutTarget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
            <span className="text-xs font-bold font-mono">
              {Math.abs(diff) < 0.01 
                ? '✓ 100% Balanced' 
                : diff > 0 
                  ? `Short by ₹${diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                  : `Excess by ₹${Math.abs(diff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Disbursement'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
