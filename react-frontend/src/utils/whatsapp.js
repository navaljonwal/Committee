/**
 * WhatsApp Reminder Utility
 * 
 * Generates official, professional WhatsApp reminder messages and wa.me links.
 * Works seamlessly on mobile (WhatsApp App) and desktop (WhatsApp Web).
 */

/**
 * Clean phone number — remove spaces, dashes, brackets; ensure starts with country code 91
 * @param {string} phone 
 * @returns {string|null}
 */
export function cleanPhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  if (digits.length === 11 && digits.startsWith('0')) digits = '91' + digits.slice(1);
  return digits.length >= 10 ? digits : null;
}

/**
 * Cleanly format member name with "ji", preventing duplicate "ji" if name already contains it
 * e.g. "chhuttan lal ji" -> "chhuttan lal ji" (NOT "chhuttan lal ji ji")
 *      "chhuttan lal"    -> "chhuttan lal ji"
 * @param {string} name
 * @returns {string}
 */
export function formatMemberName(name) {
  if (!name || typeof name !== 'string') return 'Member ji';
  let cleaned = name.trim();
  // Strip trailing "ji" (one or more times) case-insensitively
  cleaned = cleaned.replace(/([\s\-_]+ji)+$/i, '').trim();
  return cleaned ? `${cleaned} ji` : 'Member ji';
}

/**
 * Build the enhanced, official payment reminder text message
 * @param {Object} params
 * @returns {string}
 */
export function buildPaymentReminderMessage({
  memberName,
  committeeName,
  monthNo,
  amountDue,
  drawDate,
  dueDate = null,
  graceDays = 5,
  penaltyPerSeat = 100,
  penaltyAmount = 0,
  seatsCount = 1,
  seatNumbers = null,
  organizerName = null,
  organizerPhone = null,
  customNote = null
}) {
  const cleanName = formatMemberName(memberName);
  const amount = parseFloat(amountDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  let drawInfo = '';
  if (drawDate) {
    try {
      const d = new Date(drawDate);
      if (!isNaN(d.getTime())) {
        drawInfo = `\n📅 *Boli / Draw Tareekh:* ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      }
    } catch (_) {}
  }

  let dueInfo = '';
  if (dueDate) {
    try {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        dueInfo = `\n⏰ *Antim Tareekh (Due Date):* ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (${graceDays} din ke andar)`;
      }
    } catch (_) {}
  }

  let penaltySection = '';
  const penalty = parseFloat(penaltyAmount || 0);
  if (penalty > 0) {
    penaltySection = `\n⚠️ *Late Penalty Alert:* Due date nikal chuki hai (+₹${penalty.toLocaleString('en-IN', { minimumFractionDigits: 2 })} penalty jodi gayi hai).`;
  } else if (penaltyPerSeat > 0) {
    penaltySection = `\n⚠️ *Late Penalty Niyam:* ${graceDays} din ke baad payment par ₹${penaltyPerSeat}/seat late fee lagegi.`;
  }

  let seatInfo = '';
  if (seatsCount > 1) {
    const seatsStr = seatNumbers ? ` (${seatNumbers})` : '';
    seatInfo = `\n🎫 *Seats:* ${seatsCount} Seats${seatsStr}`;
  } else if (seatNumbers) {
    seatInfo = `\n🎫 *Seat:* ${seatNumbers}`;
  }

  // Authentic Organizer contact & verification info
  let organizerSection = '';
  if (organizerName && organizerPhone) {
    organizerSection = `🙏 *Organizer (आयोजक):* ${organizerName}\n📞 *Sampark / GPay / PhonePe:* ${organizerPhone}`;
  } else if (organizerName) {
    organizerSection = `🙏 *Organizer (आयोजक):* ${organizerName}`;
  } else if (organizerPhone) {
    organizerSection = `📞 *Sampark / UPI:* ${organizerPhone}`;
  } else {
    organizerSection = `🙏 *Committee Prabandhan (Management)*`;
  }

  const noteSection = customNote ? `\n\n📝 *Note:* ${customNote}` : '';

  return `🔔 *कमैटी किस्त भुगतान सूचना*
*(Kameti Installment Reminder)*

नमस्ते *${cleanName}*, 🙏

Aapki *${committeeName || 'Kameti'}* ki is mahine ki kist (installment) jama karwane hetu suchna:

━━━━━━━━━━━━━━━━━━━━━
🏦 *Committee:* ${committeeName || 'Kameti'}
📆 *Kist / Mahina:* Month ${monthNo}${seatInfo}
💰 *Total Due (कुल बकाया):* ₹${amount}${drawInfo}${dueInfo}${penaltySection}
━━━━━━━━━━━━━━━━━━━━━

💳 *Payment Kaise Karein:*
Kripya apni kist Cash ya UPI / Online (GPay / PhonePe / Paytm) dwara samay par jama karwayen.
_(Yadi aap payment kar chuke hain, to kripya receipt / screenshot share karein.)_${noteSection}

${organizerSection}
━━━━━━━━━━━━━━━━━━━━━
_Official Committee Notice_`;
}

/**
 * Generate a WhatsApp reminder link for a pending payment
 * @param {Object} params
 * @returns {string|null} - wa.me URL
 */
export function makeWhatsAppPaymentReminder(params) {
  const { phone } = params || {};
  const cleanedPhone = phone ? cleanPhone(phone) : null;
  const message = buildPaymentReminderMessage(params || {});

  if (cleanedPhone) {
    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Build the draw reminder text message
 * @param {Object} params
 * @returns {string}
 */
export function buildDrawReminderMessage({
  memberName,
  committeeName,
  monthNo,
  drawDate,
  organizerName = null,
  organizerPhone = null
}) {
  const cleanName = formatMemberName(memberName);
  let dateStr = 'Jald hi';
  if (drawDate) {
    try {
      const d = new Date(drawDate);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (_) {}
  }

  let organizerSection = '';
  if (organizerName && organizerPhone) {
    organizerSection = `\n🙏 *Organizer (आयोजक):* ${organizerName}\n📞 *Sampark:* ${organizerPhone}`;
  } else if (organizerName) {
    organizerSection = `\n🙏 *Organizer (आयोजक):* ${organizerName}`;
  } else {
    organizerSection = `\n🙏 *Committee Prabandhan (Management)*`;
  }

  return `🎯 *कमैटी ड्रा / बोली सूचना (Draw Alert)* 🎯

नमस्ते *${cleanName}*, 🙏

Aapki *${committeeName}* ka Month ${monthNo} ka Draw / Bidding hone wala hai!

━━━━━━━━━━━━━━━━━━━━━
🏦 *Committee:* ${committeeName}
📆 *Kist / Mahina:* Month ${monthNo}
🗓️ *Draw Tareekh:* ${dateStr}
━━━━━━━━━━━━━━━━━━━━━

📢 Bidding / Draw ke liye taiyaar rahein!

${organizerSection}
━━━━━━━━━━━━━━━━━━━━━
_Official Committee Notice_`;
}

/**
 * Generate a WhatsApp reminder for a draw date
 * @param {Object} params
 * @returns {string|null}
 */
export function makeWhatsAppDrawReminder(params) {
  const cleanedPhone = cleanPhone(params?.phone);
  if (!cleanedPhone) return null;
  const message = buildDrawReminderMessage(params || {});
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

/**
 * Safely open a WhatsApp URL without locking or freezing the caller tab.
 * Uses a temporary anchor with target="_blank" and rel="noopener noreferrer",
 * ensuring cross-browser mobile (iOS/Android) and desktop stability.
 * @param {string} url
 */
export function openWhatsAppUrl(url) {
  if (!url) return;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
      } catch (_) {}
    }, 200);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
