'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  const [isSwapped, setIsSwapped] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <button
            className="back-btn-circle"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <a
            href="/"
            className="nav-logo"
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
          >
            About Us
          </a>
        </div>
      </nav>

      <div className="about-page-wrap">
        <div className="about-hero">
          <div className="about-hero-text">
            <p className="about-kicker">ABOUT BEAR HAS FLOWER</p>
            <h1>
              เรื่องราวที่เริ่มจาก
              <span> ความตั้งใจ</span>
            </h1>
            <p className="about-lead">
              เราเชื่อว่าช่อดอกไม้สามารถเก็บความทรงจำที่ดีเอาไว้ได้
              จึงออกแบบทุกช่อด้วยความตั้งใจ เพื่อให้ความรู้สึกของผู้ให้ถูกส่งต่ออย่างอบอุ่นที่สุด
            </p>
            <div className="about-signature">
              <div>
                <p className="about-label">สตูดิโอของเรา</p>
                <p className="about-value">กำแพงแสน, นครปฐม</p>
              </div>
              <div>
                <p className="about-label">สไตล์</p>
                <p className="about-value">Glitter roses · Velvet wire</p>
              </div>
            </div>
          </div>

          <div className="about-hero-photos">
            <div
              className={`photo-card primary${isSwapped ? ' is-secondary' : ''}`}
              onClick={() => setIsSwapped((prev) => !prev)}
              role="button"
              tabIndex={0}
              style={{ cursor: isSwapped ? 'pointer' : 'default' }}
            >
              <img
                src="/images/ภาพ about 1.jpg"
                alt="ภาพ about 1"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="photo-badge">Signature</span>
            </div>
            <div
              className={`photo-card secondary${isSwapped ? ' is-primary' : ''}`}
              onClick={() => setIsSwapped((prev) => !prev)}
              role="button"
              tabIndex={0}
              style={{ cursor: !isSwapped ? 'pointer' : 'default' }}
            >
              <img
                src="/images/ภาพ about 2.jpg"
                alt="ภาพ about 2"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="about-glow glow-1"></div>
            <div className="about-glow glow-2"></div>
          </div>
        </div>

        <div className="about-story">
          <div className="about-story-card">
            <h2>เบื้องหลังงานฝีมือ</h2>
            <p>
              Bear has flower เริ่มต้นจากความชอบในศิลปะการจัดดอกไม้และงานฝีมือแบบละเอียด
              เราคัดสรรวัสดุคุณภาพ เพื่อส่งต่อความตั้งใจผ่านช่อดอกไม้ ไปถึงมือลูกค้าทุกคน
            </p>
            <div className="about-metrics">
              <div>
                <p className="metric-value">100+</p>
                <p className="metric-label">แบบช่อที่เคยสร้าง</p>
              </div>
              <div>
                <p className="metric-value">3 ปี</p>
                <p className="metric-label">ของการพัฒนาสไตล์</p>
              </div>
              <div>
                <p className="metric-value">100%</p>
                <p className="metric-label">งานแฮนด์เมด</p>
              </div>
            </div>
          </div>

          <div className="about-values">
            <div className="value-card">
              <h3>ความตั้งใจ</h3>
              <p>ทุกช่อออกแบบเพื่อสื่อสารความรู้สึกอย่างลึกซึ้งและจริงใจ</p>
            </div>
            <div className="value-card">
              <h3>งานฝีมือ</h3>
              <p>รายละเอียดเล็กๆ น้อยๆ คือเสน่ห์ เราใช้เวลาทุกขั้นตอนอย่างประณีต</p>
            </div>
            <div className="value-card">
              <h3>การดูแล</h3>
              <p>ให้คำปรึกษาและดูแลตั้งแต่การเลือกช่อจนถึงการส่งมอบ</p>
            </div>
            <div className="value-card">
              <h3>ความพิเศษ</h3>
              <p>จัดส่งฟรีภายในพื้นที่กำแพงแสน</p>
            </div>
          </div>
        </div>

        <div className="about-gallery">
          <div className="gallery-text">
            <p className="about-kicker">OUR SERVICES</p>
            <h2>บริการที่เราตั้งใจทำ</h2>
            <ul>
              <li>ช่อดอกกุหลาบกลิตเตอร์</li>
              <li>ดอกไม้ลวดกำมะหยี่</li>
              <li>รับจัดช่อตาม reference</li>
              <li>บริการจัดส่งภายในพื้นที่กำแพงแสน</li>
            </ul>
          </div>
          <div className="gallery-grid">
            <div className="gallery-card">
              <img src="/images/กุหลาบกลิดเตอร์.jpg" alt="ตัวอย่างช่อดอกไม้" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span>Rose Glitter</span>
            </div>
            <div className="gallery-card">
              <img src="/images/ดอกไม้ลวดกำมะหยี่.jpg" alt="ตัวอย่างงานแฮนด์เมด" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span>Velvet Wire</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .about-page-wrap {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px clamp(16px, 4vw, 40px) 120px;
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .about-hero {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          align-items: center;
          background: linear-gradient(135deg, rgba(219, 138, 158, 0.14), rgba(255, 255, 255, 0.9));
          border-radius: 32px;
          padding: clamp(24px, 4vw, 42px);
          border: 1px solid rgba(219, 138, 158, 0.2);
          box-shadow: 0 20px 60px rgba(80, 50, 57, 0.12);
          position: relative;
          overflow: hidden;
        }

        .about-hero-text {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .about-kicker {
          letter-spacing: 0.3em;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--rose-gold);
          font-weight: 600;
        }

        .about-hero-text h1 {
          font-family: 'Cormorant Garamond', 'Noto Sans Thai', serif;
          font-size: clamp(2.4rem, 4.5vw, 4rem);
          font-weight: 400;
          color: var(--deep-brown);
          line-height: 1.1;
        }

        .about-hero-text h1 span {
          display: block;
          font-style: italic;
          color: var(--rose-gold);
        }

        .about-lead {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.8;
        }

        .about-signature {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          padding-top: 8px;
        }

        .about-label {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .about-value {
          font-weight: 600;
          color: var(--deep-brown);
        }

        .about-hero-photos {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 320px;
        }

        .photo-card {
          position: absolute;
          width: min(320px, 70vw);
          aspect-ratio: 4 / 5;
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(80, 50, 57, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: transform 0.5s ease, opacity 0.5s ease, box-shadow 0.5s ease;
          background: transparent;
          padding: 0;
          cursor: pointer;
          appearance: none;
        }

        .photo-card:disabled {
          cursor: default;
          pointer-events: none;
        }

        .photo-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .photo-card.primary {
          transform: rotate(-2deg);
          z-index: 2;
        }

        .photo-card.secondary {
          transform: translate(45%, 1%) rotate(4deg);
          opacity: 0.92;
          width: min(280px, 58vw);
          aspect-ratio: 3 / 4;
          z-index: 1;
        }

        .photo-card.primary.is-secondary {
          transform: translate(45%, 1%) rotate(4deg);
          width: min(280px, 58vw);
          aspect-ratio: 3 / 4;
          z-index: 1;
          opacity: 0.9;
        }

        .photo-card.secondary.is-primary {
          transform: rotate(-2deg);
          width: min(320px, 70vw);
          aspect-ratio: 4 / 5;
          z-index: 2;
          opacity: 1;
          box-shadow: 0 22px 44px rgba(80, 50, 57, 0.24);
        }

        .photo-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(255, 255, 255, 0.9);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--deep-brown);
        }

        .about-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.6;
        }

        .glow-1 {
          background: rgba(219, 138, 158, 0.35);
          top: 0;
          right: 10%;
        }

        .glow-2 {
          background: rgba(255, 203, 174, 0.4);
          bottom: -20px;
          left: 20%;
        }

        .about-story {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .about-story-card {
          background: var(--warm-white);
          border-radius: 28px;
          padding: 32px;
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-md);
        }

        .about-story-card h2 {
          font-family: 'Cormorant Garamond', 'Noto Sans Thai', serif;
          font-size: 2rem;
          font-weight: 400;
          color: var(--deep-brown);
          margin-bottom: 12px;
        }

        .about-story-card p {
          color: var(--text-muted);
          line-height: 1.8;
        }

        .about-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .metric-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--rose-gold);
        }

        .metric-label {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .about-values {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .value-card {
          background: rgba(219, 138, 158, 0.08);
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(219, 138, 158, 0.15);
        }

        .value-card h3 {
          font-size: 1.05rem;
          color: var(--deep-brown);
          margin-bottom: 8px;
        }

        .value-card p {
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 0.9rem;
        }

        .about-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 28px;
          align-items: center;
          background: linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(219, 138, 158, 0.08));
          border-radius: 30px;
          padding: 32px;
          border: 1px solid rgba(219, 138, 158, 0.15);
        }

        .gallery-text h2 {
          font-family: 'Cormorant Garamond', 'Noto Sans Thai', serif;
          font-size: 2rem;
          color: var(--deep-brown);
          margin: 10px 0 16px;
        }

        .gallery-text ul {
          color: var(--text-muted);
          line-height: 1.8;
          padding-left: 18px;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 18px;
        }

        .gallery-card {
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 12px 30px rgba(80, 50, 57, 0.18);
        }

        .gallery-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .gallery-card span {
          position: absolute;
          bottom: 14px;
          left: 14px;
          background: rgba(255, 255, 255, 0.85);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--deep-brown);
        }

        @media (max-width: 1024px) {
          .about-gallery {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .gallery-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .about-hero-photos {
            min-height: 380px !important;
          }
          .photo-card.secondary {
            transform: translate(25%, 15%) rotate(3deg) !important;
          }
          .photo-card.primary.is-secondary {
            transform: translate(25%, 15%) rotate(3deg) !important;
          }
        }

        @media (max-width: 576px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
