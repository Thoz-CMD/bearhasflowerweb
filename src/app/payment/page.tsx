'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';

// บัญชี PromptPay ของร้านค้า
const PROMPTPAY_ID = '0656144703';

export default function PaymentPage() {
  const [order, setOrder] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [payload, setPayload] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const fetchOrder = async () => {
        try {
          const docRef = doc(db, 'orders', orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setOrder({ id: docSnap.id, ...data });
            
            const calcTotal = data.total || 0;
            const calcDeposit = data.depositPaid || 0;
            const remaining = calcTotal - calcDeposit;
            
            setTotal(calcTotal);
            setDeposit(calcDeposit);
            setRemainingAmount(remaining);
            
            if (remaining > 0) {
              const qrPayload = generatePayload(PROMPTPAY_ID, { amount: remaining });
              setPayload(qrPayload);
            }
          }
        } catch (e) {
          console.error("Error fetching order:", e);
        }
      };
      fetchOrder();
    }
  }, []);

  const handleConfirmPayment = async () => {
    if (!order || isProcessing || remainingAmount <= 0) return;
    setIsProcessing(true);

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { status: 'pending_final_verification' });

      // Trigger LINE Notify
      try {
        await fetch('/api/line-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderData: order, paymentType: 'final' })
        });
      } catch (err) {
        console.error("Failed to notify LINE:", err);
      }

      setShowSuccessPopup(true);
    } catch (e) {
      console.error("Error updating order:", e);
      setShowSuccessPopup(true);
    }
    setIsProcessing(false);
  };

  if (!isClient) return null;

  return (
    <div className="payment-page">
      <style>{`
        .payment-page {
          min-height: 100vh;
          background: #fffafb;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
          padding-bottom: 40px;
        }

        .payment-nav {
          background: #fff;
          height: 64px;
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1280px;
        }

        @media (min-width: 1024px) {
          .payment-nav {
            padding: 0 40px;
          }
        }

        .back-btn-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: #fdf5f6;
          color: #db8a9e;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .back-btn-circle:active { transform: scale(0.92); }

        .nav-logo {
          font-family: 'Italiana', 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: #db8a9e;
          text-decoration: none;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .content-wrap {
          max-width: 600px;
          margin: 0 auto;
          padding: 24px 20px;
          animation: fadeUp 0.5s ease-out;
        }

        .page-title {
          text-align: center;
          margin-bottom: 24px;
        }
        .page-title h1 {
          font-size: 1.6rem;
          color: #db8a9e;
          margin-bottom: 8px;
        }
        .page-title p {
          font-size: 0.9rem;
          color: #a08a8e;
          line-height: 1.5;
        }

        .payment-card {
          background: #fff;
          border-radius: 24px;
          padding: 30px 20px;
          box-shadow: 0 10px 30px rgba(219, 138, 158, 0.08);
          border: 1px solid rgba(219, 138, 158, 0.1);
          text-align: center;
          margin-bottom: 24px;
        }

        .qr-container {
          background: #fff;
          padding: 16px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          display: inline-block;
          margin: 20px 0;
          border: 2px solid #fdf5f6;
        }

        .amount-display {
          margin: 15px 0;
        }
        .amount-label {
          font-size: 0.9rem;
          color: #a08a8e;
          margin-bottom: 4px;
        }
        .amount-value {
          font-size: 2.2rem;
          font-weight: 800;
          color: #db8a9e;
          font-family: 'Prompt', sans-serif;
        }

        .info-box {
          background: #fdf5f6;
          border-radius: 16px;
          padding: 16px;
          text-align: left;
          margin-top: 20px;
        }
        .info-box h3 {
          font-size: 0.95rem;
          color: #db8a9e;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .info-box p {
          font-size: 0.85rem;
          color: #5c4738;
          line-height: 1.6;
        }

        .summary-card {
          background: #fff;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid rgba(219, 138, 158, 0.1);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 0.95rem;
          border-bottom: 1px dashed #fdf5f6;
        }
        .summary-row:last-child {
          border-bottom: none;
        }
        .row-highlight {
          color: #db8a9e;
          font-weight: 700;
        }

        .confirm-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #db8a9e, #e59db0);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(219, 138, 158, 0.3);
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .confirm-btn:active {
          transform: translateY(2px);
          box-shadow: 0 4px 10px rgba(219, 138, 158, 0.2);
        }
        .confirm-btn:disabled {
          background: #ccc;
          box-shadow: none;
          cursor: not-allowed;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Success Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        .modal-content {
          background: #fff;
          width: 85%; max-width: 360px;
          border-radius: 24px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-icon {
          width: 72px; height: 72px;
          background: #e8f5e9;
          color: #4caf50;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          font-size: 2.2rem;
        }
        .modal-title { font-size: 1.3rem; color: #5c4738; margin-bottom: 8px; font-weight: 700; }
        .modal-desc { font-size: 0.95rem; color: #a08a8e; line-height: 1.5; margin-bottom: 24px; }
        .modal-btn {
          width: 100%; padding: 16px; background: #db8a9e; color: #fff; border: none;
          border-radius: 50px; font-weight: 700; font-size: 1.05rem; cursor: pointer;
          box-shadow: 0 6px 15px rgba(219, 138, 158, 0.25);
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <nav className="payment-nav">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={() => window.history.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="nav-logo">Payment</div>
          <div style={{ width: 40 }}></div>
        </div>
      </nav>

      <div className="content-wrap">
        {!order ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#a08a8e' }}>กำลังโหลดข้อมูล...</div>
        ) : remainingAmount <= 0 ? (
          <div className="payment-card">
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#5c4738', marginBottom: '8px' }}>ชำระเงินครบถ้วนแล้ว</div>
            <div style={{ color: '#a08a8e', marginBottom: '24px' }}>ยอดชำระของออเดอร์นี้ถูกชำระเรียบร้อยแล้ว</div>
            <button className="confirm-btn" onClick={() => window.location.href = '/cart?tab=history'}>กลับไปหน้าประวัติ</button>
          </div>
        ) : (
          <>
            <div className="page-title">
              <h1>ชำระเงินส่วนที่เหลือ</h1>
              <p>สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร<br />ระบบจะระบุจำนวนเงินให้โดยอัตโนมัติ</p>
            </div>

            {order.finishedImageUrl && (
              <div style={{ marginBottom: '24px', textAlign: 'center', animation: 'fadeUp 0.6s ease-out' }}>
                <p style={{ fontSize: '0.9rem', color: '#db8a9e', marginBottom: '8px', fontWeight: 'bold' }}>✨ ดอกไม้ของคุณจัดเสร็จเรียบร้อยแล้วค่ะ ✨</p>
                <img 
                  src={order.finishedImageUrl} 
                  alt="Finished Flower Arrangement" 
                  style={{ width: '100%', maxWidth: '400px', borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', border: '4px solid #fff' }} 
                />
              </div>
            )}

            <div className="payment-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', gap: '4px' }}>
                <span style={{ color: '#113566', fontWeight: 900, fontStyle: 'italic', fontSize: '1.4rem', fontFamily: 'Arial, sans-serif' }}>Prompt</span>
                <span style={{ color: '#f47b20', fontWeight: 900, fontStyle: 'italic', fontSize: '1.4rem', fontFamily: 'Arial, sans-serif' }}>Pay</span>
              </div>

              <div className="qr-container">
                {payload ? (
                  <QRCodeSVG value={payload} size={200} level="M" includeMargin={false} />
                ) : (
                  <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>กำลังโหลด...</div>
                )}
              </div>

              <div className="amount-display">
                <div className="amount-label">ยอดที่ต้องชำระ</div>
                <div className="amount-value">{remainingAmount.toLocaleString()} ฿</div>
              </div>

              <div className="info-box">
                <h3><span style={{ fontSize: '1.2rem' }}>✨</span> เงื่อนไขการชำระเงิน</h3>
                <p>
                  กรุณาชำระเงินส่วนที่เหลือเพื่อให้ทางร้านดำเนินการจัดส่งให้ถึงมือคุณ
                  หลังจากโอนเงินเสร็จสิ้น แอดมินจะทำการตรวจสอบยอดเงินและจัดส่งสินค้าทันทีค่ะ
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-row">
                <span>ยอดรวมสินค้า</span>
                <span>{total.toLocaleString()} บาท</span>
              </div>
              <div className="summary-row" style={{ color: '#a08a8e' }}>
                <span>มัดจำที่ชำระแล้ว</span>
                <span>- {deposit.toLocaleString()} บาท</span>
              </div>
              <div className="summary-row row-highlight">
                <span>ยอดต้องชำระ</span>
                <span>{remainingAmount.toLocaleString()} บาท</span>
              </div>
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'กำลังดำเนินการ...' : 'ฉันได้สแกนชำระเงินเรียบร้อยแล้ว'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a08a8e', marginTop: '16px' }}>
              หลังจากกดปุ่ม ทางร้านจะตรวจสอบยอดเงินและอัปเดตสถานะให้เร็วที่สุดค่ะ
            </p>
          </>
        )}
      </div>

      {showSuccessPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="modal-title">แจ้งชำระเงินสำเร็จ</h2>
            <p className="modal-desc">
              ระบบได้รับแจ้งการชำระเงินของคุณแล้ว<br />
              เราจะรีบตรวจสอบยอดเงิน<br />
              และดำเนินการจัดส่งให้เร็วที่สุดค่ะ
            </p>
            <button className="modal-btn" onClick={() => window.location.href = '/cart?tab=history'}>
              กลับไปหน้าประวัติการสั่งซื้อ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
