export const STORE_CLOSED_HOURS_LABEL = '01:00-08:59';

export const STORE_CLOSED_MESSAGE =
  `ขออภัยขณะนี้เป็นเวลาปิดการสั่งซื้อผ่านเว็บไซต์ (${STORE_CLOSED_HOURS_LABEL}) ลูกค้าสามารถกลับมาสั่งซื้อผ่านเว็บไซต์ได้ในเวลา 09:00 เป็นต้นไปนะคะ`;

export const STORE_CLOSED_TOAST = 'ขณะนี้อยู่ในช่วงเวลาปิดการสั่งซื้อผ่านเว็บไซต์ (01:00-08:59) กรุณากลับมาสั่งซื้ออีกครั้งหลัง 09:00 น.';

export type SystemClosureSettings = {
  isSystemClosed?: boolean;
  closureStartDate?: string; // "YYYY-MM-DD"
  closureStartTime?: string; // "HH:mm"
  closureEndDate?: string;   // "YYYY-MM-DD"
  closureEndTime?: string;   // "HH:mm"
  closureMessage?: string;
  updatedAt?: any;
  updatedBy?: string;
};

function getBangkokHour(date: Date): number {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date).find((part) => part.type === 'hour');

  return Number(hourPart?.value ?? 0);
}

/** Returns true between 01:00 and 08:59 (Asia/Bangkok). */
export function isDailyStoreClosed(date: Date = new Date()): boolean {
  const hour = getBangkokHour(date);
  return hour >= 1 && hour < 9;
}

/** Checks if custom system closure from admin settings is currently active. */
export function isSystemClosureActive(
  settings?: SystemClosureSettings | null,
  date: Date = new Date()
): boolean {
  if (!settings || settings.isSystemClosed !== true) return false;

  const { closureStartDate, closureStartTime, closureEndDate, closureEndTime } = settings;

  // If enabled without specific date range, closure is active immediately
  if (!closureStartDate && !closureEndDate) {
    return true;
  }

  const nowMs = date.getTime();
  let startMs = -Infinity;
  let endMs = Infinity;

  if (closureStartDate) {
    const timeStr = closureStartTime ? closureStartTime.trim() : '00:00';
    const isoStart = `${closureStartDate}T${timeStr}:00+07:00`;
    const startObj = new Date(isoStart);
    if (!isNaN(startObj.getTime())) {
      startMs = startObj.getTime();
    }
  }

  if (closureEndDate) {
    const timeStr = closureEndTime ? closureEndTime.trim() : '23:59';
    const isoEnd = `${closureEndDate}T${timeStr}:59+07:00`;
    const endObj = new Date(isoEnd);
    if (!isNaN(endObj.getTime())) {
      endMs = endObj.getTime();
    }
  }

  return nowMs >= startMs && nowMs <= endMs;
}

/** Combined check for daily hours and custom system closure. */
export function isStoreClosed(
  settings?: SystemClosureSettings | null,
  date: Date = new Date()
): boolean {
  return isDailyStoreClosed(date) || isSystemClosureActive(settings, date);
}

export function getStoreClosedInfo(
  settings?: SystemClosureSettings | null,
  date: Date = new Date()
) {
  const isDailyClosed = isDailyStoreClosed(date);
  const isManualClosed = isSystemClosureActive(settings, date);
  const isClosed = isDailyClosed || isManualClosed;

  let message = STORE_CLOSED_MESSAGE;
  let toast = STORE_CLOSED_TOAST;

  if (isManualClosed) {
    if (settings?.closureMessage && settings.closureMessage.trim()) {
      message = settings.closureMessage.trim();
      toast = settings.closureMessage.trim();
    } else {
      let timeDesc = '';
      if (settings?.closureStartDate && settings?.closureEndDate) {
        timeDesc = ` (ตั้งแต่ ${settings.closureStartDate} ${settings.closureStartTime || ''} ถึง ${settings.closureEndDate} ${settings.closureEndTime || ''})`;
      } else if (settings?.closureEndDate) {
        timeDesc = ` (ถึง ${settings.closureEndDate} ${settings.closureEndTime || ''})`;
      }
      message = `ขออภัยขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว${timeDesc} กรุณากลับมาสั่งซื้อใหม่ในภายหลังนะคะ`;
      toast = `ขณะนี้ระบบปิดรับคำสั่งซื้อชั่วคราว${timeDesc}`;
    }
  }

  return {
    isClosed,
    isDailyClosed,
    isManualClosed,
    message,
    toast,
  };
}
