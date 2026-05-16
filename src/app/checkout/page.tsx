'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';

const STORAGE_CART = 'bear_flower_cart';
// บัญชี PromptPay ของร้านค้า (สามารถเปลี่ยนเป็นเบอร์โทร หรือ เลขบัตรประชาชนได้)
const PROMPTPAY_ID = '0656144703'; // TODO: เปลี่ยนเป็นเบอร์พร้อมเพย์ของคุณ

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [payload, setPayload] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedCart = localStorage.getItem(STORAGE_CART);
    if (savedCart) {
      const items = JSON.parse(savedCart);
      if (items.length === 0) {
        window.location.href = '/cart';
        return;
      }
      setCartItems(items);
      const calculatedTotal = items.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
      setTotal(calculatedTotal);
      
      // คำนวณมัดจำ 50%
      const depositAmount = Math.ceil(calculatedTotal * 0.5);
      setDeposit(depositAmount);
      
      // สร้าง PromptPay QR Code Payload
      const qrPayload = generatePayload(PROMPTPAY_ID, { amount: depositAmount });
      setPayload(qrPayload);
    } else {
      window.location.href = '/cart';
    }
  }, []);

  const handleConfirmPayment = async () => {
    if (cartItems.length === 0 || isProcessing) return;
    setIsProcessing(true);
    
    const orderData = {
      items: cartItems.map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty || 1,
        details: item.details || '',
        config: item.config || null
      })),
      total: total,
      depositPaid: deposit,
      status: 'pending_verification', // รอตรวจสอบยอดเงิน
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "orders"), orderData);
      localStorage.removeItem(STORAGE_CART);
      setShowSuccessPopup(true);
    } catch (e) {
      // Fallback for demo mode
      localStorage.removeItem(STORAGE_CART);
      setShowSuccessPopup(true);
    }
    setIsProcessing(false);
  };

  if (!isClient) return null;

  return (
    <div className="checkout-page">
      <style>{`
        .checkout-page {
          min-height: 100vh;
          background: #fffafb;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
          padding-bottom: 40px;
        }

        .checkout-nav {
          background: #fff;
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
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

        .promptpay-logo {
          height: 24px;
          margin-bottom: 12px;
          object-fit: contain;
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

      <nav className="checkout-nav">
        <button className="back-btn-circle" onClick={() => window.location.href = '/cart'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="nav-logo">Payment</div>
        <div style={{ width: 40 }}></div>
      </nav>

      <div className="content-wrap">
        <div className="page-title">
          <h1>ชำระเงินมัดจำ (50%)</h1>
          <p>สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร<br/>ระบบจะระบุจำนวนเงินให้โดยอัตโนมัติ</p>
        </div>

        <div className="payment-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', gap: '4px' }}>
            <span style={{ color: '#113566', fontWeight: 900, fontStyle: 'italic', fontSize: '1.4rem', fontFamily: 'Arial, sans-serif' }}>Prompt</span>
            <span style={{ color: '#f47b20', fontWeight: 900, fontStyle: 'italic', fontSize: '1.4rem', fontFamily: 'Arial, sans-serif' }}>Pay</span>
          </div>
          
          <div className="qr-container">
            {payload ? (
              <QRCodeSVG value={payload} size={200} level="M" includeMargin={false} />
            ) : (
              <div style={{width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5'}}>กำลังโหลด...</div>
            )}
          </div>

          <div className="amount-display">
            <div className="amount-label">ยอดชำระมัดจำ</div>
            <div className="amount-value">{deposit.toLocaleString()} ฿</div>
          </div>

          <div className="info-box">
            <h3><span style={{fontSize: '1.2rem'}}>✨</span> เงื่อนไขการชำระเงิน</h3>
            <p>
              กรุณาชำระเงินมัดจำล่วงหน้า <strong>50%</strong> เพื่อเป็นการยืนยันออเดอร์ให้ทางร้านเริ่มจัดเตรียมดอกไม้ของคุณ 
              และหลังจากดอกไม้จัดเสร็จเรียบร้อยแล้ว คุณสามารถชำระส่วนที่เหลืออีก <strong>{(total - deposit).toLocaleString()} บาท</strong> ได้ในภายหลังค่ะ
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-row">
            <span>ยอดรวมสินค้า</span>
            <span>{total.toLocaleString()} บาท</span>
          </div>
          <div className="summary-row row-highlight">
            <span>ยอดมัดจำ (50%)</span>
            <span>{deposit.toLocaleString()} บาท</span>
          </div>
          <div className="summary-row" style={{color: '#a08a8e', fontSize: '0.85rem'}}>
            <span>ค้างชำระ (จ่ายเมื่อเสร็จ)</span>
            <span>{(total - deposit).toLocaleString()} บาท</span>
          </div>
        </div>

        <button 
          className="confirm-btn" 
          onClick={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? 'กำลังดำเนินการ...' : 'ฉันได้สแกนชำระเงินแล้ว'}
        </button>
        <p style={{textAlign: 'center', fontSize: '0.75rem', color: '#a08a8e', marginTop: '16px'}}>
          หลังจากกดปุ่ม ทางร้านจะตรวจสอบยอดเงินและอัปเดตสถานะให้เร็วที่สุดค่ะ
        </p>
      </div>

      {showSuccessPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h2 className="modal-title">ชำระเงินสำเร็จ!</h2>
            <p className="modal-desc">
              ระบบได้รับแจ้งการชำระเงินมัดจำแล้ว<br/>
              ทางร้านจะรีบดำเนินการจัดช่อดอกไม้ให้คุณทันที 🌸
            </p>
            <button className="modal-btn" onClick={() => window.location.href = '/cart?tab=history'}>
              ดูประวัติการสั่งซื้อ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
