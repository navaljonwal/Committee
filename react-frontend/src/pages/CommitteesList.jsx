import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  PlusCircle, 
  Users, 
  IndianRupee, 
  Calendar, 
  ArrowUpRight, 
  Clock, 
  FileSpreadsheet,
  Trash2,
  Edit
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { usePopup } from '../context/PopupContext';

export default function CommitteesList() {
  const { showConfirm, toast } = usePopup();
  const [data, setData] = useState({ stats: {}, committees: [], members: [] });
  const [loading, setLoading] = useState(true);

  const loadCommittees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/committees');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load committees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommittees();
  }, []);

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm({
      title: 'Delete Committee?',
      message: `Are you sure you want to delete committee "${name}"?\n\nAll related schedules, payments, and bids will be permanently removed.`,
      confirmText: 'Delete Committee',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const res = await api.delete(`/committees/${encodeId(id)}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Committee deleted successfully');
        loadCommittees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete committee');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading Committees...</span>
        </div>
      </div>
    );
  }

  const { stats, committees } = data;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Committees Dashboard
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
            Manage your ChitFund pools, scheduled draws, disbursements, and payment ledgers
          </p>
        </div>

        <Link
          to="/committees/create"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20 transition duration-150 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Committee
        </Link>
      </div>

      {/* KPI Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        
        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pools</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">
            {stats.total_committees || 0}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">Registered schemes</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Active Pools</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-600 mt-1 sm:mt-2">
            {stats.active_committees || 0}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">In progress</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Pool Value</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2 font-mono truncate">
            ₹{(stats.total_pool_value || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">Circulating volume</span>
        </div>

        <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Members</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-1 sm:mt-2">
            {stats.total_members || 0}
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block truncate">Contributors</span>
        </div>

      </div>

      {/* Committees Card Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500" />
            Active & Past Committees ({committees.length})
          </h2>
        </div>

        {committees.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center shadow-xs">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Committees Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first ChitFund committee with automated mathematical schedules and member seat distribution.
            </p>
            <Link
              to="/committees/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Create Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((c) => {
              const totalAmount = parseFloat(c.total_amount || 0);
              const membersCount = parseInt(c.members_count || 0, 10);
              const totalMembers = parseInt(c.total_members || 0, 10);
              const totalSeats = parseInt(c.total_seats_assigned || 0, 10);

              const isCompleted = c.status === 'completed';

              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition duration-200 hover:shadow-md hover:border-orange-300 flex flex-col justify-between shadow-xs ${
                    isCompleted ? 'border-slate-200/80 opacity-80' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Status badge & Name */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {c.name}
                      </h3>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                        c.status === 'active' 
                          ? 'bg-orange-50 text-orange-700 border-orange-200' 
                          : isCompleted 
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {/* Amount & Quick Metrics */}
                    <div className="bg-orange-50/40 rounded-2xl p-4 border border-orange-100 mb-4">
                      <div className="text-xs text-slate-500 font-semibold">Chit Pool Value (V)</div>
                      <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                        ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-3 border-t border-orange-200/60 font-medium">
                        <span>Duration / Rounds:</span>
                        <span className="font-bold text-slate-800">{totalMembers} Months</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 mt-1.5 font-medium">
                        <span>Deduction Rate:</span>
                        <span className="font-bold text-orange-600">{c.deduction_rate}% per base</span>
                      </div>
                    </div>

                    {/* Seats and Start Date */}
                    <div className="space-y-2 text-xs text-slate-600 font-medium">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-orange-500" />
                          Seats Allocated:
                        </span>
                        <span className={`font-bold ${totalSeats === totalMembers ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {totalSeats} / {totalMembers} Seats ({membersCount} Members)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Start Date:
                        </span>
                        <span className="text-slate-800 font-semibold">
                          {c.start_date ? new Date(c.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Link
                        to={`/committees/${encodeId(c.id)}/edit`}
                        className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                        title="Edit Committee Parameters"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      <a
                        href={`/api/committees/${encodeId(c.id)}/export/csv`}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                        title="Download Schedule CSV"
                        download
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </a>

                      {!isCompleted && (
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete Committee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <Link
                      to={`/committees/${encodeId(c.id)}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition shadow-xs"
                    >
                      View Schedule <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
