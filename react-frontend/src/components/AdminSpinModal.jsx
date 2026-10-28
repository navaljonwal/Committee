import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, Target, UserCheck, AlertCircle, Play, Shield, Users } from 'lucide-react';
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
      try {
        setLoading(true);
        const res = await api.get(`/committees/${encodeId(committeeId)}/eligible-spin-members`);
        if (res.data?.success) {
          setCandidates(res.data.candidates || []);
          setSchedules(res.data.schedules || []);
          
          if (!selectedScheduleId && res.data.schedules?.length > 0) {
            // Find first unpaid schedule without winner or matching preselected
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
        toast.error('Failed to load eligible members for spin');
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

      const res = await api.post(`/committees/schedules/${encodeId(selectedScheduleId)}/live-spin`, payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Live Lucky Draw Spin started!');
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
      title="Live Lucky Draw Spin (रैंडम लकी ड्रॉ)"
      subtitle="Bidding na hone par same-second live synchronized wheel spin chalayein"
      maxWidth="sm:max-w-md md:max-w-lg"
      onSubmit={handleLaunch}
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={launching || loading || candidates.length === 0}
            className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-[0.98] disabled:opacity-50 text-center flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{launching ? 'Launching Live Spin...' : 'Launch Live Spin Now'}</span>
          </button>
        </div>
      }
    >
      <div className="p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-semibold">Loading candidates...</span>
          </div>
        ) : (
          <>
            {/* Round / Month Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Select Auction Round / Month (किस माह के लिए स्पिन करना है)
              </label>
              <select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    Month {s.month_no} {s.winner_name ? `(Current Winner: ${s.winner_name})` : '(No Winner Assigned)'} {s.payout_status === 'paid' ? '— Payout Disbursed' : ''}
                  </option>
                ))}
              </select>
              {selectedSchedObj?.winner_name && (
                <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Is month ka winner pehle se {selectedSchedObj.winner_name} hain. Spin chalane par naya winner update hoga.
                </p>
              )}
            </div>

            {/* Eligible Members Badge */}
            <div className="bg-orange-50/80 border border-orange-200/90 rounded-2xl p-3 flex items-center justify-between text-xs text-orange-950 font-medium">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span>Eligible Candidates (Remaining Seats):</span>
              </span>
              <span className="font-black bg-white px-2 py-0.5 rounded-lg border border-orange-200 text-orange-700 font-mono">
                {candidates.length} Members
              </span>
            </div>

            {/* Mode Selector (Random vs Secret Selection) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Choose Winner Selection Mode (ड्रॉ का तरीका चुनें)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: True Random */}
                <div
                  onClick={() => setPickMode('random')}
                  className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
                    pickMode === 'random'
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      pickMode === 'random' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Dices className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">100% Random Pick</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        Computer kisi bhi ek eligible sadasya ko bina bhedbhav randomly chunega.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Secret Stealth Pick */}
                <div
                  onClick={() => setPickMode('secret')}
                  className={`cursor-pointer rounded-2xl p-3.5 border transition-all ${
                    pickMode === 'secret'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      pickMode === 'secret' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-slate-900">Secret Choice</h4>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded">
                          Stealth
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        Aap member chunein. Spin unpar hi rukega, par member ko lagega random hi aaya hai!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secret Member Dropdown (Shown only when Secret Choice is active) */}
            {pickMode === 'secret' && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 space-y-2 animate-fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Secret Winner (Live Wheel unke naam par rukega):</span>
                </div>

                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name} {c.phone ? `(${c.phone})` : ''} — {c.remaining_seats} Seat(s) Left (Won: {c.won_count})
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                  🔒 <strong>Privacy Guarantee:</strong> Members ke screen par aane wale network payload me koi secret flag nahi hota. Unhe 100% normal random wheel hi dikhega.
                </p>
              </div>
            )}

            {/* Spin Duration Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Spin Suspense Duration (पहिया कितनी देर घूमेगा)
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
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
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

            {/* Real-time Broadcast Notice */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Instant Multi-Device Sync:</span>
              </span>
              <p className="leading-snug">
                Jaise hi aap <strong>"Launch Live Spin Now"</strong> par click karenge, sabhi members ke mobile/laptop par wheel ghoomna shuru ho jayega bina 1 second ke antar ke!
              </p>
            </div>
          </>
        )}
      </div>
    </ActionDrawer>
  );
}
