import React, { useState, useEffect } from 'react';
import { 
  X, MessageCircle, Copy, Check, RotateCcw, 
  Send, Phone, IndianRupee, Calendar, User, Sparkles
} from 'lucide-react';
import { buildPaymentReminderMessage, cleanPhone } from '../utils/whatsapp';

export default function WhatsAppModal({
  isOpen,
  onClose,
  data, // { memberName, phone, committeeName, monthNo, amountDue, drawDate, seatsCount, seatNumbers, organizerName, organizerPhone, memberId, lastReminded }
  onSent
}) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data && isOpen) {
      const defaultMsg = buildPaymentReminderMessage({
        memberName: data.memberName,
        committeeName: data.committeeName,
        monthNo: data.monthNo,
        amountDue: data.amountDue,
        drawDate: data.drawDate,
        seatsCount: data.seatsCount,
        seatNumbers: data.seatNumbers,
        organizerName: data.organizerName,
        organizerPhone: data.organizerPhone,
        customNote: data.customNote
      });
      setMessage(defaultMsg);
      setCopied(false);
    }
  }, [data, isOpen]);

  if (!isOpen || !data) return null;

  const phoneCleaned = cleanPhone(data.phone);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    let url = '';
    if (phoneCleaned) {
      url = `https://wa.me/${phoneCleaned}?text=${encodeURIComponent(message)}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    }

    window.open(url, '_blank');

    if (onSent && data.memberId) {
      onSent(data.memberId);
    }
    onClose();
  };

  const handleReset = () => {
    const defaultMsg = buildPaymentReminderMessage({
      memberName: data.memberName,
      committeeName: data.committeeName,
      monthNo: data.monthNo,
      amountDue: data.amountDue,
      drawDate: data.drawDate,
      seatsCount: data.seatsCount,
      seatNumbers: data.seatNumbers,
      organizerName: data.organizerName,
      organizerPhone: data.organizerPhone
    });
    setMessage(defaultMsg);
  };

  const appendText = (extra) => {
    setMessage(prev => prev + '\n' + extra);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>WhatsApp Payment Reminder</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Official Committee Notice • Review or edit before sending
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Info Strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-slate-900">{data.memberName}</strong>
            {data.phone ? (
              <span className="font-mono text-slate-500">({data.phone})</span>
            ) : (
              <span className="text-amber-600 font-semibold">(No phone saved)</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Due: <strong className="text-rose-600 font-mono text-sm">₹{parseFloat(data.amountDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </span>
            {data.lastReminded && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Sent: {data.lastReminded}
              </span>
            )}
          </div>
        </div>

        {/* Textarea Area */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Message Content (WhatsApp Text)</span>
            <button
              onClick={handleReset}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition"
              title="Reset to default format"
            >
              <RotateCcw className="w-3 h-3" /> Reset Format
            </button>
          </div>

          <div className="relative">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={10}
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition leading-relaxed bg-slate-50/50 resize-y"
              placeholder="Type your message here..."
            />
          </div>

          {/* Quick Insert Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Add to Message:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => appendText('💳 *UPI ID:* ' + (data.organizerPhone ? `${data.organizerPhone}@upi` : '________@upi'))}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
              >
                + UPI ID
              </button>
              <button
                type="button"
                onClick={() => appendText('⏰ *Deadline:* Kripya aaj shaam 6 baje tak payment complete karein.')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
              >
                + Aaj Shaam Tak
              </button>
              <button
                type="button"
                onClick={() => appendText('📞 Kisi bhi query ke liye mujhe turant phone karein.')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
              >
                + Call Me Note
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 btn-press"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send on WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
