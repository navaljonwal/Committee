import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';
import api from '../api/client';

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      setErrorMsg(err.response?.data?.message || 'Failed to load members');
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
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormPhone(m.phone || '');
    setFormPassword('');
    setErrorMsg('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Member name is required');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingMember) {
        const res = await api.put(`/members/${editingMember.id}`, {
          name: formName.trim(),
          phone: formPhone.trim() || null,
          password: formPassword.trim() || null
        });
        if (res.data.success) {
          setSuccessMsg(res.data.message);
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
          setSuccessMsg(res.data.message);
          setModalOpen(false);
          loadMembers();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete member "${name}" and their login account?`)) {
      return;
    }

    try {
      const res = await api.delete(`/members/${id}`);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        loadMembers();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete member');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-orange-600" />
            Members Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage member records, credentials, portal access passwords, and committee participation
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold shadow-lg shadow-orange-600/25 transition duration-150 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" /> Add New Member
        </button>
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

      {/* Members Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="sm:hidden text-[10px] text-slate-400 font-semibold px-1 flex items-center gap-1">
          ← Scroll sideways to see all member columns & actions →
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
                            <button
                              onClick={() => handleCopy(m.id, m.plain_password)}
                              className="text-slate-400 hover:text-orange-600 p-0.5"
                              title="Copy Password"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
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

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
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
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
