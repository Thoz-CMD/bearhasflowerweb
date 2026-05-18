'use client';

import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={() => window.history.length > 1 ? router.back() : router.push('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <a href="/" className="nav-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Contact Us</a>
        </div>
      </nav>

      <div className="contact-page-wrap">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontStyle: 'italic', color: 'var(--deep-brown)', fontWeight: 300 }}>Get in Touch</h1>
          <p style={{ color: 'var(--rose-gold)', letterSpacing: '.2em', textTransform: 'uppercase', fontSize: '.8rem', marginTop: '10px' }}>ยินดีให้คำปรึกษาเรื่องดอกไม้สำหรับทุกโอกาสพิเศษ</p>
        </div>

        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info-card">
            <div className="contact-item">
              <div className="contact-icon-box">📍</div>
              <div className="contact-text">
                <h3>Our Studio</h3>
                <p>หอนกนกฮูกโครงการ 8 ตึก A เลขที่ 99/9 หมู่ 12 ต.กำแพงแสน อ.กำแพงแสน<br />จ.นครปฐม 73140</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon-box">📞</div>
              <div className="contact-text">
                <h3>Phone</h3>
                <p>06-2272-0348<br />(จันทร์ - อาทิตย์: 09:00 - 20:00)</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon-box">✉️</div>
              <div className="contact-text">
                <h3>Email & Line</h3>
                <p>bearhasflower@gmail.com<br />Line: @bearhasflower</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon-box">💬</div>
              <div className="contact-text">
                <h3>Open Chat</h3>
                <p>
                  <a
                    href="https://line.me/ti/g2/DWiHGO3pg2QUjM0ikHEFrqB4AddZTnsjTbjmrA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                    style={{ color: 'var(--mid-brown)', textDecoration: 'none' }}
                  >
                    คลิกเพื่อเปิดแชทผ่าน LINE
                  </a>
                </p>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>FOLLOW US</p>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href="#" style={{ color: 'var(--mid-brown)', textDecoration: 'none', fontSize: '.9rem' }}>Instagram</a>
                <a href="#" style={{ color: 'var(--mid-brown)', textDecoration: 'none', fontSize: '.9rem' }}>Facebook</a>
                <a href="#" style={{ color: 'var(--mid-brown)', textDecoration: 'none', fontSize: '.9rem' }}>TikTok</a>
              </div>
            </div>
          </div>

          {/* Contact Form removed */}
        </div>

        {/* Map Placeholder */}
        <div className="map-container">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3870.904499088099!2d99.99504297548734!3d14.023674886397172!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e2f90f026543b1%3A0x4f9f3ab0e3fd73b2!2z4Lir4Lit4LiZ4LiB4Liu4Li54LiB4LmC4LiE4Lij4LiH4LiB4Liy4LijOOC4geC4s-C5geC4nuC4h-C5geC4quC4mQ!5e0!3m2!1sth!2sth!4v1779087512457!5m2!1sth!2sth" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
