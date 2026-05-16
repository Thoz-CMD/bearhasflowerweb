'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // login, signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = '/';
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Technique: Convert phone to fake email
    const fakeEmail = `${phoneNumber.trim()}@bearhasflower.local`;

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        // Optionally save phone number as display name
        await updateProfile(userCredential.user, { displayName: phoneNumber });
        alert('สมัครสมาชิกสำเร็จ!');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('เบอร์โทรศัพท์นี้ถูกใช้งานไปแล้ว');
      } else if (err.code === 'auth/weak-password') {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else {
        setError('เกิดข้อผิดพลาด โปรดลองอีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #fffafb 0%, #fdf5f6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .login-card {
          background: #fff;
          width: 100%;
          max-width: 400px;
          padding: 40px 30px;
          border-radius: 32px;
          box-shadow: 0 20px 40px rgba(219, 138, 158, 0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-area {
          margin-bottom: 30px;
        }

        .logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-style: italic;
          color: #db8a9e;
          margin-bottom: 8px;
        }

        .welcome-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #5c4738;
        }

        .mode-toggle {
          display: flex;
          background: #fdf5f6;
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 30px;
        }

        .mode-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 10px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #a08a8e;
          cursor: pointer;
          transition: all 0.3s;
        }

        .mode-btn.active {
          background: #db8a9e;
          color: #fff;
          box-shadow: 0 4px 10px rgba(219, 138, 158, 0.2);
        }

        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #a08a8e;
          margin-bottom: 8px;
          margin-left: 5px;
        }

        .input-field {
          width: 100%;
          padding: 14px 20px;
          border: 1.5px solid #fdf5f6;
          background: #fdfafb;
          border-radius: 16px;
          font-size: 1rem;
          color: #5c4738;
          transition: all 0.3s;
          outline: none;
        }

        .input-field:focus {
          border-color: #db8a9e;
          background: #fff;
        }

        .btn-primary {
          width: 100%;
          padding: 16px;
          background: #db8a9e;
          color: #fff;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          margin-top: 15px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(219, 138, 158, 0.25);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 25px rgba(219, 138, 158, 0.35);
        }

        .btn-primary:disabled {
          background: #e0bec6;
          cursor: not-allowed;
          transform: none;
        }

        .error-msg {
          color: #e53935;
          font-size: 0.8rem;
          margin-top: 15px;
          padding: 10px;
          background: #fff5f5;
          border-radius: 10px;
        }

        .info-text {
          font-size: 0.75rem;
          color: #a08a8e;
          margin-top: 20px;
          line-height: 1.5;
        }
      `}</style>

      <div className="login-card">
        <div className="logo-area">
          <div className="logo-text">"Bear has flower"</div>
          <div className="welcome-text">
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
          </div>
        </div>

        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            เข้าสู่ระบบ
          </button>
          <button 
            className={`mode-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            สมัครสมาชิก
          </button>
        </div>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label className="label">เบอร์โทรศัพท์</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="08X-XXX-XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">รหัสผ่าน</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {error && <div className="error-msg">{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'กำลังประมวลผล...' : (mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก')}
          </button>
        </form>

        <p className="info-text">
          {mode === 'signup' 
            ? 'การสมัครสมาชิกช่วยให้คุณติดตามสถานะออเดอร์และดูประวัติการสั่งซื้อได้จากทุกที่' 
            : 'หากยังไม่มีบัญชี สามารถสลับไปที่เมนูสมัครสมาชิกได้ด้านบน'}
        </p>
      </div>
    </div>
  );
}
