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

    fpRef.current = flatpickr(inputRef.current, {
      enableTime: true,
      dateFormat: 'Y-m-d H:i',
      minDate: computedMinDate,
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

          if (dStr === tomorrowStr) {
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
  }, [minDate, minTime]);

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
