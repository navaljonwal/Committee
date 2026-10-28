import React, { useState, useEffect } from 'react';
import { 
  X, MessageCircle, Copy, Check, RotateCcw, 
  Send, Phone, IndianRupee, Calendar, User, Sparkles
} from 'lucide-react';
import { buildPaymentReminderMessage, cleanPhone, openWhatsAppUrl } from '../utils/whatsapp';
import ActionDrawer from './ActionDrawer';

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
        dueDate: data.dueDate,
        graceDays: data.graceDays,
        penaltyPerSeat: data.penaltyPerSeat,
        penaltyAmount: data.penaltyAmount,
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

  const handleClose = () => {
    document.body.style.overflow = '';
    onClose();
  };

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

    // 1. Mark reminder as sent in parent state immediately
    if (onSent) {
      onSent(data.memberId || data.key);
    }

    // 2. Close modal immediately to remove the drawer and backdrop overlay from the DOM
    handleClose();

    // 3. Open WhatsApp link safely in a non-blocking way after modal unmounts
    setTimeout(() => {
      openWhatsAppUrl(url);
    }, 50);
  };

  const handleReset = () => {
    const defaultMsg = buildPaymentReminderMessage({
      memberName: data.memberName,
      committeeName: data.committeeName,
      monthNo: data.monthNo,
      amountDue: data.amountDue,
      drawDate: data.drawDate,
      dueDate: data.dueDate,
      graceDays: data.graceDays,
      penaltyPerSeat: data.penaltyPerSeat,
      penaltyAmount: data.penaltyAmount,
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

  if (!isOpen || !data) return null;

  return (
    <ActionDrawer
      isOpen={isOpen && !!data}
      onClose={handleClose}
      icon={MessageCircle}
      title="WhatsApp Payment Reminder"
      subtitle="Review or edit message before sending"
      maxWidth="sm:max-w-xl md:max-w-2xl"
      headerBg="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent"
      footer={
        <div>
          {/* Mobile Layout (< sm) */}
          <div className="sm:hidden space-y-2">
            <button
              type="button"
              onClick={handleSend}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send on WhatsApp</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition active:scale-98 text-center"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Desktop Layout (sm+) */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-98"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-transparent hover:bg-slate-200/60 text-slate-600 text-xs font-semibold transition active:scale-98"
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
      }
    >
      {/* Member & Payment Info Strip */}
      <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-50/90 border-b border-slate-100 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 text-xs">
          {/* Member Details */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-[10px] shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-900 truncate text-xs sm:text-sm">
                {data.memberName}
              </span>
              {data.phone ? (
                <span className="font-mono text-slate-500 text-[11px]">
                  ({data.phone})
                </span>
              ) : (
                <span className="text-amber-600 font-semibold text-[10px]">
                  (No phone)
                </span>
              )}
            </div>
          </div>

          {/* Financial Details & Sent Status */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 font-medium">
              <span>Month {data.monthNo} Due:</span>
              <span className="font-black text-rose-600 font-mono text-xs sm:text-sm">
                ₹{parseFloat(data.amountDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {data.lastReminded && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0" title={`Sent on ${data.lastReminded}`}>
                <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                <span className="truncate max-w-[120px] sm:max-w-none">Sent: {data.lastReminded}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Message Editor */}
      <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3 flex-1 overscroll-contain">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span>Message Text</span>
            <span className="text-[10px] font-normal text-slate-400 font-mono">({message.length} chars)</span>
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 transition active:scale-95"
            title="Reset to default format"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="relative">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full p-3 sm:p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition leading-relaxed bg-slate-50/60 h-36 sm:h-52 resize-none sm:resize-y shadow-inner"
            placeholder="Type or edit message here..."
          />
        </div>

        {/* Quick Insert Chips */}
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Quick Add:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => appendText('💳 *UPI ID:* ' + (data.organizerPhone ? `${data.organizerPhone}@upi` : '________@upi'))}
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition active:scale-95"
            >
              + UPI ID
            </button>
            <button
              type="button"
              onClick={() => appendText('⏰ *Deadline:* Kripya aaj shaam 6 baje tak payment complete karein.')}
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition active:scale-95"
            >
              + Aaj Shaam Tak
            </button>
            <button
              type="button"
              onClick={() => appendText('📞 Kisi bhi query ke liye mujhe turant call karein.')}
              className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition active:scale-95"
            >
              + Call Me Note
            </button>
          </div>
        </div>
      </div>
    </ActionDrawer>
  );
}
