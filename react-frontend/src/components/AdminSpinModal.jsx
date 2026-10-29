import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, Target, AlertCircle, Play, Shield, Users } from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { usePopup } from '../context/PopupContext';
import ActionDrawer from './ActionDrawer';

export default function AdminSpinModal({ isOpen, onClose, committeeId, preselectedSchedule, onSpinLaunched }) {
  if (!isOpen) return null;

  const { toast } = usePopup();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(
    preselectedSchedule?.id ? String(preselectedSchedule.id) : ''
  );
  const [pickMode, setPickMode] = useState('random'); // 'random' or 'secret'
  const [targetMemberId, setTargetMemberId] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(7);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    async function loadEligible() {
      if (!committeeId) return;
      try {
        setLoading(true);
        const commParam = typeof committeeId === 'string' && isNaN(Number(committeeId))
          ? committeeId
          : encodeId(committeeId);
        const res = await api.get(`/committees/${commParam}/eligible-spin-members`);
        if (res.data?.success) {
          setCandidates(res.data.candidates || []);
          setSchedules(res.data.schedules || []);
          
          if (!selectedScheduleId && res.data.schedules?.length > 0) {
            const pendingSched = res.data.schedules.find(s => !s.member_id && s.payout_status !== 'paid') 
              || res.data.schedules[0];
            setSelectedScheduleId(String(pendingSched.id));
          }
          if (res.data.candidates?.length > 0 && !targetMemberId) {
            setTargetMemberId(String(res.data.candidates[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load eligible spin candidates:', err);
        toast.error(err.response?.data?.message || err.message || 'Failed to load eligible members for spin');
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && committeeId) {
      loadEligible();
    }
  }, [isOpen, committeeId]);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      toast.error('Kripya spin ke liye month/round select karein.');
      return;
    }
    if (candidates.length === 0) {
      toast.error('Is committee me kisi bhi member ki seat baaki nahi hai.');
      return;
    }

    setLaunching(true);
    try {
      const payload = {
        target_member_id: pickMode === 'secret' && targetMemberId ? parseInt(targetMemberId, 10) : null,
        duration_seconds: parseInt(durationSeconds, 10) || 7
      };

      const schedParam = typeof selectedScheduleId === 'string' && isNaN(Number(selectedScheduleId))
        ? selectedScheduleId
        : encodeId(selectedScheduleId);

      const res = await api.post(`/committees/schedules/${schedParam}/live-spin`, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Live Turn Spin started!');
        if (onSpinLaunched) {
          onSpinLaunched(res.data.spin);
        }
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start live spin');
    } finally {
      setLaunching(false);
    }
  };

  const selectedSchedObj = schedules.find(s => String(s.id) === String(selectedScheduleId));

  return (
    <ActionDrawer
      isOpen={isOpen}
      onClose={onClose}
      icon={Sparkles}
      title="Live Turn Spin (पारदर्शी चक्रीय पारी चयन)"
      subtitle="Mutual turn allocation ke liye live synchronized wheel chalayein"
      maxWidth="sm:max-w-md"
      onSubmit={handleLaunch}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={launching || loading || candidates.length === 0}
            className="px-5 py-2 text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-md shadow-orange-500/25 transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{launching ? 'Launching...' : 'Launch Live Spin Now'}</span>
          </button>
        </div>
      }
    >
      <div className="p-3.5 sm:p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2">
            <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">Loading candidates...</span>
          </div>
        ) : (
          <>
            {/* Row 1: Month / Round & Remaining Seats in Single Row */}
            <div className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-3">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Select Round / Month
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                >
                  {schedules.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      Month {s.month_no} {s.winner_name ? `(${s.winner_name})` : '(No Winner)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Eligible Seats
                </label>
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <span>{candidates.length} Members</span>
                </div>
              </div>
            </div>

            {selectedSchedObj?.winner_name && (
              <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>Month winner pehle se {selectedSchedObj.winner_name} hain. Re-spin se overwrite hoga.</span>
              </p>
            )}

            {/* Row 2: Winner Selection Mode */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-800">
                Selection Mode (चयन का तरीका)
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Option 1: True Random */}
                <button
                  type="button"
                  onClick={() => setPickMode('random')}
                  className={`cursor-pointer rounded-xl p-2.5 border text-left transition flex items-center gap-2 ${
                    pickMode === 'random'
                      ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    pickMode === 'random' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Dices className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 leading-tight">100% Random</h4>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">Computer pick</p>
                  </div>
                </button>

                {/* Option 2: Secret Stealth Pick */}
                <button
                  type="button"
                  onClick={() => setPickMode('secret')}
                  className={`cursor-pointer rounded-xl p-2.5 border text-left transition flex items-center gap-2 ${
                    pickMode === 'secret'
                      ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    pickMode === 'secret' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-xs font-black text-slate-900 leading-tight">Secret Pick</h4>
                      <span className="text-[8px] font-black uppercase px-1 bg-indigo-100 text-indigo-700 rounded">
                        Stealth
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">Admin choice</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Row 3: Secret Member Dropdown (Shown only when Secret Pick active) */}
            {pickMode === 'secret' && (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5 space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    Target Member (Wheel inpar rukega):
                  </span>
                  <span className="text-[9px] text-indigo-600 font-medium">100% Hidden</span>
                </div>

                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full bg-white border border-indigo-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — {c.remaining_seats} seat left
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Row 4: Spin Duration */}
            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Spin Duration (पहिया कितनी देर घूमेगा)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { sec: 5, label: '5s (Fast)' },
                  { sec: 7, label: '7s (Best)' },
                  { sec: 10, label: '10s (Suspense)' }
                ].map((d) => (
                  <button
                    key={d.sec}
                    type="button"
                    onClick={() => setDurationSeconds(d.sec)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      durationSeconds === d.sec
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ActionDrawer>
  );
}
