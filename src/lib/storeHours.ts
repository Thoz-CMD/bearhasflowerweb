export const STORE_CLOSED_HOURS_LABEL = '01:00-08:59';

export const STORE_CLOSED_MESSAGE =
  `ขออภัยขณะนี้เป็นเวลาปิดการสั่งซื้อผ่านเว็บไซต์ (${STORE_CLOSED_HOURS_LABEL}) ลูกค้าสามารถกลับมาสั่งซื้อผ่านเว็บไซต์ได้ในเวลา 09:00 เป็นต้นไปนะคะ`;

export const STORE_CLOSED_TOAST = 'ขณะนี้อยู่ในช่วงเวลาปิดการสั่งซื้อผ่านเว็บไซต์ (01:00-08:59) กรุณากลับมาสั่งซื้ออีกครั้งหลัง 09:00 น.';

function getBangkokHour(date: Date): number {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date).find((part) => part.type === 'hour');

  return Number(hourPart?.value ?? 0);
}

/** Returns true between 01:00 and 08:59 (Asia/Bangkok). */
export function isStoreClosed(date: Date = new Date()): boolean {
  const hour = getBangkokHour(date);
  return hour >= 1 && hour < 9;
}
