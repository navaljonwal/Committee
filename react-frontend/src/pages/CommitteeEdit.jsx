import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Users, IndianRupee, Calendar, Check, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function CommitteeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [deductionRate, setDeductionRate] = useState(0);
  const [specialMonthNumber, setSpecialMonthNumber] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('active');

  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [seatsMap, setSeatsMap] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [commRes, membRes] = await Promise.all([
          api.get(`/committees/${id}`),
          api.get('/members')
        ]);

        if (commRes.data.success) {
          const c = commRes.data.committee;
          setName(c.name);
          setTotalAmount(c.total_amount);
          setTotalMembers(c.total_members);
          setDeductionRate(c.deduction_rate);

          const sIndex = parseInt(c.special_month_index, 10);
          const mTotal = parseInt(c.total_members, 10);
          if (sIndex > 0 && sIndex <= mTotal) {
            setSpecialMonthNumber(mTotal - sIndex + 1);
          } else {
            setSpecialMonthNumber('none');
          }

          setStartDate(c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '');
          setStatus(c.status);

          const attached = commRes.data.members || [];
          setSelectedMembers(attached.map(m => m.id));
          const sMap = {};
          for (const m of attached) {
            sMap[m.id] = parseInt(m.seats || 1, 10);
          }
          setSeatsMap(sMap);
        }

        if (membRes.data.success) {
          setAllMembers(membRes.data.members || []);
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Failed to load committee');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleToggleMember = (mId) => {
    const exists = selectedMembers.includes(mId);
    if (exists) {
      setSelectedMembers(prev => prev.filter(x => x !== mId));
      setSeatsMap(prev => {
        const copy = { ...prev };
        delete copy[mId];
        return copy;
      });
    } else {
      setSelectedMembers(prev => [...prev, mId]);
      setSeatsMap(prev => ({ ...prev, [mId]: 1 }));
    }
  };

  const handleSeatChange = (mId, count) => {
    const seats = Math.max(1, parseInt(count || 1, 10));
    setSeatsMap(prev => ({ ...prev, [mId]: seats }));
  };

  const totalAssignedSeats = selectedMembers.reduce((acc, mId) => acc + (seatsMap[mId] || 1), 0);
  const maxSeatsAllowed = parseInt(totalMembers, 10) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalAssignedSeats > maxSeatsAllowed) {
      setErrorMsg(`Cannot assign more than ${maxSeatsAllowed} seats (currently: ${totalAssignedSeats}).`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const sIndex = specialMonthNumber === 'none' ? -1 : (parseInt(totalMembers, 10) - parseInt(specialMonthNumber, 10) + 1);

    try {
      const res = await api.put(`/committees/${id}`, {
        name: name.trim(),
        total_amount: parseFloat(totalAmount),
        total_members: parseInt(totalMembers, 10),
        deduction_rate: parseFloat(deductionRate),
        special_month_index: sIndex,
        start_date: startDate,
        status,
        members: selectedMembers,
        seats: seatsMap
      });

      if (res.data.success) {
        navigate(`/committees/${id}`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update committee');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to={`/committees/${id}`}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-orange-600 shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Edit Committee: {name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Updating parameters will automatically recalculate monthly formula installments and sync payment records
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Committee Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="active">Active & Running</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed & Closed</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">Total Amount (V) *</label>
                <span className="text-[11px] font-mono font-bold text-orange-600">
                  ₹{Number(totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Quick Select Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[
                  { label: '50K', val: 50000 },
                  { label: '1 Lac', val: 100000 },
                  { label: '2 Lac', val: 200000 },
                  { label: '3 Lac', val: 300000 },
                  { label: '5 Lac', val: 500000 },
                  { label: '10 Lac', val: 1000000 },
                ].map((item) => {
                  const isSelected = Number(totalAmount) === item.val;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setTotalAmount(item.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Total Members (M)</label>
              <input
                type="number"
                required
                value={totalMembers}
                onChange={(e) => setTotalMembers(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Deduction Rate (R %)</label>
              <input
                type="number"
                step="0.01"
                required
                value={deductionRate}
                onChange={(e) => setDeductionRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  Zero Deduction Round (Full Payout) *
                </label>
                <span className="text-[11px] font-bold text-amber-600">
                  {specialMonthNumber === 'none' ? 'No Zero Month' : `Month ${specialMonthNumber}`}
                </span>
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[
                  { label: 'Month 2 (Standard)', val: 2 },
                  { label: 'Month 1', val: 1 },
                  { label: 'Month 3', val: 3 },
                  { label: 'None', val: 'none' },
                ].map((item) => {
                  const isSelected = String(specialMonthNumber) === String(item.val);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSpecialMonthNumber(item.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <select
                value={specialMonthNumber}
                onChange={(e) => setSpecialMonthNumber(e.target.value === 'none' ? 'none' : parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value={2}>Month 2 — Full ₹{Number(totalAmount || 0).toLocaleString('en-IN')} (Standard)</option>
                <option value={1}>Month 1 — First Draw Full Payout</option>
                {Array.from({ length: Math.max(0, parseInt(totalMembers, 10) - 2) }, (_, i) => i + 3).map((m) => (
                  <option key={m} value={m}>Month {m} — Full Payout</option>
                ))}
                <option value="none">None — Standard deduction applied every month</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Member Seats */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Update Enrolled Members & Seats
              </h2>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-bold font-mono border ${
              totalAssignedSeats === maxSeatsAllowed ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-amber-50 border-amber-300 text-amber-700'
            }`}>
              Seats: {totalAssignedSeats} / {maxSeatsAllowed}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
            {allMembers.map(m => {
              const isSelected = selectedMembers.includes(m.id);
              const seats = seatsMap[m.id] || 1;

              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleMember(m.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'bg-orange-50/80 border-orange-300 text-orange-950 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs ${
                      isSelected ? 'bg-orange-500 border-orange-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{m.phone || 'No Phone'}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-orange-200 ml-2 shadow-xs">
                      <span className="text-[10px] text-slate-500 font-semibold">Seats:</span>
                      <input
                        type="number"
                        min="1"
                        max={maxSeatsAllowed}
                        value={seats}
                        onChange={(e) => handleSeatChange(m.id, e.target.value)}
                        className="w-10 bg-transparent text-xs text-center font-black text-orange-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Link to={`/committees/${id}`} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Updating...' : <><Save className="w-4 h-4" /> Save & Recalculate Schedules</>}
          </button>
        </div>
      </form>
    </div>
  );
}
