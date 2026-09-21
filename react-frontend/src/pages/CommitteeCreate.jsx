import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calculator, 
  Users, 
  IndianRupee, 
  Calendar, 
  Check, 
  AlertCircle,
  PlusCircle,
  Award
} from 'lucide-react';
import api from '../api/client';
import { usePopup } from '../context/PopupContext';

export default function CommitteeCreate() {
  const navigate = useNavigate();
  const { toast } = usePopup();

  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState(200000);
  const [totalMembers, setTotalMembers] = useState(20);
  const [deductionRate, setDeductionRate] = useState(1.5);
  const [specialMonthNumber, setSpecialMonthNumber] = useState(2); // Month 2 by default
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Compute specialMonthIndex: Index N = M - Month + 1
  const mVal = parseInt(totalMembers, 10) || 20;
  const specialMonthIndex = specialMonthNumber === 'none' ? -1 : (mVal - parseInt(specialMonthNumber, 10) + 1);

  const [allMembers, setAllMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [seatsMap, setSeatsMap] = useState({});

  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load all members for seat allocation
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await api.get('/members');
        if (res.data.success) {
          setAllMembers(res.data.members || []);
        }
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    }
    fetchMembers();
  }, []);

  // Fetch live calculation preview whenever parameters change
  useEffect(() => {
    async function fetchPreview() {
      setLoadingPreview(true);
      try {
        const res = await api.post('/committees/preview', {
          total_amount: totalAmount,
          total_members: totalMembers,
          deduction_rate: deductionRate,
          special_month_index: specialMonthIndex,
          start_date: startDate
        });
        if (res.data.success) {
          setPreview(res.data);
        }
      } catch (err) {
        // ignore live debounce errors
      } finally {
        setLoadingPreview(false);
      }
    }

    const timer = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timer);
  }, [totalAmount, totalMembers, deductionRate, specialMonthIndex, startDate]);

  // Toggle member selection
  const handleToggleMember = (mId) => {
    const exists = selectedMembers.includes(mId);
    if (exists) {
      setSelectedMembers(prev => prev.filter(id => id !== mId));
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
    if (!name.trim()) {
      toast.error('Please enter a committee name');
      return;
    }
    if (totalAssignedSeats > maxSeatsAllowed) {
      toast.error(`Cannot assign more than ${maxSeatsAllowed} total seats to this committee (currently: ${totalAssignedSeats} seats).`);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/committees', {
        name: name.trim(),
        total_amount: parseFloat(totalAmount),
        total_members: parseInt(totalMembers, 10),
        deduction_rate: parseFloat(deductionRate),
        special_month_index: parseInt(specialMonthIndex, 10),
        start_date: startDate,
        members: selectedMembers,
        seats: seatsMap
      });

      if (res.data.success) {
        toast.success('Committee created successfully!');
        navigate(`/committees/${res.data.committee_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create committee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-orange-600 hover:border-orange-200 transition shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-orange-500" />
            Create New Committee
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Configure financial pool parameters with real-time schedule preview & member seat distribution
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Form Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-4 h-4 text-orange-500" />
            Pool Parameters & Formula Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Committee Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Committee Name / Scheme Identifier *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 2 Lakh 20-Month Gold Pool 2026"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Total Amount V */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
                  Total Chit Pool Value (V) *
                </label>
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
                min="1000"
                step="1000"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Total Members M */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                Total Members / Rounds (M) *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                required
                value={totalMembers}
                onChange={(e) => setTotalMembers(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Deduction Rate R */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Deduction Rate (R %) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={deductionRate}
                onChange={(e) => setDeductionRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                Base Unit: ₹{((totalAmount * deductionRate) / 100).toFixed(2)}
              </span>
            </div>

            {/* Zero Deduction / Special Month Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
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

              {/* Month Dropdown */}
              <select
                value={specialMonthNumber}
                onChange={(e) => setSpecialMonthNumber(e.target.value === 'none' ? 'none' : parseInt(e.target.value, 10))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              >
                <option value={2}>Month 2 — Full ₹{Number(totalAmount || 0).toLocaleString('en-IN')} (Standard)</option>
                <option value={1}>Month 1 — First Draw Full Payout</option>
                {Array.from({ length: Math.max(0, parseInt(totalMembers, 10) - 2) }, (_, i) => i + 3).map((m) => (
                  <option key={m} value={m}>Month {m} — Full Payout</option>
                ))}
                <option value="none">None — Standard deduction applied every month</option>
              </select>

              <span className="text-[11px] text-slate-500 mt-1.5 block">
                {specialMonthNumber === 'none' 
                  ? 'Har mahine formula deduction lagu hoga.' 
                  : `Month ${specialMonthNumber} ke winner ko bina kisi deduction ke poori pool amount (₹${Number(totalAmount || 0).toLocaleString('en-IN')}) milti hai.`}
              </span>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                First Draw Date (Start Date) *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

          </div>
        </div>

        {/* Member Seats Allocation Section */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Enroll Members & Allocate Seats
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select enrolled members and assign seat counts (a member can hold 1, 2, or more seats).
              </p>
            </div>
            
            <div className={`px-4 py-2 rounded-xl text-xs font-bold font-mono border ${
              totalAssignedSeats === maxSeatsAllowed 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                : totalAssignedSeats < maxSeatsAllowed 
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-rose-50 border-rose-300 text-rose-700'
            }`}>
              Seats: {totalAssignedSeats} / {maxSeatsAllowed}
            </div>
          </div>

          {allMembers.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              No members registered yet. You can still create the committee and enroll members later from the committee details view.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {allMembers.map(m => {
                const isSelected = selectedMembers.includes(m.id);
                const seats = seatsMap[m.id] || 1;

                return (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMember(m.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-orange-50/80 border-orange-300 text-orange-950 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
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
                      <div 
                        onClick={(e) => e.stopPropagation()} 
                        className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-orange-200 ml-2 shadow-xs"
                      >
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
          )}
        </div>

        {/* Live Calculation Preview Table */}
        {preview && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-500" />
                  Live Mathematical Schedule Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated dynamically from formula V - (N × BaseUnit)
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-600">
                Base Unit: <strong className="text-orange-600">₹{preview.base_unit}</strong>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-orange-50/70 text-slate-800 uppercase tracking-wider font-bold border-b border-orange-200">
                  <tr>
                    <th className="py-3 px-4">Month / Kisht</th>
                    <th className="py-3 px-4 text-right">Total Deduction (₹)</th>
                    <th className="py-3 px-4 text-right">Winner Net Payout (₹)</th>
                    <th className="py-3 px-4 text-right">Monthly Kist / Member (₹)</th>
                    <th className="py-3 px-4 text-center">Estimated Draw Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                  {preview.rows.map((r) => (
                    <tr 
                      key={r.month_no} 
                      className={`hover:bg-orange-50/30 transition ${r.is_special ? 'bg-amber-50/60 text-amber-950 font-semibold' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900 flex items-center gap-2">
                        Month {r.month_no}
                        {r.is_special && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300 font-bold">
                            Zero Deduction Month
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">₹{r.deduction_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-orange-600">₹{r.net_payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-slate-900">₹{r.installment_per_member.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-center font-sans text-slate-500">{r.draw_date || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900 font-mono">
                  <tr>
                    <td className="py-3.5 px-4 font-sans font-extrabold">TOTALS</td>
                    <td className="py-3.5 px-4 text-right text-amber-700">₹{preview.total_deduction_sum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-right text-orange-600">₹{preview.total_net_payout_sum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-right text-slate-900">₹{preview.total_member_contribution.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-center font-sans text-slate-500">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-xl shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Generating Committee & Schedules...' : (
              <>
                <PlusCircle className="w-4 h-4" /> Create Committee & Generate Schedules
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
