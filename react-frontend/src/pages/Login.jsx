import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePopup } from '../context/PopupContext';
import { Layers, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = usePopup();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(identity, password);
      toast.success(`Welcome back, ${res.user.name || 'User'}!`);
      if (res.user.role === 'admin') {
        navigate('/');
      } else {
        navigate('/member/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Warm Orange Glow background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 shadow-xl shadow-orange-500/25 mb-4 animate-float">
            <Layers className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            BachatKhata <span className="text-orange-600">Pro</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            निजी समूह बचत एवं व्यक्तिगत खाता-बही (Private Peer Group Savings Ledger)
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/50 animate-scale-in">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-xs text-slate-500 mb-6">
            Login with your Email, Phone Number, or Full Name
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email / Phone / Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="e.g. 9999999999 or Name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 btn-press shimmer-sweep cursor-pointer"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Admin & Member accounts are unified. Sign in with your registered phone or name.
            </span>
          </div>
        </div>

        {/* Statutory Legal Disclaimer Card (Zero Regulatory Risk) */}
        <div className="mt-4 p-3.5 bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-2xl text-[10px] text-slate-500 leading-relaxed space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>वैधानिक सूचना एवं निजी खाता-बही डिस्क्लेमर</span>
          </div>
          <p>
            यह पोर्टल केवल मित्रों एवं परिवारजनों के <strong>निजी समूह बचत (Private Peer Group Savings & Expense Ledger)</strong> का डिजिटल हिसाब-किताब रखने हेतु एक आंतरिक पर्सनल रिकॉर्ड-कीपिंग टूल है। यह पोर्टल किसी भी प्रकार की कमर्शियल बैंकिंग, वित्तीय निवेश, चिटफंड (Chit Fund), प्राइज़ चिट अथवा जनता से जमा (Public Deposits) स्वीकार करने का कार्य नहीं करता है।
          </p>
        </div>

      </div>
    </div>
  );
}
