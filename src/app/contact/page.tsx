'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      
      // Auto reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  return (
    <>
      <nav className="navbar" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        <button className="back-btn-circle" onClick={() => window.history.length > 1 ? router.back() : router.push('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <a href="/" className="nav-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Contact Us</a>
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
                <p>123 หมู่ 6 ต.กำแพงแสน อ.กำแพงแสน<br />จ.นครปฐม 73140</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon-box">📞</div>
              <div className="contact-text">
                <h3>Phone</h3>
                <p>062-XXX-XXXX<br />(จันทร์ - อาทิตย์: 09:00 - 20:00)</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon-box">✉️</div>
              <div className="contact-text">
                <h3>Email & Line</h3>
                <p>hello@bearhasflower.com<br />Line: @bearhasflower</p>
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

          {/* Contact Form */}
          <div className="contact-form-card">
            <h2>ส่งข้อความถึงเรา</h2>
            <p>กรอกข้อมูลด้านล่างเพื่อให้เราติดต่อกลับโดยเร็วที่สุด</p>
            
            {status === 'success' ? (
              <div style={{ 
                background: 'rgba(76, 175, 80, 0.1)', 
                color: '#2e7d32', 
                padding: '30px', 
                borderRadius: '20px', 
                textAlign: 'center',
                animation: 'fadeUp 0.5s ease both'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✨</div>
                <h3 style={{ marginBottom: '10px' }}>ส่งข้อความสำเร็จ!</h3>
                <p style={{ margin: 0, color: '#2e7d32' }}>ขอบคุณที่ติดต่อเรา ทีมงานจะรีบติดต่อกลับโดยเร็วที่สุดครับ</p>
                <button 
                  onClick={() => setStatus('idle')}
                  style={{ marginTop: '20px', background: 'transparent', border: '1px solid #2e7d32', color: '#2e7d32', padding: '8px 20px', borderRadius: '50px', cursor: 'pointer' }}
                >
                  ส่งข้อความใหม่
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <div className="contact-input-wrap">
                    <input 
                      type="text" 
                      id="name" 
                      className="contact-input" 
                      placeholder="ชื่อของคุณ" 
                      required 
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="contact-input-wrap">
                    <input 
                      type="email" 
                      id="email" 
                      className="contact-input" 
                      placeholder="อีเมล" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="contact-input-wrap">
                    <input 
                      type="tel" 
                      id="phone" 
                      className="contact-input" 
                      placeholder="เบอร์โทรศัพท์" 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <div className="contact-input-wrap">
                    <input 
                      type="text" 
                      id="subject" 
                      className="contact-input" 
                      placeholder="หัวข้อเรื่อง" 
                      value={formData.subject}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="form-group full">
                  <div className="contact-input-wrap">
                    <textarea 
                      id="message" 
                      className="contact-input contact-textarea" 
                      placeholder="ข้อความของคุณ..." 
                      required
                      value={formData.message}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
                <div className="form-group full">
                  <button 
                    type="submit" 
                    className="contact-submit-btn" 
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'กำลังส่งข้อมูล...' : 'ส่งข้อความตอนนี้'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="map-container">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15488.756285408544!2d99.98000000000002!3d14.020000000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e2f90000000001%3A0x0!2zMTTCsDAxJzEyLjAiTiA5OcKwNTgnNDguMCJF!5e0!3m2!1sth!2sth!4v1715800000000!5m2!1sth!2sth" 
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
