'use client';

import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { checkIsAdmin } from '@/lib/admin';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inAppWarning, setInAppWarning] = useState(false);

  useEffect(() => {
    // Check for In-App Browser (Facebook/LINE)
    const checkInAppBrowser = () => {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (ua && ((ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Line") > -1))) {
        setInAppWarning(true);
      }
    };
    checkInAppBrowser();

    // Check if already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !sessionStorage.getItem('signing_in')) {
        window.location.href = '/';
      }
    });



    return () => unsubscribe();
  }, []);



  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    sessionStorage.setItem('signing_in', 'true');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      // Check if user's email is in admin whitelist
      const isAdmin = await checkIsAdmin(user.uid, null, user.email);

      // Ensure a user document exists in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        role: isAdmin ? 'admin' : 'user',
        provider: 'google',
        createdAt: new Date().toISOString()
      }, { merge: true });

      if (additionalInfo?.isNewUser) {
        sessionStorage.setItem('show_welcome_popup', 'true');
      }

      sessionStorage.removeItem('signing_in');
      // Redirect to home after successful sign-in
      window.location.href = '/';
    } catch (err: any) {
      console.error('Google sign-in error', err);
      setError('การล็อกอินด้วย Google ล้มเหลว โปรดลองอีกครั้ง');
      sessionStorage.removeItem('signing_in');
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
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .logo-image {
          width: 300px;
          height: 300px;
          margin-bottom: 15px;
          object-fit: contain;
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



        .btn-google {
          width: 100%;
          padding: 16px;
          background: #fff;
          color: #333;
          border: 1.5px solid #db8a9e;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          margin-top: 30px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 4px 10px rgba(219, 138, 158, 0.1);
        }

        .btn-google:hover {
          background: #fdf5f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(219, 138, 158, 0.2);
        }

        .btn-google:disabled {
          background: #e0bec6;
          cursor: not-allowed;
          transform: none;
          color: #999;
        }

        .btn-google svg { width: 20px; height: 20px; }

        .error-msg {
          color: #e53935;
          font-size: 0.8rem;
          margin-top: 15px;
          padding: 10px;
          background: #fff5f5;
          border-radius: 10px;
        }

        .inapp-warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
          padding: 15px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          line-height: 1.5;
          text-align: left;
        }

        .info-text {
          font-size: 0.75rem;
          color: #a08a8e;
          margin-top: 20px;
          line-height: 1.5;
        }

        .btn-back-home {
          width: 100%;
          padding: 16px;
          background: #fdf5f6;
          color: #db8a9e;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          margin-top: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-back-home:hover {
          background: #fcecef;
          color: #c76f84;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(219, 138, 158, 0.15);
        }

        .btn-back-home svg {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .btn-back-home:hover svg {
          transform: translateX(-4px);
        }
      `}</style>

      <div className="login-card">
        <div className="logo-area">
          <div className="logo-text">"Bear has flower"</div>
          <div className="welcome-text">เข้าสู่ระบบ</div>
          <img src="/images/โลโก้หน้าล็อกอิน.png" alt="Bear has flower" className="logo-image" />
        </div>

        {inAppWarning && (
          <div className="inapp-warning">
            หากคุฟหกๆกกดฟกดเ้ใากะรกดเสหาหกดรำไสหกณเปิดผ่านแอป Facebook/LINE แล้วไม่สามารถล็อกอินได้ โปรดกดที่เมนู แถบมุมหน้าจอ เพื่อเลือก <b>'เปิดในเบราว์เซอร์ (Open in Browser)'</b> หรือคัดลอกลิงก์ไปเปิดใน Safari/Chrome
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <button type="button" className="btn-google" onClick={handleGoogleSignIn} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? 'กำลังประมวลผล...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        <button type="button" className="btn-back-home" onClick={() => window.location.href = '/'}>
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
