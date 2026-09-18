import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gavel, 
  Calendar, 
  IndianRupee, 
  Award, 
  Check, 
  Clock, 
  AlertCircle,
  Radio,
  CheckCircle2,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import api from '../api/client';

export default function MemberCommittee() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [liveBidsData, setLiveBidsData] = useState({ bids: {}, highest_bids: {}, lock_status: {} });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Bid submission state
  const [activeBidScheduleId, setActiveBidScheduleId] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidRemarks, setBidRemarks] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/member/committees/${id}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load committee');
    } finally {
      setLoading(false);
    }
  };

  const pollLiveBids = async () => {
    try {
      const res = await api.get(`/member/committees/${id}/live-bids`);
      if (res.data) {
        setLiveBidsData(res.data);
      }
    } catch (err) {
      // silent poll error
    }
  };

  useEffect(() => {
    loadInitialData();
    pollLiveBids();

    // 10 second auto-polling
    const interval = setInterval(pollLiveBids, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleOpenBid = (schedule) => {
    setActiveBidScheduleId(schedule.id);
    const myBid = data?.myBids?.[schedule.id];
    const topBid = liveBidsData?.highest_bids?.[schedule.id];
    const minNext = topBid?.min_next_bid || parseFloat(schedule.deduction_amount || 0);

    setBidAmount(myBid ? myBid.bid_amount : minNext);
    setBidRemarks(myBid ? (myBid.remarks || '') : '');
    setErrorMsg('');
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setSubmittingBid(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/member/schedules/${activeBidScheduleId}/bid`, {
        bid_amount: parseFloat(bidAmount),
        remarks: bidRemarks
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setActiveBidScheduleId(null);
        pollLiveBids();
        loadInitialData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.committee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-800 font-medium">
        Committee not found or you are not enrolled.
      </div>
    );
  }

  const { committee, schedules, totalSeats, wonCount, remainingSeats, alreadyWonAllSeats, myPayments } = data;
  const { bids, highest_bids, lock_status } = liveBidsData;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/member/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-2 text-xs text-orange-700 font-bold bg-orange-50 border border-orange-200 px-3.5 py-1 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Live Auction Sync Active (10s)
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs font-medium">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-base">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between shadow-xs font-medium">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 font-bold text-base">×</button>
        </div>
      )}

      {/* Committee Overview Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {committee.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3 font-medium">
              <span>Pool Value: <strong className="text-orange-600 font-mono font-bold">₹{parseFloat(committee.total_amount).toLocaleString('en-IN')}</strong></span>
              <span>•</span>
              <span>Total Duration: <strong className="text-slate-800 font-sans font-bold">{committee.total_members} Months</strong></span>
              <span>•</span>
              <span>My Registration: <strong className="text-slate-800 font-sans font-bold">{totalSeats} Seat(s)</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-amber-600 font-sans font-bold">{wonCount} Won ({remainingSeats} Left to Win)</strong></span>
            </p>
          </div>

          {alreadyWonAllSeats && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>You have won draws for all {totalSeats} of your registered seats in this committee.</span>
            </div>
          )}
        </div>
      </div>

      {/* Auction Rounds List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-orange-600" />
          Auction Rounds & Draw Schedule
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => {
            const lInfo = lock_status?.[s.id] || {};
            const hBid = highest_bids?.[s.id] || {};
            const roundBids = bids?.[s.id] || [];

            const isLocked = lInfo.is_locked || s.is_custom_bid;
            const dateStatus = lInfo.date_status || 'today';
            const isWinnerAssigned = Boolean(s.winner_name || s.member_id);

            const canBid = !alreadyWonAllSeats && !isLocked && dateStatus === 'today';

            const myBid = roundBids.find(b => b.my_bid);

            return (
              <div
                key={s.id}
                className={`bg-white border rounded-3xl p-6 flex flex-col justify-between transition duration-200 shadow-xs ${
                  dateStatus === 'today' && !isLocked 
                    ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Month header & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">Month {s.month_no}</span>
                      {dateStatus === 'today' && !isLocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 animate-pulse">
                          LIVE AUCTION TODAY
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono text-slate-500 font-medium">
                      {s.draw_date ? new Date(s.draw_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>

                  {/* Pricing info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-mono mb-4">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Starting Base Deduction:</span>
                      <span className="text-slate-900 font-bold">₹{parseFloat(s.deduction_amount || 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Current Top Bid:</span>
                      <span className="text-orange-600 font-bold">
                        {hBid.amount ? `₹${parseFloat(hBid.amount).toLocaleString('en-IN')} (${hBid.name})` : 'No bids placed yet'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span>Net Payout to Winner:</span>
                      <span className="text-slate-900 font-black">₹{parseFloat(s.net_payout).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Status / Winner message */}
                  {isWinnerAssigned && (
                    <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2 font-medium">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Winner Assigned: <strong>{s.winner_name || 'Member'}</strong></span>
                    </div>
                  )}

                  {/* My Bid info if placed */}
                  {myBid && (
                    <div className="mb-4 p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 flex items-center justify-between font-medium">
                      <span>My Submitted Bid: <strong>₹{parseFloat(myBid.bid_amount).toLocaleString('en-IN')}</strong></span>
                      <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">{myBid.status}</span>
                    </div>
                  )}

                  {/* Recent Bids Feed */}
                  {roundBids.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Live Auction Room ({roundBids.length} bids placed)
                      </div>
                      <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                        {roundBids.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <span className="text-slate-700 font-medium">{b.name} {b.my_bid ? '(You)' : ''}</span>
                            <span className="font-mono font-bold text-orange-600">₹{parseFloat(b.bid_amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bidding Button or Date Guard Message */}
                <div className="pt-3 border-t border-slate-100">
                  {canBid ? (
                    <button
                      onClick={() => handleOpenBid(s)}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-600/25 transition flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Gavel className="w-4 h-4" />
                      {myBid ? 'Update My Auction Bid' : 'Place Live Auction Bid'}
                    </button>
                  ) : (
                    <div className="text-center text-[11px] text-slate-400 italic py-1 font-medium">
                      {isLocked 
                        ? 'Bidding closed by organizer' 
                        : dateStatus === 'before'
                          ? `Bidding opens on ${lInfo.draw_date || 'draw date'}`
                          : dateStatus === 'after'
                            ? 'Bidding closed (past draw date)'
                            : alreadyWonAllSeats
                              ? 'All your registered seats have won'
                              : 'Bidding unavailable'}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Bid Submission Modal */}
      {activeBidScheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Place Auction Bid</h3>
              </div>
              <button onClick={() => setActiveBidScheduleId(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleBidSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Deduction Bid Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter bid amount"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Rule: Your bid must be strictly higher than the current highest bid.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={bidRemarks}
                  onChange={(e) => setBidRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveBidScheduleId(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBid}
                  className="px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {submittingBid ? 'Submitting...' : 'Confirm Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
