'use client';

const LINE_URL = 'https://line.me/R/ti/p/@145dmmit';

export default function DesignBouquetPage() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/';
  };

  return (
    <>
      <style>{`
        .design-page {
          min-height: 100vh;
          background: #fffafb;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
          padding: 0;
        }

        .design-wrap {
          width: min(100%, 1040px);
          margin: 0 auto;
        }

        .design-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .design-card {
          position: relative;
          min-height: 420px;
          overflow: hidden;
          border-radius: 24px;
          background: #fff;
          color: #fff;
          text-decoration: none;
          box-shadow: 0 18px 44px rgba(80, 50, 57, .12);
          isolation: isolate;
          transition: transform .24s ease, box-shadow .24s ease;
        }

        .design-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 56px rgba(80, 50, 57, .18);
        }

        .design-card img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .5s ease;
          z-index: -2;
        }

        .design-card:hover img {
          transform: scale(1.04);
        }

        .design-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(35, 16, 24, .72), rgba(35, 16, 24, .08) 62%);
          z-index: -1;
        }

        .design-card-content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 26px;
        }

        .design-card-title {
          font-size: clamp(1.35rem, 3vw, 2rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 8px;
        }

        .design-card-desc {
          font-size: .92rem;
          line-height: 1.55;
          color: rgba(255, 255, 255, .86);
          margin-bottom: 16px;
        }

        .design-card-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 10px 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, .92);
          color: #9b3f5b;
          font-size: .88rem;
          font-weight: 800;
        }

        @media (max-width: 767px) {
          .design-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .design-card {
            min-height: 300px;
            border-radius: 20px;
          }

          .design-card-content {
            padding: 22px;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <a href="/" className="nav-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            &quot;Bear has flower&quot;
          </a>
        </div>
      </nav>

      <main className="design-page">
        <div className="page-wrap">
          <section className="page-heading">
            <h1>&quot;Design Bouquet&quot;</h1>
            <p className="subtitle">เลือกแบบที่เหมาะกับสิ่งที่คุณอยากมอบให้คนสำคัญ</p>
          </section>

          <section className="design-wrap design-grid" aria-label="ตัวเลือกออกแบบช่อดอกไม้">
          <a className="design-card" href="/glitter_rose">
            <img src="/images/กุหลาบกลิดเตอร์.webp" alt="ช่อดอกไม้กลิตเตอร์" />
            <div className="design-card-content">
              <div className="design-card-title">ออกแบบช่อดอกไม้กลิตเตอร์</div>
              <div className="design-card-desc">เลือกจำนวน สี รองช่อ กระดาษห่อ รูปทรง และของตกแต่งได้ด้วยตัวเอง</div>
              <span className="design-card-action">เริ่มออกแบบ</span>
            </div>
          </a>

          <a className="design-card" href={LINE_URL} target="_blank" rel="noopener noreferrer">
            <img src="/images/Reference.jpg" alt="ออกแบบช่อดอกไม้ตาม Reference" />
            <div className="design-card-content">
              <div className="design-card-title">ออกแบบช่อดอกไม้ตาม Reference</div>
              <div className="design-card-desc">ส่งรูปตัวอย่างให้ร้านช่วยประเมินรูปแบบ ราคา และรายละเอียดก่อนจัดทำ</div>
              <span className="design-card-action">ส่ง Reference ให้ร้าน</span>
            </div>
          </a>
          </section>
        </div>
      </main>
    </>
  );
}
