'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { Thai } from 'flatpickr/dist/l10n/th';

interface BasePickerProps {
  id?: string;
  placeholder?: string;
  value?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

interface DatePickerProps extends BasePickerProps {
  minDate?: string | Date;
  minDateTime?: string;
  onChange?: (dateStr: string) => void;
}

interface TimePickerProps extends BasePickerProps {
  selectedDate?: string;
  minTime?: string;
  minDateTime?: string;
  onChange?: (timeStr: string) => void;
}

interface DateTimePickerProps extends BasePickerProps {
  value?: string;
  minDate?: string | Date;
  minTime?: string;
  minDateTime?: string;
  onChange?: (dateStr: string, timeStr: string) => void;
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDatePart(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

function formatTimePart(date: Date): string {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}

export function getMinDeliveryTime(
  selectedDate: string,
  minDateTime?: string,
  tomorrowStr: string = getTomorrowStr()
): string {
  if (minDateTime && selectedDate) {
    const minDateTimeObj = new Date(minDateTime);
    if (selectedDate === formatDatePart(minDateTimeObj)) {
      return formatTimePart(minDateTimeObj);
    }
  }

  if (selectedDate === tomorrowStr) {
    return '09:00';
  }

  return '00:00';
}

function useFlatpickrOverlay() {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const fpRef = useRef<flatpickr.Instance | null>(null);

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

  return { fpRef, showOverlay, hideOverlay };
}

const defaultInputStyle: React.CSSProperties = {
  fontSize: '16px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  width: '100%',
};

export function DatePicker({
  id = 'ipt-date',
  placeholder = 'เลือกวันที่',
  value,
  minDate,
  minDateTime,
  onChange,
  style,
  disabled = false,
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fpRef, showOverlay, hideOverlay } = useFlatpickrOverlay();

  useEffect(() => {
    if (!inputRef.current) return;

    const computedMinDate = minDate || getTomorrowStr();
    const minDateTimeObj = minDateTime ? new Date(minDateTime) : undefined;

    fpRef.current = flatpickr(inputRef.current, {
      enableTime: false,
      dateFormat: 'Y-m-d',
      minDate: minDateTimeObj || computedMinDate,
      locale: Thai,
      disableMobile: true,
      defaultDate: value || undefined,
      onOpen() {
        showOverlay();
      },
      onClose() {
        hideOverlay();
      },
      onChange(selectedDates) {
        if (selectedDates.length > 0) {
          onChange?.(formatDatePart(selectedDates[0]));
        }
      },
    });

    return () => {
      hideOverlay();
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, minDateTime]);

  useEffect(() => {
    if (!fpRef.current) return;
    if (value) {
      fpRef.current.setDate(value, false);
    } else {
      fpRef.current.clear();
    }
  }, [value, fpRef]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.disabled = disabled;
  }, [disabled]);

  return (
    <>
      <FlatpickrThemeStyles />
      <input
        ref={inputRef}
        type="text"
        id={id}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        style={{ ...defaultInputStyle, ...style }}
      />
    </>
  );
}

export function TimePicker({
  id = 'ipt-time',
  placeholder = 'เลือกเวลา',
  value,
  selectedDate,
  minTime,
  minDateTime,
  onChange,
  style,
  disabled = false,
}: TimePickerProps) {
  const tomorrowStr = getTomorrowStr();
  const effectiveMinTime =
    minTime ||
    (selectedDate ? getMinDeliveryTime(selectedDate, minDateTime, tomorrowStr) : '00:00');
  const isDisabled = disabled || !selectedDate;
  const [isOpen, setIsOpen] = useState(false);
  const minParsed = useMemo(() => parseTimeString(effectiveMinTime), [effectiveMinTime]);
  const initialTime = useMemo(() => {
    if (value) {
      const parsed = parseTimeString(value);
      return clampTime(parsed.hour, parsed.minute, minParsed);
    }
    return clampTime(Math.max(minParsed.hour, 9), minParsed.hour === Math.max(minParsed.hour, 9) ? minParsed.minute : 0, minParsed);
  }, [value, minParsed]);
  const [draftHour, setDraftHour] = useState(initialTime.hour);
  const [draftMinute, setDraftMinute] = useState(initialTime.minute);

  useEffect(() => {
    if (value) {
      const parsed = parseTimeString(value);
      const clamped = clampTime(parsed.hour, parsed.minute, minParsed);
      setDraftHour(clamped.hour);
      setDraftMinute(clamped.minute);
    }
  }, [value, minParsed]);

  const hourOptions = useMemo(() => {
    const hours: number[] = [];
    for (let h = minParsed.hour; h <= 23; h += 1) {
      if (getAllowedMinutes(h, minParsed).length > 0) hours.push(h);
    }
    return hours;
  }, [minParsed]);

  const minuteOptions = useMemo(
    () => getAllowedMinutes(draftHour, minParsed),
    [draftHour, minParsed]
  );

  useEffect(() => {
    if (!minuteOptions.includes(draftMinute)) {
      setDraftMinute(minuteOptions[0] ?? 0);
    }
  }, [minuteOptions, draftMinute]);

  const openPicker = () => {
    if (isDisabled) return;
    const base = value ? parseTimeString(value) : initialTime;
    const clamped = clampTime(base.hour, base.minute, minParsed);
    setDraftHour(clamped.hour);
    setDraftMinute(clamped.minute);
    setIsOpen(true);
  };

  const closePicker = () => setIsOpen(false);

  const confirmPicker = () => {
    onChange?.(formatTimeParts(draftHour, draftMinute));
    closePicker();
  };

  const displayValue = useMemo(() => {
    if (!value) return '';
    const parsed = parseTimeString(value);
    return formatTimeParts(parsed.hour, parsed.minute);
  }, [value]);

  return (
    <>
      <ScrollTimePickerStyles />
      <input
        type="text"
        id={id}
        placeholder={selectedDate ? placeholder : 'กรุณาเลือกวันที่ก่อน'}
        readOnly
        disabled={isDisabled}
        value={displayValue}
        onClick={openPicker}
        style={{
          ...defaultInputStyle,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.7 : 1,
          ...style,
        }}
      />

      {isOpen &&
        createPortal(
          <>
            <div className="scroll-time-overlay" onClick={closePicker} />
            <div className="scroll-time-modal" role="dialog" aria-modal="true" aria-label="เลือกเวลา">
              <div className="scroll-time-header">เลือกเวลา</div>
              <div className="scroll-time-wheels">
                <ScrollWheelColumn
                  label="ชั่วโมง"
                  items={hourOptions}
                  value={draftHour}
                  onChange={(hour) => setDraftHour(hour)}
                />
                <span className="scroll-time-separator">:</span>
                <ScrollWheelColumn
                  label="นาที"
                  items={minuteOptions}
                  value={draftMinute}
                  onChange={(minute) => setDraftMinute(minute)}
                  formatItem={(m) => String(m).padStart(2, '0')}
                />
              </div>
              <div className="scroll-time-preview">{formatTimeParts(draftHour, draftMinute)} น.</div>
              <div className="scroll-time-actions">
                <button type="button" className="scroll-time-btn cancel" onClick={closePicker}>
                  ยกเลิก
                </button>
                <button type="button" className="scroll-time-btn confirm" onClick={confirmPicker}>
                  ยืนยัน
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}

const WHEEL_ITEM_HEIGHT = 44;

function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const [hourPart, minutePart] = timeStr.split(':');
  return {
    hour: Number.parseInt(hourPart || '0', 10) || 0,
    minute: Number.parseInt(minutePart || '0', 10) || 0,
  };
}

function formatTimeParts(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50];

function roundToNearestMinute(minute: number) {
  return MINUTE_OPTIONS.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
  );
}

function getAllowedMinutes(hour: number, min: { hour: number; minute: number }) {
  if (hour > min.hour) return MINUTE_OPTIONS;
  if (hour < min.hour) return [];
  return MINUTE_OPTIONS.filter((m) => m >= min.minute);
}

function clampTime(hour: number, minute: number, min: { hour: number; minute: number }) {
  const roundedMinute = roundToNearestMinute(minute);

  for (let h = hour; h <= 23; h += 1) {
    const allowedMinutes = getAllowedMinutes(h, min);
    if (allowedMinutes.length === 0) continue;

    if (h > hour) {
      return { hour: h, minute: allowedMinutes[0] };
    }

    const validMinute = allowedMinutes.find((m) => m >= roundedMinute) ?? allowedMinutes[0];
    if (h > min.hour || validMinute >= min.minute) {
      return { hour: h, minute: validMinute };
    }
  }

  return { hour: min.hour, minute: getAllowedMinutes(min.hour, min)[0] ?? 0 };
}

interface ScrollWheelColumnProps {
  label: string;
  items: number[];
  value: number;
  onChange: (value: number) => void;
  formatItem?: (value: number) => string;
}

function ScrollWheelColumn({ label, items, value, onChange, formatItem }: ScrollWheelColumnProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const format = formatItem || ((item: number) => String(item).padStart(2, '0'));

  const scrollToValue = useCallback((targetValue: number, smooth = false) => {
    const list = listRef.current;
    if (!list) return;
    const index = items.indexOf(targetValue);
    if (index < 0) return;

    isProgrammaticScrollRef.current = true;
    list.scrollTo({
      top: index * WHEEL_ITEM_HEIGHT,
      behavior: smooth ? 'smooth' : 'auto',
    });
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, smooth ? 220 : 0);
  }, [items]);

  useEffect(() => {
    scrollToValue(value);
  }, [value, items, scrollToValue]);

  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);

    scrollTimerRef.current = window.setTimeout(() => {
      const list = listRef.current;
      if (!list) return;
      const index = Math.round(list.scrollTop / WHEEL_ITEM_HEIGHT);
      const nextValue = items[Math.min(Math.max(index, 0), items.length - 1)];
      if (nextValue !== undefined && nextValue !== value) {
        onChange(nextValue);
      } else {
        scrollToValue(value, true);
      }
    }, 80);
  };

  const handleItemClick = (item: number) => {
    onChange(item);
    scrollToValue(item, true);
  };

  return (
    <div className="scroll-wheel-column">
      <div className="scroll-wheel-label">{label}</div>
      <div className="scroll-wheel-shell">
        <div className="scroll-wheel-highlight" />
        <div className="scroll-wheel-list" ref={listRef} onScroll={handleScroll}>
          <div className="scroll-wheel-spacer" />
          {items.map((item) => (
            <button
              key={item}
              type="button"
              className={`scroll-wheel-item ${item === value ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              {format(item)}
            </button>
          ))}
          <div className="scroll-wheel-spacer" />
        </div>
      </div>
    </div>
  );
}

function ScrollTimePickerStyles() {
  return (
    <style>{`
      .scroll-time-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(3px);
        z-index: 9998;
        animation: fpFadeIn 0.2s ease-out;
      }
      .scroll-time-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        width: min(92vw, 320px);
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid var(--glass-border);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
        padding: 18px 16px 16px;
        animation: fpModalFadeIn 0.2s ease-out;
      }
      .scroll-time-header {
        text-align: center;
        font-size: 1rem;
        font-weight: 700;
        color: var(--deep-brown);
        margin-bottom: 12px;
      }
      .scroll-time-wheels {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .scroll-time-separator {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--rose-gold);
        padding-top: 24px;
      }
      .scroll-wheel-column {
        flex: 1;
        min-width: 0;
      }
      .scroll-wheel-label {
        text-align: center;
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--mid-brown);
        margin-bottom: 6px;
      }
      .scroll-wheel-shell {
        position: relative;
        height: ${WHEEL_ITEM_HEIGHT * 5}px;
        overflow: hidden;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid var(--glass-border);
      }
      .scroll-wheel-highlight {
        position: absolute;
        top: 50%;
        left: 8px;
        right: 8px;
        height: ${WHEEL_ITEM_HEIGHT}px;
        transform: translateY(-50%);
        border-radius: 10px;
        background: rgba(219, 138, 158, 0.14);
        border: 1px solid rgba(219, 138, 158, 0.35);
        pointer-events: none;
        z-index: 1;
      }
      .scroll-wheel-list {
        position: relative;
        z-index: 2;
        height: 100%;
        overflow-y: auto;
        scroll-snap-type: y mandatory;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .scroll-wheel-list::-webkit-scrollbar {
        display: none;
      }
      .scroll-wheel-spacer {
        height: ${WHEEL_ITEM_HEIGHT * 2}px;
        flex-shrink: 0;
      }
      .scroll-wheel-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: ${WHEEL_ITEM_HEIGHT}px;
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 1.15rem;
        font-weight: 600;
        color: #9a8b82;
        scroll-snap-align: center;
        cursor: pointer;
        transition: color 0.15s ease, transform 0.15s ease;
      }
      .scroll-wheel-item.selected {
        color: var(--deep-brown);
        transform: scale(1.06);
      }
      .scroll-time-preview {
        margin-top: 14px;
        text-align: center;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--rose-gold);
      }
      .scroll-time-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 16px;
      }
      .scroll-time-btn {
        border: none;
        border-radius: 999px;
        padding: 12px 14px;
        font-family: inherit;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
      }
      .scroll-time-btn.cancel {
        background: #fff;
        color: var(--mid-brown);
        border: 1px solid var(--glass-border);
      }
      .scroll-time-btn.confirm {
        background: linear-gradient(135deg, var(--rose-gold), #db8a9e);
        color: #fff;
        box-shadow: 0 8px 18px rgba(219, 138, 158, 0.25);
      }
    `}</style>
  );
}

/** @deprecated Use DatePicker + TimePicker instead */
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
  const { fpRef, showOverlay, hideOverlay } = useFlatpickrOverlay();

  useEffect(() => {
    if (!inputRef.current) return;

    const computedMinDate = minDate || getTomorrowStr();
    const tomorrowStr = getTomorrowStr();
    const minDateTimeObj = minDateTime ? new Date(minDateTime) : undefined;

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
          const dStr = formatDatePart(d);

          if (minDateTimeObj) {
            const minDStr = formatDatePart(minDateTimeObj);
            const minTStr = formatTimePart(minDateTimeObj);

            if (dStr === minDStr) {
              instance.set('minTime', minTStr);
              if (
                d.getHours() < minDateTimeObj.getHours() ||
                (d.getHours() === minDateTimeObj.getHours() &&
                  d.getMinutes() < minDateTimeObj.getMinutes())
              ) {
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
          onChange?.(formatDatePart(currentD), formatTimePart(currentD));
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
        style={{ ...defaultInputStyle, ...style }}
      />
    </>
  );
}

export function getMinDateTimeFromBadge(badge: string): string {
  const now = new Date();

  const hourMatch = badge.match(/(\d+)\s*ชั่วโมง/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  }

  const dayMatch = badge.match(/(\d+)\s*วัน/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }

  now.setDate(now.getDate() + 1);
  return now.toISOString();
}

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

export function getDeliveryAdvanceWarningText(
  badge: string,
  options?: { prefix?: string }
): string {
  const deliveryTime = getDeliveryTimeText(badge);
  const prefix = options?.prefix ?? '';
  return `${prefix}สั่งล่วงหน้าอย่างน้อย ${deliveryTime}`;
}

export function roundMinutesToNearestTen(date: Date): Date {
  const rounded = new Date(date);
  const roundedMinutes = Math.round(rounded.getMinutes() / 10) * 10;
  if (roundedMinutes === 60) {
    rounded.setHours(rounded.getHours() + 1);
    rounded.setMinutes(0);
  } else {
    rounded.setMinutes(roundedMinutes);
  }
  rounded.setSeconds(0, 0);
  return rounded;
}

export function formatMinDeliveryDateTime(minDateTime: string): string {
  const date = roundMinutesToNearestTen(new Date(minDateTime));
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `วันที่ ${day} เวลา ${hours}:${minutes}`;
}

export function buildDeliveryHelperText(badge: string, minDateTime?: string): string {
  const deliveryTime = getDeliveryTimeText(badge);
  
  // Check if store is closed (01:00-08:59 Bangkok time)
  const now = new Date();
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now).find((part) => part.type === 'hour');
  const currentHour = Number(hourPart?.value ?? 0);
  const isStoreClosed = currentHour >= 1 && currentHour < 9;

  // During closed hours (01:00-08:59), don't show the delivery helper text
  if (isStoreClosed) {
    return '';
  }

  const base = `เลือกวันที่และเวลาจัดส่งตามต้องการได้เลยค่ะ หากต้องการรับสินค้าเร็วที่สุด ช่อนี้ขอเวลาจัดประมาณ ${deliveryTime} นะคะ`;

  if (!minDateTime) {
    return `${base} สามารถติดตามสถานะการจัดดอกไม้ได้ที่หน้า ประวัติการสั่งซื้อ หรือทักมาสอบถามในไลน์ @145dmmit ได้เลยนะคะ`;
  }

  const date = roundMinutesToNearestTen(new Date(minDateTime));
  const todayStr = formatDatePart(new Date());
  const dateStr = formatDatePart(date);
  const dateLabel = dateStr === todayStr ? 'วันนี้' : `วันที่ ${date.getDate()}`;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${base} ลูกค้าสามารถรับสินค้าได้เร็วที่สุดใน${dateLabel} เวลา ${hours}:${minutes} โดยประมาณ หรืออาจเร็วกว่านั้น สามารถติดตามสถานะการจัดดอกไม้ได้ที่หน้า ประวัติการสั่งซื้อ หรือทักมาสอบถามในไลน์ @145dmmit ได้เลยนะคะ`;
}

function FlatpickrThemeStyles({ timeOnly = false }: { timeOnly?: boolean }) {
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
        width: ${timeOnly ? 'auto' : '315px'} !important;
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
