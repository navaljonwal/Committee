import React, { useState } from 'react';
import { X, Award, Calendar } from 'lucide-react';
import api from '../api/client';

export default function WinnerModal({ isOpen, onClose, schedule, members, onSaveSuccess }) {
  if (!isOpen || !schedule) return null;

  const [memberId, setMemberId] = useState(schedule.member_id || '');
  const [drawDate, setDrawDate] = useState(
    schedule.draw_date 
      ? new Date(schedule.draw_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post(`/committees/schedules/${schedule.id}/winner`, {
        member_id: memberId ? parseInt(memberId, 10) : null,
        draw_date: drawDate || null
      });

      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update winner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-bold text-slate-900">
              Assign Winner — Month {schedule.month_no}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Winner Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">-- No Winner Assigned (Pending Draw) --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.phone ? `(${m.phone})` : ''} {m.won_count ? `[Won: ${m.won_count} / Seats: ${m.seats || 1}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Draw Date
            </label>
            <input
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Winner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
