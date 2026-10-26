import React, { useState } from 'react';
import { Award, Calendar } from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { usePopup } from '../context/PopupContext';
import ActionDrawer from './ActionDrawer';

export default function WinnerModal({ isOpen, onClose, schedule, members, onSaveSuccess }) {
  if (!isOpen || !schedule) return null;

  const { toast } = usePopup();
  const [memberId, setMemberId] = useState(schedule.member_id || '');
  const [drawDate, setDrawDate] = useState(
    schedule.draw_date 
      ? new Date(schedule.draw_date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post(`/committees/schedules/${encodeId(schedule.id)}/winner`, {
        member_id: memberId ? parseInt(memberId, 10) : null,
        draw_date: drawDate || null
      });

      if (res.data.success) {
        onSaveSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update winner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ActionDrawer
      isOpen={isOpen && !!schedule}
      onClose={onClose}
      icon={Award}
      title={`Assign Winner — Month ${schedule.month_no}`}
      subtitle="Select the winning member and record draw date"
      maxWidth="sm:max-w-md md:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="p-4 sm:p-6 space-y-4 flex-1">
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
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50/70 pb-[max(env(safe-area-inset-bottom,0px),1rem)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50 text-center"
          >
            {submitting ? 'Saving...' : 'Save Winner'}
          </button>
        </div>
      </form>
    </ActionDrawer>
  );
}
