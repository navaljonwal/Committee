/**
 * WhatsApp Reminder Utility
 * 
 * Generates a wa.me link that opens WhatsApp with a pre-filled message.
 * Works on both mobile (opens WhatsApp app) and desktop (opens WhatsApp Web).
 */

/**
 * Clean phone number — remove spaces, dashes, brackets; ensure starts with 91
 * @param {string} phone 
 * @returns {string}
 */
function cleanPhone(phone) {
  if (!phone) return null;
  // Remove all non-digits
  let digits = String(phone).replace(/\D/g, '');
  // If 10 digits, prepend India country code
  if (digits.length === 10) digits = '91' + digits;
  // If starts with 0, replace with 91
  if (digits.startsWith('0')) digits = '91' + digits.slice(1);
  return digits.length >= 10 ? digits : null;
}

/**
 * Generate a WhatsApp reminder link for a pending payment
 * @param {Object} params
 * @param {string} params.phone - Member phone number
 * @param {string} params.memberName - Member name
 * @param {string} params.committeeName - Committee name
 * @param {number} params.monthNo - Month number
 * @param {number} params.amountDue - Total amount due
 * @param {string} [params.drawDate] - Draw date (optional)
 * @param {number} [params.seatsCount] - Number of seats (optional, default 1)
 * @param {string} [params.seatNumbers] - Seat number or formatted list of seats (optional)
 * @returns {string|null} - wa.me URL or null if no valid phone
 */
export function makeWhatsAppPaymentReminder({ 
  phone, 
  memberName, 
  committeeName, 
  monthNo, 
  amountDue, 
  drawDate,
  seatsCount = 1,
  seatNumbers = null 
}) {
  const cleanedPhone = phone ? cleanPhone(phone) : null;

  const amount = parseFloat(amountDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  let drawInfo = '';
  if (drawDate) {
    try {
      const d = new Date(drawDate);
      if (!isNaN(d.getTime())) {
        drawInfo = `\n📅 Draw Date: ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      }
    } catch (_) {}
  }

  let seatInfo = '';
  if (seatsCount > 1) {
    const seatsStr = seatNumbers ? ` (${seatNumbers})` : '';
    seatInfo = `\n🎫 *Seats:* ${seatsCount} Seats${seatsStr}`;
  } else if (seatNumbers) {
    seatInfo = `\n🎫 *Seat:* ${seatNumbers}`;
  }

  const message = `🔔 *Kameti Payment Reminder*

Namaskar ${memberName || 'Member'} ji,

Aapka is mahine ka Kameti installment pending hai:

🏦 *Committee:* ${committeeName}
📆 *Month:* ${monthNo}${seatInfo}
💰 *Total Amount Due:* ₹${amount}${drawInfo}

Kripya jald se jald payment karein.

Shukriya 🙏
_Kameti Pro_`;

  if (cleanedPhone) {
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a WhatsApp reminder for a draw date
 * @param {Object} params
 * @returns {string|null}
 */
export function makeWhatsAppDrawReminder({ phone, memberName, committeeName, monthNo, drawDate }) {
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) return null;

  let dateStr = 'Jald hi';
  if (drawDate) {
    try {
      const d = new Date(drawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (_) {}
  }

  const message = `🎯 *Kameti Draw Reminder*

Namaskar ${memberName || 'Member'} ji,

Aapki Kameti ka draw hone wala hai!

🏦 *Committee:* ${committeeName}
📆 *Month:* ${monthNo}
🗓️ *Draw Date:* ${dateStr}

Bidding ke liye taiyaar rahein!

Shukriya 🙏
_Kameti Pro_`;

  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate a generic WhatsApp message link to a member
 * @param {string} phone
 * @param {string} message
 * @returns {string|null}
 */
export function makeWhatsAppLink(phone, message) {
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) return null;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
}
