'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, runTransaction, getDocs, query, where, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import StoreClosedNotice from '@/components/StoreClosedNotice';
import { useStoreHours } from '@/hooks/useStoreHours';
import { STORE_CLOSED_TOAST } from '@/lib/storeHours';

const STORAGE_CART = 'bear_flower_cart';
// บัญชี PromptPay ของร้านค้า (สามารถเปลี่ยนเป็นเบอร์โทร หรือ เลขบัตรประชาชนได้)
const PROMPTPAY_ID = '0656144703'; // TODO: เปลี่ยนเป็นเบอร์พร้อมเพย์ของคุณ

// ── Glitter Rose lookup maps ──
const ROSE_COLORS_MAP: Record<string, string> = {
  red: 'แดง', pink: 'ชมพู', blue: 'น้ำเงิน', white: 'ขาว', sky: 'ฟ้า', purple: 'ม่วง'
};
const ROSE_LAYERS_MAP: Record<string, string> = {
  ramy_white: 'รามี่ขาว', pearl_net_white: 'ตาข่ายมุกขาว', sa_paper_white: 'กระดาษสาขาว',
  ramy_black: 'รามี่ดำ', pearl_net_black: 'ตาข่ายมุกดำ', sa_paper_black: 'กระดาษสาดำ'
};
const ROSE_PAPERS_MAP: Record<string, string> = {
  white_solid: 'ขาวทึบ', white_clear: 'ขาวใส', white_gold: 'ขาวขอบทอง',
  black_solid: 'ดำทึบ', black_gold: 'ดำขอบทอง', pink: 'ชมพู'
};
const ROSE_SHAPES_MAP: Record<string, string> = {
  triangle: 'สามเหลี่ยม', rectangle: 'สี่เหลี่ยม', open_front: 'เปิดหน้า'
};

export default function CheckoutPage() {
  const { isClosed: isStoreClosedNow, toast: storeClosedToast } = useStoreHours();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [paymentOption, setPaymentOption] = useState<'deposit' | 'full'>('deposit');
  const [isClient, setIsClient] = useState(false);
  const [payload, setPayload] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSlipErrorPopup, setShowSlipErrorPopup] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [originalTotal, setOriginalTotal] = useState(0);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
  const [checkingDiscounts, setCheckingDiscounts] = useState(true);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setCheckingDiscounts(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAvailableDiscounts = async () => {
      if (!userId || userId === 'guest') {
        setCheckingDiscounts(false);
        return;
      }
      setCheckingDiscounts(true);
      try {
        const qOrders = query(collection(db, 'orders'), where('userId', '==', userId));
        const orderSnapshot = await getDocs(qOrders);
        const isNewUser = orderSnapshot.empty;

        const qCoupons = query(collection(db, 'coupons'), where('isActive', '==', true));
        const couponSnapshot = await getDocs(qCoupons);

        const list: any[] = [];
        const todayStr = new Date().toISOString().substring(0, 10);

        couponSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.expiryDate && data.expiryDate < todayStr) return;
          if (data.usageLimit && (data.usedCount || 0) >= data.usageLimit) return;
          if (data.isForNewCustomerOnly && !isNewUser) return;

          list.push({
            id: docSnap.id,
            code: data.code,
            discountType: data.discountType || 'percent',
            discountValue: data.discountValue || 0,
            minSpend: data.minSpend || 0,
            description: data.description || '',
            isForNewCustomerOnly: Boolean(data.isForNewCustomerOnly),
            label: data.description || (data.discountType === 'percent' ? `ลด ${data.discountValue}%` : `ลด ${data.discountValue} ฿`)
          });
        });

        setAvailableDiscounts(list);
      } catch (err) {
        console.error('Error fetching discounts:', err);
      }
      setCheckingDiscounts(false);
    };
    fetchAvailableDiscounts();
  }, [userId]);

  useEffect(() => {
    if (!checkingDiscounts && userId && originalTotal > 0 && availableDiscounts.length > 0) {
      const autoApply = localStorage.getItem('auto_apply_discount');
      if (autoApply && appliedDiscountCode !== autoApply && availableDiscounts.some(d => d.code?.toUpperCase() === autoApply.toUpperCase())) {
        handleToggleDiscount(autoApply);
        localStorage.removeItem('auto_apply_discount');
      }
    }
  }, [checkingDiscounts, userId, originalTotal, availableDiscounts, appliedDiscountCode]);

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
      const calculatedTotal = items.reduce((acc: number, item: any) => acc + (item.price * (item.qty || 1)), 0);
      setOriginalTotal(calculatedTotal);
      setTotal(calculatedTotal);

      // คำนวณมัดจำ 50%
      const depositAmount = Math.ceil(calculatedTotal * 0.5);
      setDeposit(depositAmount);

      // สร้าง PromptPay QR Code Payload
      const initialAmount = paymentOption === 'full' ? calculatedTotal : depositAmount;
      const qrPayload = generatePayload(PROMPTPAY_ID, { amount: initialAmount });
      setPayload(qrPayload);
    } else {
      window.location.href = '/cart';
    }
  }, []);

  const handlePaymentOptionChange = (option: 'deposit' | 'full') => {
    setPaymentOption(option);
    const amountToPay = option === 'full' ? total : deposit;
    const qrPayload = generatePayload(PROMPTPAY_ID, { amount: amountToPay });
    setPayload(qrPayload);
  };

  const handleToggleDiscount = async (code: string) => {
    if (isApplyingDiscount) return;

    if (appliedDiscountCode === code) {
      handleRemoveDiscount();
      return;
    }

    setDiscountError('');
    setDiscountSuccess('');
    if (!userId || userId === 'guest') {
      setDiscountError('กรุณาเข้าสู่ระบบเพื่อใช้โค้ดส่วนลด');
      return;
    }

    const coupon = availableDiscounts.find(d => d.code?.toUpperCase() === code.toUpperCase());
    if (!coupon) {
      setDiscountError('ไม่พบคูปองส่วนลดนี้ หรือหมดสิทธิ์การใช้งานแล้ว');
      return;
    }

    if (coupon.minSpend && originalTotal < coupon.minSpend) {
      setDiscountError(`ยอดสั่งซื้อขั้นต่ำสำหรับคูปองนี้คือ ${coupon.minSpend.toLocaleString()} บาท`);
      return;
    }

    setIsApplyingDiscount(true);
    try {
      if (coupon.isForNewCustomerOnly) {
        const q = query(collection(db, 'orders'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setDiscountError('โค้ดนี้สำหรับลูกค้าใหม่ที่สั่งซื้อครั้งแรกเท่านั้น');
          setIsApplyingDiscount(false);
          return;
        }
      }

      let discount = 0;
      if (coupon.discountType === 'percent') {
        discount = Math.floor(originalTotal * (coupon.discountValue / 100));
      } else {
        discount = Math.min(coupon.discountValue, originalTotal);
      }

      const newTotal = Math.max(0, originalTotal - discount);
      const newDeposit = Math.ceil(newTotal * 0.5);

      setDiscountAmount(discount);
      setTotal(newTotal);
      setDeposit(newDeposit);
      setAppliedDiscountCode(coupon.code);
      setAppliedCoupon(coupon);
      setDiscountSuccess(`ใช้คูปองส่วนลด "${coupon.code}" สำเร็จ (ลด ${discount.toLocaleString()} ฿)`);

      const amountToPay = paymentOption === 'full' ? newTotal : newDeposit;
      const qrPayload = generatePayload(PROMPTPAY_ID, { amount: amountToPay });
      setPayload(qrPayload);
    } catch (err) {
      console.error("Error verifying discount:", err);
      setDiscountError('เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด');
    }
    setIsApplyingDiscount(false);
  };

  const handleRemoveDiscount = () => {
    setDiscountAmount(0);
    setTotal(originalTotal);
    const newDeposit = Math.ceil(originalTotal * 0.5);
    setDeposit(newDeposit);
    setAppliedDiscountCode('');
    setAppliedCoupon(null);
    setDiscountCodeInput('');
    setDiscountSuccess('');
    setDiscountError('');
    const amountToPay = paymentOption === 'full' ? originalTotal : newDeposit;
    const qrPayload = generatePayload(PROMPTPAY_ID, { amount: amountToPay });
    setPayload(qrPayload);
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพ (JPEG, PNG) เท่านั้น');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    setSlipFile(file);
    setSlipPreview(URL.createObjectURL(file));
  };

  const uploadSlipToStorage = async (): Promise<string | null> => {
    if (!slipFile) return null;

    setUploadingSlip(true);
    try {
      const base64File = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(slipFile);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      const safeFileName = slipFile.name.replace(/[^\w.-]+/g, '_');
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64File,
          path: `slips/${Date.now()}_${safeFileName}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.url;
    } catch (error) {
      console.error('Error uploading slip:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลดสลิป กรุณาลองใหม่');
      return null;
    } finally {
      setUploadingSlip(false);
    }
  };

  const createOrderAndReserveStock = async (item: any, orderData: any): Promise<string> => {
    const productId = item.presetId || item.config?.presetId;
    const shouldTrackStock = Boolean(item.readyToShip && productId);

    if (!shouldTrackStock) {
      const docRef = await addDoc(collection(db, "orders"), orderData);
      return docRef.id;
    }

    const orderRef = doc(collection(db, "orders"));
    const productRef = doc(db, 'products', productId);
    const requestedQty = item.qty || 1;

    await runTransaction(db, async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      const product = productSnap.data();
      const currentStock = Number(product.stockQuantity || 0);
      if (currentStock < requestedQty) {
        throw new Error('Out of stock');
      }

      const nextStock = currentStock - requestedQty;
      transaction.update(productRef, {
        stockQuantity: nextStock,
        badge: nextStock <= 0 ? 'หมดชั่วคราว' : 'พร้อมส่ง ' + nextStock,
        soldOut: nextStock <= 0,
        updatedAt: serverTimestamp(),
      });
      transaction.set(orderRef, orderData);
    });

    return orderRef.id;
  };

  const handleConfirmPayment = async () => {
    if (cartItems.length === 0 || isProcessing) return;

    if (isStoreClosedNow) {
      window.alert(storeClosedToast || STORE_CLOSED_TOAST);
      return;
    }

    // Require slip upload
    if (!slipFile) {
      setShowSlipErrorPopup(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Upload slip first
      const slipUrl = await uploadSlipToStorage();
      if (!slipUrl) {
        setIsProcessing(false);
        return;
      }

      // Create separate order for each cart item in parallel
      const orderPromises = cartItems.map(async (item) => {
        let itemTotal = item.price * (item.qty || 1);
        const itemOriginalTotal = itemTotal;
        let itemDiscount = 0;

        if (appliedDiscountCode && originalTotal > 0 && discountAmount > 0) {
          // Proportionate discount per item
          itemDiscount = Math.floor((itemOriginalTotal / originalTotal) * discountAmount);
          itemTotal = Math.max(0, itemTotal - itemDiscount);
        }

        const itemDeposit = Math.ceil(itemTotal * 0.5);
        const isFull = paymentOption === 'full';
        const itemPayAmount = isFull ? itemTotal : itemDeposit;

        const orderData = {
          items: [{
            name: item.name,
            price: item.price,
            qty: item.qty || 1,
            details: item.details || '',
            type: item.type || 'regular',
            image: item.coverImage || item.image || item.imageUrl || (item.type === 'glitter_rose' ? '/images/Glitter Rose/ริบบิ้นแดง.jpg' : ''),
            coverImage: item.coverImage || item.image || item.imageUrl || (item.type === 'glitter_rose' ? '/images/Glitter Rose/ริบบิ้นแดง.jpg' : ''),
            config: item.config || null,
            productId: item.presetId || item.config?.presetId || null,
            presetId: item.presetId || item.config?.presetId || null,
            readyToShip: Boolean(item.readyToShip),
            isPreset: item.id && !item.id.startsWith('custom_') // true for Our Products, false for custom products
          }],
          total: itemTotal,
          originalTotal: itemOriginalTotal,
          discountCode: appliedDiscountCode || null,
          discountAmount: itemDiscount,
          depositPaid: itemPayAmount,
          paymentType: paymentOption, // 'full' or 'deposit'
          paymentSlipUrl: slipUrl,
          status: 'pending_verification', // รอตรวจสอบยอดเงิน
          createdAt: serverTimestamp(),
          userId: userId || 'guest',
        };

        const newOrderId = await createOrderAndReserveStock(item, orderData);
        return { orderData, orderId: newOrderId };
      });

      const orderResults = await Promise.all(orderPromises);

      // If applied coupon is from Firestore, increment its usedCount
      if (appliedCoupon?.id) {
        try {
          await updateDoc(doc(db, 'coupons', appliedCoupon.id), {
            usedCount: increment(1)
          });
        } catch (couponErr) {
          console.error("Failed to increment coupon usedCount:", couponErr);
        }
      }

      // Trigger LINE Notify for all orders in parallel (fire and forget)
      orderResults.forEach(({ orderData, orderId }) => {
        fetch('/api/line-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderData: { ...orderData, id: orderId },
            paymentType: paymentOption
          })
        }).catch(err => console.error("Failed to notify LINE:", err));
      });

      localStorage.removeItem(STORAGE_CART);
      setShowSuccessPopup(true);
    } catch (e) {
      console.error("Checkout failed:", e);
      window.alert(e instanceof Error && e.message === 'Out of stock'
        ? 'สินค้าหมดชั่วคราว กรุณานำสินค้าออกจากตะกร้าก่อนทำรายการอีกครั้ง'
        : 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    }
    setIsProcessing(false);
  };

  const currentPayAmount = paymentOption === 'full' ? total : deposit;

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
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        @media (min-width: 1024px) {
          .checkout-nav {
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

        /* Payment Options Selector */
        .payment-options-group {
          margin-bottom: 24px;
        }
        .payment-options-title {
          font-size: 1rem;
          font-weight: 700;
          color: #db8a9e;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .payment-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 520px) {
          .payment-options-grid {
            grid-template-columns: 1fr;
          }
        }
        .payment-option-card {
          background: #fff;
          border: 2px solid #f2e5e8;
          border-radius: 18px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          position: relative;
          box-shadow: 0 2px 8px rgba(219, 138, 158, 0.04);
        }
        .payment-option-card:hover {
          border-color: #e59db0;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(219, 138, 158, 0.12);
        }
        .payment-option-card.selected {
          border-color: #db8a9e;
          background: #fffafb;
          box-shadow: 0 6px 20px rgba(219, 138, 158, 0.18);
        }
        .payment-option-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 0;
        }
        .payment-option-radio {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #db8a9e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          flex-shrink: 0;
          background: #fff;
          transition: all 0.2s ease;
        }
        .payment-option-card.selected .payment-option-radio {
          background: #db8a9e;
        }
        .payment-option-radio-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
        }
        .payment-option-label-wrap {
          flex: 1;
        }
        .payment-option-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: #5c4738;
          margin-bottom: 3px;
        }
        .payment-option-card.selected .payment-option-name {
          color: #db8a9e;
        }
        .payment-option-desc {
          font-size: 0.76rem;
          color: #a08a8e;
          line-height: 1.35;
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

        .discount-section {
          margin-bottom: 24px;
        }
        .coupon-ticket {
          display: flex;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(219, 138, 158, 0.3);
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .coupon-ticket:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(219, 138, 158, 0.1);
        }
        .coupon-ticket.selected {
          border-color: #db8a9e;
          background: #fffafb;
          box-shadow: 0 4px 15px rgba(219, 138, 158, 0.15);
        }
        .coupon-ticket.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(0.5);
        }
        .coupon-ticket.disabled:hover {
          transform: none;
          box-shadow: none;
        }
        .coupon-left {
          background: #fdf5f6;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 90px;
          border-right: 2px dashed #e0bec6;
          position: relative;
          color: #db8a9e;
        }
        .coupon-left::before, .coupon-left::after {
          content: '';
          position: absolute;
          right: -8px;
          width: 16px;
          height: 16px;
          background: #fffafb;
          border-radius: 50%;
          z-index: 10;
        }
        .coupon-left::before { top: -8px; }
        .coupon-left::after { bottom: -8px; }

        .coupon-icon {
          margin-bottom: 6px;
        }
        .coupon-type {
          font-size: 0.7rem;
          font-weight: 700;
          text-align: center;
          line-height: 1.2;
        }
        .coupon-middle {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .coupon-badge {
          background: #db8a9e;
          color: #fff;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .coupon-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #db8a9e;
          margin-bottom: 2px;
        }
        .coupon-subtitle {
          font-size: 0.8rem;
          color: #5c4738;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .coupon-desc {
          font-size: 0.75rem;
          color: #a08a8e;
        }
        .coupon-right {
          width: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-right: 12px;
        }
        .coupon-checkbox {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #e0bec6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s;
        }
        .coupon-ticket.selected .coupon-checkbox {
          background: #db8a9e;
          border-color: #db8a9e;
          color: #fff;
        }
        .no-coupon-box {
          background: #fff;
          border: 1px dashed #e0bec6;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          color: #a08a8e;
          font-size: 0.9rem;
        }
        .discount-msg {
          font-size: 0.85rem;
          margin-top: 8px;
          text-align: center;
        }
        .discount-msg.error {
          color: #db3a55;
        }
        .discount-msg.success {
          color: #4caf50;
        }

        .slip-upload-section {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid rgba(219, 138, 158, 0.1);
        }
        .slip-upload-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #db8a9e;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .slip-upload-box {
          border: 2px dashed #e0bec6;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }
        .slip-upload-box:hover {
          border-color: #db8a9e;
          background: #fdf5f6;
        }
        .slip-upload-box.has-file {
          border-style: solid;
          border-color: #4caf50;
          background: #f0fdf4;
        }
        .slip-upload-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }
        .slip-upload-text {
          font-size: 0.9rem;
          color: #a08a8e;
          margin-bottom: 4px;
        }
        .slip-upload-subtext {
          font-size: 0.75rem;
          color: #ccc;
        }
        .slip-preview {
          margin-top: 16px;
          border-radius: 12px;
          overflow: hidden;
          max-width: 100%;
        }
        .slip-preview img {
          width: 100%;
          height: auto;
          display: block;
        }
        .slip-remove-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: #db3a55;
          color: #fff;
          border: none;
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 600;
        }
        .slip-remove-btn:hover {
          background: #c9304a;
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
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={() => window.location.href = '/cart'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="nav-logo">Payment</div>
          <div style={{ width: 40 }}></div>
        </div>
      </nav>

      <div className="content-wrap">
        <div className="page-title">
          <h1>{paymentOption === 'full' ? 'ชำระเงินเต็มจำนวน (100%)' : 'ชำระเงินมัดจำ (50%)'}</h1>
          <p>สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร<br />ระบบจะระบุจำนวนเงินให้โดยอัตโนมัติ</p>
          <StoreClosedNotice />
        </div>

        {/* Payment Option Selector */}
        <div className="payment-options-group">
          <div className="payment-options-title">
            เลือกรูปแบบการชำระเงิน
          </div>
          <div className="payment-options-grid">
            <div
              className={`payment-option-card ${paymentOption === 'deposit' ? 'selected' : ''}`}
              onClick={() => handlePaymentOptionChange('deposit')}
            >
              <div className="payment-option-header">
                <div className="payment-option-radio">
                  {paymentOption === 'deposit' && <div className="payment-option-radio-dot" />}
                </div>
                <div className="payment-option-label-wrap">
                  <div className="payment-option-name">ชำระเงินมัดจำ (50%)</div>
                  <div className="payment-option-desc">ชำระมัดจำเพื่อเริ่มจัดดอกไม้ ส่วนที่เหลือจ่ายเมื่อจัดเสร็จ</div>
                </div>
              </div>
            </div>

            <div
              className={`payment-option-card ${paymentOption === 'full' ? 'selected' : ''}`}
              onClick={() => handlePaymentOptionChange('full')}
            >
              <div className="payment-option-header">
                <div className="payment-option-radio">
                  {paymentOption === 'full' && <div className="payment-option-radio-dot" />}
                </div>
                <div className="payment-option-label-wrap">
                  <div className="payment-option-name">ชำระเต็มจำนวน (100%)</div>
                  <div className="payment-option-desc">ชำระครั้งเดียวครบถ้วน ไม่ต้องโอนรอบสอง สะดวก รวดเร็ว</div>
                </div>
              </div>
            </div>
          </div>
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
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>กำลังโหลด...</div>
            )}
          </div>

          <div className="amount-display">
            <div className="amount-label">{paymentOption === 'full' ? 'ยอดชำระเต็มจำนวน' : 'ยอดชำระมัดจำ'}</div>
            <div className="amount-value">{currentPayAmount.toLocaleString()} ฿</div>
          </div>

          <div className="info-box">
            <h3><span style={{ fontSize: '1.2rem' }}>✨</span> เงื่อนไขการชำระเงิน</h3>
            {paymentOption === 'full' ? (
              <p>
                ชำระเงินเต็มจำนวน <strong>100% ({total.toLocaleString()} บาท)</strong> เพื่อยืนยันออเดอร์ให้ทางร้านเริ่มจัดเตรียมดอกไม้ของคุณทันที โดยหลังจากดอกไม้จัดเสร็จและพร้อมจัดส่งจะไม่มีค่าใช้จ่ายเพิ่มเติมค่ะ
              </p>
            ) : (
              <p>
                กรุณาชำระเงินมัดจำล่วงหน้า <strong>50%</strong> เพื่อเป็นการยืนยันออเดอร์ให้ทางร้านเริ่มจัดเตรียมดอกไม้ของคุณ
                และหลังจากดอกไม้จัดเสร็จเรียบร้อยแล้ว คุณสามารถชำระส่วนที่เหลืออีก <strong>{(total - deposit).toLocaleString()} บาท</strong> ได้ในภายหลังค่ะ
              </p>
            )}
          </div>
        </div>

        <div className="discount-section">
          {checkingDiscounts ? (
            <div className="no-coupon-box" style={{ borderStyle: 'solid', borderColor: '#fdf5f6' }}>
              กำลังตรวจสอบคูปอง...
            </div>
          ) : availableDiscounts.length > 0 ? (
            availableDiscounts.map(d => {
              const isApplied = appliedDiscountCode === d.code;
              return (
                <div
                  key={d.code}
                  className={`coupon-ticket ${isApplied ? 'selected' : ''} ${isApplyingDiscount ? 'disabled' : ''}`}
                  onClick={() => handleToggleDiscount(d.code)}
                >
                  <div className="coupon-left">
                    <div className="coupon-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <div className="coupon-type">
                      {d.discountType === 'percent' ? 'ส่วนลด %' : 'ส่วนลดเงินสด'}
                    </div>
                  </div>
                  <div className="coupon-middle">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span className="coupon-badge">{d.code}</span>
                      {d.isForNewCustomerOnly && (
                        <span style={{ fontSize: '0.68rem', color: '#ea678f', background: '#fff', padding: '1px 6px', borderRadius: '10px', border: '1px solid #f9d8e2', fontWeight: 600 }}>
                          ลูกค้าใหม่
                        </span>
                      )}
                    </div>
                    <div className="coupon-title">
                      {d.discountType === 'percent' ? `ลด ${d.discountValue}%` : `ลด ${d.discountValue?.toLocaleString()} บาท`}
                    </div>
                    <div className="coupon-subtitle">
                      {d.minSpend ? `ขั้นต่ำ ${d.minSpend.toLocaleString()} บาท` : 'ไม่มีขั้นต่ำ'}
                    </div>
                    {d.description && <div className="coupon-desc">{d.description}</div>}
                  </div>
                  <div className="coupon-right">
                    <div className="coupon-checkbox">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-coupon-box">
              ไม่มีคูปองส่วนลดที่สามารถใช้ได้
            </div>
          )}
          {discountError && <div className="discount-msg error">{discountError}</div>}
          {discountSuccess && <div className="discount-msg success">{discountSuccess}</div>}
        </div>

        <div className="summary-card">
          {/* Cart items list with glitter_rose config details */}
          {cartItems.map((item: any, idx: number) => {
            const cfg = item.config || null;
            const isGlitterRose = item.type === 'glitter_rose' || (cfg && (cfg.selectedColors || cfg.selectedLayers || cfg.selectedShape));
            const colors = isGlitterRose && cfg ? (cfg.selectedColors || []).map((id: string) => ROSE_COLORS_MAP[id] || id).join(', ') : '';
            const layers = isGlitterRose && cfg ? (cfg.selectedLayers || []).map((id: string) => ROSE_LAYERS_MAP[id] || id).join(', ') : '';
            const paper = isGlitterRose && cfg ? (ROSE_PAPERS_MAP[cfg.selectedPaper] || cfg.selectedPaper || '') : '';
            const shape = isGlitterRose && cfg ? (ROSE_SHAPES_MAP[cfg.selectedShape] || cfg.selectedShape || '') : '';
            return (
              <div key={idx} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #f2e5e8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#5c4738', fontSize: '0.95rem', flex: 1 }}>{item.name}</span>
                  <span style={{ color: '#db8a9e', fontWeight: 700, whiteSpace: 'nowrap' }}>{(item.price * (item.qty || 1)).toLocaleString()} ฿</span>
                </div>
                {isGlitterRose && cfg && (
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {(cfg.selectedQty || 0) > 0 && (
                      <span style={{ fontSize: '0.8rem', color: '#a08a8e' }}>🌹 จำนวน: {cfg.selectedQty} ดอก</span>
                    )}
                    {colors && <span style={{ fontSize: '0.8rem', color: '#a08a8e' }}>🎨 สี: {colors}</span>}
                    {layers && <span style={{ fontSize: '0.8rem', color: '#a08a8e' }}>🌿 รองช่อ: {layers}</span>}
                    {paper && <span style={{ fontSize: '0.8rem', color: '#a08a8e' }}>📄 กระดาษห่อ: {paper}</span>}
                    {shape && <span style={{ fontSize: '0.8rem', color: '#a08a8e' }}>📦 รูปทรง: {shape}</span>}
                  </div>
                )}
              </div>
            );
          })}
          <div className="summary-row">
            <span>ยอดรวมสินค้า</span>
            <span>{originalTotal.toLocaleString()} บาท</span>
          </div>
          {discountAmount > 0 && (
            <div className="summary-row" style={{ color: '#4caf50' }}>
              <span>ส่วนลดโค้ด {appliedDiscountCode}</span>
              <span>- {discountAmount.toLocaleString()} บาท</span>
            </div>
          )}
          <div className="summary-row">
            <span>รูปแบบการชำระเงิน</span>
            <span style={{ fontWeight: 600, color: '#db8a9e' }}>
              {paymentOption === 'full' ? 'ชำระเต็มจำนวน (100%)' : 'ชำระเงินมัดจำ (50%)'}
            </span>
          </div>
          <div className="summary-row row-highlight">
            <span>{paymentOption === 'full' ? 'ยอดชำระตอนนี้ (100%)' : 'ยอดมัดจำที่ชำระ (50%)'}</span>
            <span>{currentPayAmount.toLocaleString()} บาท</span>
          </div>
          <div className="summary-row" style={{ color: paymentOption === 'full' ? '#4caf50' : '#a08a8e', fontSize: '0.85rem' }}>
            <span>ยอดค้างชำระ (จ่ายเมื่อเสร็จ)</span>
            <span>{paymentOption === 'full' ? '0 บาท' : `${(total - deposit).toLocaleString()} บาท`}</span>
          </div>
        </div>

        <div className="slip-upload-section">
          <div className="slip-upload-label">
            อัปโหลดสลิปการโอนเงิน
          </div>
          <input
            type="file"
            id="slip-upload"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleSlipUpload}
            style={{ display: 'none' }}
          />
          <div
            className={`slip-upload-box ${slipFile ? 'has-file' : ''}`}
            onClick={() => document.getElementById('slip-upload')?.click()}
          >
            {slipPreview ? (
              <>
                <div className="slip-preview">
                  <img src={slipPreview} alt="Slip preview" />
                </div>
                <button
                  className="slip-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlipFile(null);
                    setSlipPreview(null);
                  }}
                >
                  ลบรูป
                </button>
              </>
            ) : (
              <>
                <div className="slip-upload-icon">📤</div>
                <div className="slip-upload-text">คลิกเพื่ออัปโหลดสลิป</div>
                <div className="slip-upload-subtext">รองรับไฟล์ JPEG, PNG (สูงสุด 5MB)</div>
              </>
            )}
          </div>
        </div>

        <button
          className="confirm-btn"
          onClick={handleConfirmPayment}
          disabled={isProcessing || isStoreClosedNow}
          style={{ opacity: isStoreClosedNow ? 0.5 : 1, cursor: isStoreClosedNow ? 'not-allowed' : 'pointer' }}
        >
          {isProcessing ? 'กำลังดำเนินการ...' : 'ชำระเงินแล้ว'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#a08a8e', marginTop: '16px' }}>
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
            <h2 className="modal-title">ขอบคุณสำหรับคำสั่งซื้อ</h2>
            <p className="modal-desc">
              ได้รับออร์เดอร์ของคุณแล้ว!<br />
              {paymentOption === 'full' ? 'รอแอดมินตรวจสอบยอดเงิน' : 'รอแอดมินตรวจสอบยอดมัดจำ'}<br />
              เมื่อยืนยันแล้วจะเริ่มจัดช่อดอกไม้ให้ทันที
            </p>
            <button className="modal-btn" onClick={() => window.location.href = '/cart?tab=history'}>
              ดูประวัติการสั่งซื้อ
            </button>
          </div>
        </div>
      )}

      {showSlipErrorPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 className="modal-title">กรุณาอัปโหลดสลิป</h2>
            <p className="modal-desc">
              คุณยังไม่ได้อัปโหลดสลิปการโอนเงิน<br />
              กรุณาอัปโหลดสลิปก่อนกดยืนยันค่ะ
            </p>
            <button className="modal-btn" onClick={() => setShowSlipErrorPopup(false)}>
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
