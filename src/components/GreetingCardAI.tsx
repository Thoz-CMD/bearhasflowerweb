'use client';

import React, { useState } from 'react';
import { generateAIGreeting } from '@/app/actions';

interface Suggestion {
  style: string;
  text: string;
}

interface GreetingCardAIProps {
  onSelect?: (text: string) => void;
}

const RECIPIENTS = [
  { id: 'แฟน', label: '💑 แฟน / คนรัก' },
  { id: 'คุณแม่', label: '👩 คุณแม่' },
  { id: 'คุณพ่อ', label: '👨 คุณพ่อ' },
  { id: 'เพื่อนสนิท', label: '🤝 เพื่อนสนิท' },
  { id: 'เพื่อนร่วมงาน', label: '💼 เพื่อนร่วมงาน' },
  { id: 'ครูอาจารย์', label: '📚 ครู / อาจารย์' },
  { id: 'ตัวเอง', label: '🪞 ตัวเอง' },
];

const OCCASIONS = [
  { id: 'วันเกิด', label: '🎂 วันเกิด' },
  { id: 'วันครบรอบ', label: '💍 วันครบรอบ' },
  { id: 'วันวาเลนไทน์', label: '💝 วาเลนไทน์' },
  { id: 'วันแม่', label: '🌷 วันแม่' },
  { id: 'วันพ่อ', label: '👔 วันพ่อ' },
  { id: 'สอบผ่าน / เรียนจบ', label: '🎓 สำเร็จการศึกษา' },
  { id: 'ขอโทษ / ง้อ', label: '🙏 ขอโทษ / ง้อ' },
  { id: 'เริ่มงานใหม่', label: '✨ เริ่มงานใหม่' },
  { id: 'แค่อยากให้กำลังใจ', label: '💪 ให้กำลังใจ' },
];

const TONES = [
  { id: 'โรแมนติก', label: '🌹 โรแมนติก', color: '#e91e8c' },
  { id: 'ซึ้งกินใจ', label: '🥹 ซึ้งกินใจ', color: '#9c27b0' },
  { id: 'น่ารักเป็นกันเอง', label: '🐻 น่ารักเป็นกันเอง', color: '#ff9800' },
  { id: 'ขำขัน', label: '😄 ขำขัน', color: '#4caf50' },
  { id: 'เป็นทางการ', label: '🎩 เป็นทางการ', color: '#607d8b' },
];

export default function GreetingCardAI({ onSelect }: GreetingCardAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [recipient, setRecipient] = useState('');
  const [occasion, setOccasion] = useState('');
  const [tone, setTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setRecipient('');
    setOccasion('');
    setTone('');
    setSuggestions([]);
    setSelectedIdx(null);
    setError('');
  };

  const handleGenerate = async () => {
    if (!recipient || !occasion || !tone) return;
    setIsLoading(true);
    setError('');
    setSuggestions([]);

    try {
      // Encode parameters to base64 to avoid ByteString conversion in Next.js
      const encodedRecipient = Buffer.from(recipient, 'utf-8').toString('base64');
      const encodedOccasion = Buffer.from(occasion, 'utf-8').toString('base64');
      const encodedTone = Buffer.from(tone, 'utf-8').toString('base64');
      
      const result = await generateAIGreeting(encodedRecipient, encodedOccasion, encodedTone);
      if (result.error) {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      } else {
        // Decode base64 suggestions
        const decodedSuggestions = result.suggestions.map((s: any) => ({
          style: Buffer.from(s.style, 'base64').toString('utf-8'),
          text: Buffer.from(s.text, 'base64').toString('utf-8'),
        }));
        setSuggestions(decodedSuggestions);
        setStep(4);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
    setIsLoading(false);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    if (onSelect) onSelect(text);
  };

  const stepLabels = ['ผู้รับ', 'โอกาส', 'โทน', 'เลือก'];

  return (
    <>
      <style>{`
        .greeting-trigger-btn {
          width: 100%;
          padding: 14px 20px;
          background: linear-gradient(135deg, #f3e5f5, #fce4ec);
          border: 2px dashed #ce93d8;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.25s ease;
          text-align: left;
          margin-bottom: 16px;
        }
        .greeting-trigger-btn:hover {
          border-color: #ab47bc;
          background: linear-gradient(135deg, #ede7f6, #fce4ec);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(171, 71, 188, 0.15);
        }
        .greeting-trigger-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ce93d8, #f48fb1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(206, 147, 216, 0.4);
        }
        .greeting-trigger-text h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #6a1b9a;
          margin: 0 0 2px;
        }
        .greeting-trigger-text p {
          font-size: 0.78rem;
          color: #9c4dcc;
          margin: 0;
        }
        .greeting-badge {
          margin-left: auto;
          background: linear-gradient(135deg, #ab47bc, #e91e8c);
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .greeting-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(1px);
          z-index: 2000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: greetFadeIn 0.3s ease;
        }
        @keyframes greetFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .greeting-sheet {
          background: #fff;
          border-radius: 28px 28px 0 0;
          width: 100%;
          max-width: 520px;
          padding: 28px 20px 40px;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .sheet-handle {
          width: 40px; height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          margin: 0 auto 20px;
        }

        .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .sheet-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #4a148c;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sheet-close {
          width: 36px; height: 36px;
          border: none;
          background: #f5f5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #757575;
          font-size: 1.1rem;
        }

        /* Step indicator */
        .step-indicator {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 24px;
          padding: 0 4px;
        }
        .step-dot {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .step-dot.done { background: #ab47bc; color: #fff; }
        .step-dot.active { background: #6a1b9a; color: #fff; box-shadow: 0 0 0 4px rgba(106,27,154,0.2); }
        .step-dot.upcoming { background: #f3e5f5; color: #ce93d8; }
        .step-line {
          flex: 1;
          height: 2px;
          background: #f3e5f5;
          transition: background 0.3s;
        }
        .step-line.done { background: #ab47bc; }

        .ai-step-label {
          font-size: 1rem;
          font-weight: 700;
          color: #6a1b9a;
          margin-bottom: 12px;
          display: block;
        }

        /* Chip grid */
        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }
        .chip {
          padding: 8px 14px;
          border-radius: 50px;
          border: 2px solid #e1bee7;
          background: #fff;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: 'Noto Sans Thai', sans-serif;
          transition: all 0.2s;
          color: #5c4738;
        }
        .chip:hover { border-color: #ab47bc; background: #f3e5f5; }
        .chip.selected { border-color: #6a1b9a; background: #6a1b9a; color: #fff; }

        .tone-chip {
          padding: 10px 16px;
          border-radius: 50px;
          border: 2px solid #e1bee7;
          background: #fff;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: 'Noto Sans Thai', sans-serif;
          transition: all 0.2s;
          color: #5c4738;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tone-chip:hover { transform: scale(1.04); }
        .tone-chip.selected { border-width: 2px; color: #fff; }

        /* Navigation */
        .sheet-nav {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .sheet-back-btn {
          flex: 0 0 auto;
          padding: 14px 20px;
          border: 2px solid #e1bee7;
          background: #fff;
          border-radius: 50px;
          font-size: 0.9rem;
          color: #9c4dcc;
          cursor: pointer;
          font-family: 'Noto Sans Thai', sans-serif;
          font-weight: 600;
        }
        .sheet-next-btn {
          flex: 1;
          padding: 14px;
          background: linear-gradient(135deg, #8e24aa, #e91e8c);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Noto Sans Thai', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 6px 16px rgba(142, 36, 170, 0.3);
        }
        .sheet-next-btn:disabled {
          background: #e0e0e0;
          box-shadow: none;
          cursor: not-allowed;
        }
        .sheet-next-btn:not(:disabled):active { transform: scale(0.97); }

        /* Loading */
        .ai-loading {
          text-align: center;
          padding: 40px 20px;
        }
        .ai-loading-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .ai-loading-dots span {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ab47bc, #e91e8c);
          animation: dotBounce 1.4s infinite ease-in-out;
        }
        .ai-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .ai-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .ai-loading-text { font-size: 0.9rem; color: #9c4dcc; font-weight: 600; }

        /* Suggestion cards */
        .suggestion-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .suggestion-card {
          border: 2px solid #e1bee7;
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          background: #fff;
          position: relative;
        }
        .suggestion-card:hover { border-color: #ab47bc; background: #fce4ec10; transform: translateY(-2px); }
        .suggestion-card.selected { border-color: #6a1b9a; background: linear-gradient(135deg, #f3e5f5, #fce4ec20); }
        .suggestion-style-tag {
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          color: #ab47bc;
          background: #f3e5f5;
          padding: 2px 8px;
          border-radius: 20px;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        .suggestion-text {
          font-size: 0.9rem;
          color: #4a148c;
          line-height: 1.7;
          white-space: pre-line;
          font-weight: 500;
        }
        .copy-btn {
          position: absolute;
          top: 12px; right: 12px;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: #f3e5f5;
          color: #9c4dcc;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .copy-btn:hover { background: #9c4dcc; color: #fff; }
        .copy-btn.copied { background: #4caf50; color: #fff; }

        .regen-btn {
          width: 100%;
          padding: 12px;
          background: #fff;
          border: 2px dashed #ce93d8;
          border-radius: 50px;
          color: #9c4dcc;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          font-family: 'Noto Sans Thai', sans-serif;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 12px;
        }
        .regen-btn:hover { background: #f3e5f5; border-color: #ab47bc; }

        .error-msg {
          text-align: center;
          color: #e91e8c;
          font-size: 0.85rem;
          padding: 12px;
          background: #fce4ec;
          border-radius: 12px;
          margin-bottom: 12px;
        }
      `}</style>

      {/* Trigger Button */}
      <button className="greeting-trigger-btn" onClick={() => { setIsOpen(true); reset(); }}>
        <div className="greeting-trigger-icon">✨</div>
        <div className="greeting-trigger-text">
          <h4>ให้ AI ช่วยเขียนการ์ดอวยพร</h4>
          <p>เลือกโทน แล้วให้ AI สร้างข้อความสวยๆ ให้ฟรี!</p>
        </div>
        <span className="greeting-badge">AI ✦</span>
      </button>

      {/* Modal Sheet */}
      {isOpen && (
        <div className="greeting-overlay" onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
          <div className="greeting-sheet">
            <div className="sheet-handle" />

            <div className="sheet-header">
              <div className="sheet-title">
                ✨ AI เขียนการ์ดอวยพร
              </div>
              <button className="sheet-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              {stepLabels.map((label, i) => {
                const idx = i + 1;
                const isDone = step > idx;
                const isActive = step === idx;
                return (
                  <React.Fragment key={idx}>
                    {i > 0 && <div className={`step-line ${isDone ? 'done' : ''}`} />}
                    <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}`}>
                      {isDone ? '✓' : idx}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step 1: Recipient */}
            {step === 1 && (
              <div>
                <div className="ai-step-label">มอบดอกไม้นี้ให้ใคร?</div>
                <div className="chip-grid">
                  {RECIPIENTS.map(r => (
                    <button
                      key={r.id}
                      className={`chip ${recipient === r.id ? 'selected' : ''}`}
                      onClick={() => setRecipient(r.id)}
                    >{r.label}</button>
                  ))}
                </div>
                <div className="sheet-nav">
                  <button
                    className="sheet-next-btn"
                    disabled={!recipient}
                    onClick={() => setStep(2)}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Occasion */}
            {step === 2 && (
              <div>
                <div className="ai-step-label">เหตุการณ์อะไร?</div>
                <div className="chip-grid">
                  {OCCASIONS.map(o => (
                    <button
                      key={o.id}
                      className={`chip ${occasion === o.id ? 'selected' : ''}`}
                      onClick={() => setOccasion(o.id)}
                    >{o.label}</button>
                  ))}
                </div>
                <div className="sheet-nav">
                  <button className="sheet-back-btn" onClick={() => setStep(1)}>ย้อนกลับ</button>
                  <button
                    className="sheet-next-btn"
                    disabled={!occasion}
                    onClick={() => setStep(3)}
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Tone */}
            {step === 3 && (
              <div>
                <div className="ai-step-label">โทนที่ต้องการ?</div>
                <div className="chip-grid">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      className={`tone-chip ${tone === t.id ? 'selected' : ''}`}
                      style={tone === t.id ? { borderColor: t.color, background: t.color } : { borderColor: '#e1bee7' }}
                      onClick={() => setTone(t.id)}
                    >{t.label}</button>
                  ))}
                </div>
                <div className="sheet-nav">
                  <button className="sheet-back-btn" onClick={() => setStep(2)}>ย้อนกลับ</button>
                  <button
                    className="sheet-next-btn"
                    disabled={!tone || isLoading}
                    onClick={handleGenerate}
                  >
                    {isLoading ? (
                      <>
                        <span style={{ fontSize: '1rem' }}>⏳</span> กำลังสร้าง...
                      </>
                    ) : (
                      <>✨ สร้างการ์ดอวยพร</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {step === 3 && isLoading && (
              <div className="ai-loading">
                <div className="ai-loading-dots">
                  <span /><span /><span />
                </div>
                <div className="ai-loading-text">AI กำลังคิดข้อความสวยๆ ให้คุณ...</div>
              </div>
            )}

            {/* Step 4: Results */}
            {step === 4 && !isLoading && (
              <div>
                <div className="ai-step-label">เลือกข้อความที่ชอบ แล้วกดคัดลอก!</div>
                {error && <div className="error-msg">{error}</div>}
                <div className="suggestion-list">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className={`suggestion-card ${selectedIdx === i ? 'selected' : ''}`}
                      onClick={() => setSelectedIdx(i)}
                    >
                      <div className="suggestion-style-tag">✦ {s.style}</div>
                      <div className="suggestion-text">{s.text}</div>
                      <button
                        className={`copy-btn ${copiedIdx === i ? 'copied' : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleCopy(s.text, i); }}
                        title="คัดลอกข้อความ"
                      >
                        {copiedIdx === i ? '✓' : '⎘'}
                      </button>
                    </div>
                  ))}
                </div>
                <button className="regen-btn" onClick={handleGenerate}>
                  สร้างใหม่อีกครั้ง
                </button>
                <button className="regen-btn" style={{ borderStyle: 'solid', borderColor: '#e1bee7' }} onClick={() => setStep(1)}>
                  เริ่มใหม่ตั้งแต่ต้น
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
