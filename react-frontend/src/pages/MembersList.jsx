import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  X, 
  AlertCircle,
  Award,
  Layers,
  MessageCircle
} from 'lucide-react';
import api from '../api/client';
import { usePopup } from '../context/PopupContext';

export default function MembersList() {
  const { showConfirm, toast } = usePopup();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password visibility toggle tracker
  const [showPassMap, setShowPassMap] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Add / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
      if (res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormPhone('');
    setFormPassword('');
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormPhone(m.phone || '');
    setFormPassword('');
    setModalOpen(true);
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePassword = (id) => {
    setShowPassMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShareWhatsApp = (member) => {
    const rawPass = member.plain_password || '';
    const loginUser = member.phone || member.user_email || `member${member.id}@kameti.com`;
    const loginUrl = `${window.location.origin}/login`;

    const message = `Namaste ${member.name} ji! 🙏\n\nAapka Kameti / ChitFund Pro Portal Login Details:\n\n🌐 *Login Portal:* ${loginUrl}\n👤 *Login ID / Mobile:* ${loginUser}\n🔑 *Password:* ${rawPass || '(Aapka set kiya hua password)'}\n\nAap is link par login karke apni sabhi active kametis, mahine ki kist aur live auction bids dekh sakte hain.\n\nDhanyawad! ✨`;

    let phoneClean = (member.phone || '').replace(/[^0-9]/g, '');
    let waUrl = '';

    if (phoneClean) {
      if (phoneClean.length === 10) {
        phoneClean = '91' + phoneClean;
      }
      waUrl = `https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`;
    } else {
      waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }

    window.open(waUrl, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Member name is required');
      return;
    }

    setSubmitting(true);

    try {
      if (editingMember) {
        const res = await api.put(`/members/${editingMember.id}`, {
          name: formName.trim(),
          phone: formPhone.trim() || null,
          password: formPassword.trim() || null
        });
        if (res.data.success) {
          toast.success(res.data.message || 'Member updated successfully');
          setModalOpen(false);
          loadMembers();
        }
      } else {
        const res = await api.post('/members', {
          name: formName.trim(),
          phone: formPhone.trim() || null,
          password: formPassword.trim() || null
        });
        if (res.data.success) {
          toast.success(res.data.message || 'Member registered successfully');
          setModalOpen(false);
          loadMembers();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm({
      title: 'Delete Member?',
      message: `Are you sure you want to delete member "${name}" and their login account?\n\nThis action cannot be undone.`,
      confirmText: 'Delete Member',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const res = await api.delete(`/members/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Member deleted successfully');
        loadMembers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete member');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
            Members Directory
          </h1>
          <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1 font-medium">
            Manage member records, credentials, portal access passwords, and committee participation
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-orange-600/25 transition duration-150 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      {/* Members Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-3.5 sm:p-8 space-y-4 shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Login Identity / User</th>
                <th className="py-3 px-4">Portal Password</th>
                <th className="py-3 px-4 text-center">Committees</th>
                <th className="py-3 px-4 text-center">Won Draws</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No members found. Click "Add New Member" to register your first contributor.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const pass = m.plain_password || '******';
                  const isVisible = showPassMap[m.id];
                  const isCopied = copiedId === m.id;

                  return (
                    <tr key={m.id} className="hover:bg-orange-50/40 transition duration-150">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {m.name}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {m.phone}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Phone</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {m.user_email || `member${m.id}@kameti.com`}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="inline-flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="text-slate-800 font-medium">
                            {isVisible ? pass : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePassword(m.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title={isVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {m.plain_password && (
                            <>
                              <button
                                onClick={() => handleCopy(m.id, m.plain_password)}
                                className="text-slate-400 hover:text-orange-600 p-0.5"
                                title="Copy Password"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleShareWhatsApp(m)}
                                className="text-emerald-500 hover:text-emerald-700 p-0.5 hover:scale-110 transition"
                                title="Share ID & Password on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-semibold">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200">
                          {m.committees_count || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-semibold">
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center justify-center gap-1 w-fit mx-auto">
                          <Award className="w-3 h-3 text-amber-500" />
                          {m.won_schedules_count || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleShareWhatsApp(m)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Share ID & Password on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="Edit Member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Member Cards (MNC App Style) */}
        <div className="md:hidden space-y-3">
          {members.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium text-xs">
              No members found. Tap "Add New Member" to register your first contributor.
            </div>
          ) : (
            members.map((m) => {
              const pass = m.plain_password || '******';
              const isVisible = showPassMap[m.id];
              const isCopied = copiedId === m.id;

              return (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 space-y-3">
                  {/* Top: Avatar, Name, Phone */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm border border-orange-200 flex-shrink-0 shadow-2xs">
                        {m.name ? m.name.substring(0, 2).toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{m.name}</h3>
                        {m.phone ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{m.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No phone</span>
                        )}
                      </div>
                    </div>

                    {/* Chips for committees & won draws */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200" title="Committees Enrolled">
                        {m.committees_count || 0} Pool{m.committees_count !== 1 ? 's' : ''}
                      </span>
                      {m.won_schedules_count > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5" title="Won Draws">
                          <Award className="w-3 h-3 text-amber-500" />
                          {m.won_schedules_count} Won
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">Login User:</span>
                      <span className="text-slate-700 font-medium truncate max-w-[200px]">
                        {m.user_email || `member${m.id}@kameti.com`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 font-sans text-[11px]">Password:</span>
                      <div className="inline-flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        <span className="text-slate-800 font-medium">
                          {isVisible ? pass : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePassword(m.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title={isVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {m.plain_password && (
                          <>
                            <button
                              onClick={() => handleCopy(m.id, m.plain_password)}
                              className="text-slate-400 hover:text-orange-600 p-0.5"
                              title="Copy Password"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(m)}
                              className="text-emerald-500 hover:text-emerald-700 p-0.5"
                              title="Share on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 flex-wrap">
                    <button
                      onClick={() => handleShareWhatsApp(m)}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow-xs"
                      title="Share ID & Password on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone}`}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> Call
                      </a>
                    )}
                    <button
                      onClick={() => openEditModal(m)}
                      className="py-1.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition border border-orange-200"
                    >
                      <Edit className="w-3.5 h-3.5 text-orange-600" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-600" />
                {editingMember ? 'Edit Member Credentials' : 'Register New Member'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number (10 Digits)</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Portal Login Password {editingMember ? '(Leave empty to keep current)' : '(Auto-generated if empty)'}
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingMember ? 'Leave empty to keep existing password' : 'e.g. rahul3210 (or leave empty)'}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Default format: First word of name + last 4 digits of phone number.
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                {editingMember ? (
                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(editingMember)}
                    className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 active:scale-95"
                    title="Share ID & Password on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
                  </button>
                ) : <div />}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-600/25 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Create Member'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
