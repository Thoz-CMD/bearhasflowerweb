'use client';
import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Thai } from 'flatpickr/dist/l10n/th';

interface DateTimePickerProps {
  id?: string;
  placeholder?: string;
  value?: string;
  minDate?: string | Date;
  minTime?: string;
  minDateTime?: string;
  onChange?: (dateStr: string, timeStr: string) => void;
  style?: React.CSSProperties;
}

/**
 * React wrapper component for Flatpickr date/time picker
 * ใช้ npm flatpickr แทน CDN script injection
 * รวม Rose Gold theme CSS ไว้ภายใน
 */
export default function DateTimePicker({
  id = 'ipt-date',
  placeholder = 'เลือกวันที่และเวลา',
  value,
  minDate,
  minTime,
  minDateTime,
  onChange,
  style,
}: DateTimePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Helper: show/hide overlay
  const showOverlay = () => {
    if (!overlayRef.current) {
      const overlay = document.createElement('div');
      overlay.id = 'fp-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(3px);
        z-index: 9998;
        animation: fpFadeIn 0.2s ease-out;
      `;
      overlay.addEventListener('click', () => {
        fpRef.current?.close();
      });
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    }
  };

  const hideOverlay = () => {
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
  };

  useEffect(() => {
    if (!inputRef.current) return;

    const computedMinDate = minDate || getTomorrowStr();
    const tomorrowStr = getTomorrowStr();

    // Calculate minDateTime if provided
    let minDateTimeObj: Date | undefined;
    if (minDateTime) {
      minDateTimeObj = new Date(minDateTime);
    }

    fpRef.current = flatpickr(inputRef.current, {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      minDate: minDateTimeObj || computedMinDate,
      minTime: minTime || '00:00',
      time_24hr: true,
      locale: Thai,
      defaultHour: 9,
      defaultMinute: 0,
      disableMobile: true,
      defaultDate: value || undefined,
      onOpen() {
        showOverlay();
      },
      onClose() {
        hideOverlay();
      },
      onChange(selectedDates, _dateStr, instance) {
        if (selectedDates.length > 0) {
          const d = selectedDates[0];
          const dStr =
            d.getFullYear() +
            '-' +
            String(d.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(d.getDate()).padStart(2, '0');

          // If minDateTime is set, use it for minTime calculation
          if (minDateTimeObj) {
            const minDStr =
              minDateTimeObj.getFullYear() +
              '-' +
              String(minDateTimeObj.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(minDateTimeObj.getDate()).padStart(2, '0');
            const minTStr =
              String(minDateTimeObj.getHours()).padStart(2, '0') +
              ':' +
              String(minDateTimeObj.getMinutes()).padStart(2, '0');

            if (dStr === minDStr) {
              instance.set('minTime', minTStr);
              if (d.getHours() < minDateTimeObj.getHours() || 
                  (d.getHours() === minDateTimeObj.getHours() && d.getMinutes() < minDateTimeObj.getMinutes())) {
                d.setHours(minDateTimeObj.getHours(), minDateTimeObj.getMinutes(), 0, 0);
                instance.setDate(d, false);
              }
            } else if (dStr > minDStr) {
              instance.set('minTime', '00:00');
            }
          } else if (dStr === tomorrowStr) {
            instance.set('minTime', '09:00');
            if (d.getHours() < 9) {
              d.setHours(9, 0, 0, 0);
              instance.setDate(d, false);
            }
          } else {
            instance.set('minTime', '00:00');
          }

          const currentD = instance.selectedDates[0] || d;
          const currentDStr =
            currentD.getFullYear() +
            '-' +
            String(currentD.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(currentD.getDate()).padStart(2, '0');
          const tStr =
            String(currentD.getHours()).padStart(2, '0') +
            ':' +
            String(currentD.getMinutes()).padStart(2, '0');

          onChange?.(currentDStr, tStr);
        }
      },
    });

    return () => {
      hideOverlay();
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, minTime, minDateTime]);

  return (
    <>
      <FlatpickrThemeStyles />
      <input
        ref={inputRef}
        type="text"
        id={id}
        placeholder={placeholder}
        readOnly
        style={{
          fontSize: '16px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          ...style,
        }}
      />
    </>
  );
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parse delivery badge and calculate minimum delivery datetime
 * @param badge - Delivery badge string (e.g., "ส่งใน 1 ชั่วโมง", "ส่งใน 1 วัน")
 * @returns ISO string of minimum delivery datetime
 */
export function getMinDateTimeFromBadge(badge: string): string {
  const now = new Date();
  
  // Parse hours
  const hourMatch = badge.match(/(\d+)\s*ชั่วโมง/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  }
  
  // Parse days
  const dayMatch = badge.match(/(\d+)\s*วัน/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }
  
  // Default to tomorrow if no match
  now.setDate(now.getDate() + 1);
  return now.toISOString();
}

/**
 * Extract delivery time text from badge for display
 * @param badge - Delivery badge string (e.g., "ส่งใน 1 ชั่วโมง", "ส่งใน 1 วัน")
 * @returns Formatted time text (e.g., "1 ชั่วโมง", "1 วัน")
 */
export function getDeliveryTimeText(badge: string): string {
  const hourMatch = badge.match(/(\d+)\s*ชั่วโมง/);
  if (hourMatch) {
    return `${hourMatch[1]} ชั่วโมง`;
  }
  
  const dayMatch = badge.match(/(\d+)\s*วัน/);
  if (dayMatch) {
    return `${dayMatch[1]} วัน`;
  }
  
  return badge;
}

/**
 * Format minimum delivery datetime for display
 * @param minDateTime - ISO string of minimum delivery datetime
 * @returns Formatted datetime string (e.g., "วันที่ 12 เวลา 23:00")
 */
export function formatMinDeliveryDateTime(minDateTime: string): string {
  const date = new Date(minDateTime);
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `วันที่ ${day} เวลา ${hours}:${minutes}`;
}

/**
 * Flatpickr custom theme CSS inline styles
 * Rose Gold / Deep Brown theme matching the app design
 */
function FlatpickrThemeStyles() {
  return (
    <style>{`
      .flatpickr-calendar {
        background: rgba(255, 255, 255, 0.98) !important;
        border: 1px solid var(--glass-border) !important;
        border-radius: 16px !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25) !important;
        font-family: inherit !important;
        padding: 10px !important;
        box-sizing: content-box !important;
        width: 315px !important;
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 9999 !important;
        margin: 0 !important;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease-out, visibility 0.2s ease-out !important;
      }
      .flatpickr-calendar.open {
        opacity: 1 !important;
        visibility: visible !important;
        animation: fpModalFadeIn 0.2s ease-out !important;
      }
      .flatpickr-days {
        width: 315px !important;
      }
      .dayContainer {
        width: 315px !important;
        min-width: 315px !important;
        max-width: 315px !important;
      }
      .flatpickr-day {
        max-width: 45px !important;
      }
      .flatpickr-day.selected,
      .flatpickr-day.selected:hover,
      .flatpickr-day.selected:focus {
        background: var(--rose-gold) !important;
        border-color: var(--rose-gold) !important;
        color: white !important;
        font-weight: bold;
      }
      .flatpickr-day:hover {
        background: var(--soft-peach) !important;
        color: var(--deep-brown) !important;
      }
      .flatpickr-months .flatpickr-month {
        color: var(--deep-brown) !important;
        fill: var(--deep-brown) !important;
      }
      .flatpickr-current-month .flatpickr-monthDropdown-months {
        font-weight: bold !important;
        color: var(--deep-brown) !important;
        background: transparent !important;
        border: none !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        cursor: pointer !important;
        padding: 2px 8px !important;
        border-radius: 4px !important;
        transition: background 0.2s !important;
      }
      .flatpickr-current-month .flatpickr-monthDropdown-months:hover {
        background: var(--soft-peach) !important;
      }
      .flatpickr-current-month .numInputWrapper span {
        display: none !important;
      }
      .flatpickr-current-month input.cur-year {
        font-weight: bold !important;
        color: var(--deep-brown) !important;
      }
      .flatpickr-weekday {
        color: var(--deep-brown) !important;
        font-weight: 600 !important;
      }
      .flatpickr-time {
        border-top: 1px dashed var(--glass-border) !important;
      }
      .flatpickr-time input:hover,
      .flatpickr-time .flatpickr-am-pm:hover,
      .flatpickr-time input:focus,
      .flatpickr-time .flatpickr-am-pm:focus {
        background: var(--soft-peach) !important;
      }
      @keyframes fpModalFadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -45%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }
      @keyframes fpFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `}</style>
  );
}
