import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, BellRing, Plus, Check, Trash2, AlertTriangle,
  Calendar, IndianRupee, Clock, X, ChevronRight,
  Gavel, CheckCircle, AlertCircle, Loader2, MessageCircle, Layers
} from 'lucide-react';
import api from '../api/client';
import { encodeId } from '../utils/hashids';
import { makeWhatsAppPaymentReminder } from '../utils/whatsapp';

const TYPE_META = {
  urgent:  { label: 'Urgent',  color: 'bg-red-100 text-red-700 border-red-200',   dot: 'bg-red-500',    icon: AlertTriangle },
  payment: { label: 'Payment', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: IndianRupee },
  draw:    { label: 'Draw',    color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', icon: Gavel },
  custom:  { label: 'Custom',  color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500',   icon: Bell },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysFromNow(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dateStr }) {
  const days = daysFromNow(dateStr);
  if (days === null) return null;
  if (days < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Overdue by {Math.abs(days)}d</span>;
  if (days === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">Due Today!</span>;
  if (days <= 3) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">In {days}d</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{formatDate(dateStr)}</span>;
}

export default function Reminders() {
  const [data, setData] = useState({ reminders: [], auto_alerts: { pending_payments: [], upcoming_draws: [] }, counts: {} });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [form, setForm] = useState({ title: '', description: '', due_date: '', reminder_type: 'custom' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reminders');
      if (res.data.success) setData(res.data);
    } catch (err) {
      setErrorMsg('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, isError = false) => {
    if (isError) { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    setFormLoading(true); setFormError('');
    try {
      const res = await api.post('/reminders', form);
      if (res.data.success) {
        setShowForm(false);
        setForm({ title: '', description: '', due_date: '', reminder_type: 'custom' });
        flash(res.data.message);
        load();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create reminder');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDone = async (hashId) => {
    setActionLoading(hashId);
    try {
      const res = await api.patch(`/reminders/${hashId}/done`);
      if (res.data.success) { flash(res.data.message); load(); }
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to mark done', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (hashId) => {
    if (!window.confirm('Delete this reminder?')) return;
    setActionLoading(hashId);
    try {
      const res = await api.delete(`/reminders/${hashId}`);
      if (res.data.success) { flash(res.data.message); load(); }
    } catch (err) {
      flash('Failed to delete reminder', true);
    } finally {
      setActionLoading(null);
    }
  };

  const { reminders, auto_alerts, counts } = data;
  const pendingPayments = auto_alerts?.pending_payments || [];
  const upcomingDraws = auto_alerts?.upcoming_draws || [];
  const totalAlerts = (counts?.total || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Reminder Center</h1>
            <p className="text-xs text-slate-500 font-medium">
              {loading ? 'Loading...' : `${totalAlerts} active reminder${totalAlerts !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-lg shadow-orange-200 transition active:scale-[0.97]"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Reminder'}
        </button>
      </div>

      {/* Flash messages */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-semibold shadow-xs">
          <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-50 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-4">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create New Reminder
            </h2>
          </div>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            {formError && (
              <div className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Reminder Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Collect payment from Rahul bhai"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                  maxLength={255}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Add notes or details..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date (Optional)</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Type</label>
                <select
                  value={form.reminder_type}
                  onChange={e => setForm(p => ({ ...p, reminder_type: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white"
                >
                  <option value="custom">📌 Custom Note</option>
                  <option value="payment">💰 Payment Reminder</option>
                  <option value="draw">🔨 Draw Reminder</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md shadow-orange-200 transition disabled:opacity-60"
              >
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {formLoading ? 'Saving...' : 'Save Reminder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Loading reminders...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Auto Alert: Upcoming Draws ── */}
          {upcomingDraws.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Gavel className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Upcoming Draws (Next 30 Days)</h2>
                <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">{upcomingDraws.length}</span>
              </div>
              <div className="grid gap-3">
                {upcomingDraws.map((d, i) => {
                  const days = daysFromNow(d.draw_date);
                  return (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-purple-100 shadow-xs hover:shadow-md hover:border-purple-200 transition group">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Gavel className="w-4.5 h-4.5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{d.committee_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Month {d.month_no} Draw — Winner not selected yet</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <DueBadge dateStr={d.draw_date} />
                        <Link
                          to={`/committees/${d.committee_hash_id}`}
                          className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-0.5"
                        >
                          Open <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Auto Alert: Pending Payments with WhatsApp Reminder ── */}
          {pendingPayments.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <IndianRupee className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Pending Member Payments</h2>
                <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {pendingPayments.length} pending
                </span>
              </div>
              <div className="grid gap-3">
                {pendingPayments.map((p, i) => {
                  const waLink = p.member_phone ? makeWhatsAppPaymentReminder({
                    phone: p.member_phone,
                    memberName: p.member_name,
                    committeeName: p.committee_name,
                    monthNo: p.month_no,
                    amountDue: p.total_due,
                    drawDate: p.draw_date
                  }) : null;

                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-amber-100 shadow-xs hover:shadow-md hover:border-amber-200 transition group">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                          <IndianRupee className="w-4.5 h-4.5 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 truncate">{p.member_name}</p>
                            {p.seat_no > 1 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                Seat #{p.seat_no}
                              </span>
                            )}
                            {p.member_phone && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({p.member_phone})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{p.committee_name}</span> · Month {p.month_no} · Due: <span className="font-bold text-rose-600 font-mono">₹{parseFloat(p.total_due).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            {parseFloat(p.penalty_amount || 0) > 0 && (
                              <span className="text-amber-600 text-[11px] ml-1">(+₹{p.penalty_amount} penalty)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {p.draw_date && <DueBadge dateStr={p.draw_date} />}

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Send WhatsApp Reminder to ${p.member_name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold transition shadow-xs active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        <Link
                          to={`/committees/${p.committee_hash_id}`}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 text-xs font-semibold transition border border-slate-200/80 hover:border-orange-200"
                        >
                          Collect <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Manual Reminders ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Bell className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-extrabold text-slate-800">My Reminders</h2>
              <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">{reminders.length}</span>
            </div>

            {reminders.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No reminders yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "New Reminder" to create one</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {reminders.map(r => {
                  const meta = TYPE_META[r.reminder_type] || TYPE_META.custom;
                  const Icon = meta.icon;
                  const isLoading = actionLoading === r.hash_id;
                  return (
                    <div key={r.hash_id} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-orange-100 transition group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.color.split(' ').slice(0, 1).join(' ')}`}>
                        <Icon className="w-4 h-4" style={{ color: 'currentColor' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 flex-1">{r.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</p>
                        )}
                        {r.committee_name && (
                          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> {r.committee_name}
                          </p>
                        )}
                        {r.due_date && (
                          <div className="mt-2">
                            <DueBadge dateStr={r.due_date} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDone(r.hash_id)}
                          disabled={isLoading}
                          title="Mark as Done"
                          className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(r.hash_id)}
                          disabled={isLoading}
                          title="Delete"
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Empty state when everything is clear */}
          {reminders.length === 0 && pendingPayments.length === 0 && upcomingDraws.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Sab Clear Hai! 🎉</h3>
              <p className="text-sm text-slate-500 mt-1">No pending payments, no upcoming draws, no reminders.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
