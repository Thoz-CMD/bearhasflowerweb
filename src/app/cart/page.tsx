'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_CART = 'bear_flower_cart';

const getRoseColorHex = (colorId: string) => {
  const colors: Record<string, string> = {
    red: '#E53935',
    pink: '#F48FB1',
    blue: '#1976D2',
    white: '#F9F9F9',
    sky: '#81D4FA',
    purple: '#CE93D8'
  };
  return colors[colorId] || '#F48FB1';
};

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
const ROSE_DECORATIONS_MAP: Record<string, string> = {
  ribbon: 'โบว์คาดช่อ', butterfly: 'ผีเสื้อ', blank_card: 'การ์ดเปล่า',
  stick: 'ก้านเสียบ', fairy_light: 'ไฟประดับ', crown: 'มงกุฎ',
  ribbon_jfy_clear: 'โบว์คาดช่อ JUST FOR YOU สีขาวโปร่ง',
  ribbon_jfy_solid: 'โบว์คาดช่อ Just For You สีขาวทึบ',
  ribbon_hbd_clear: 'โบว์คาดช่อ HAPPY BIRTHDAY สีดำโปร่ง'
};

const renderDesktopConfig = (item: any) => {
  if (item.type !== 'glitter_rose' || !item.config) return null;
  const config = item.config;

  const colors = (config.selectedColors || []).map((id: string) => ROSE_COLORS_MAP[id] || id).join(', ');
  const layers = (config.selectedLayers || []).map((id: string) => ROSE_LAYERS_MAP[id] || id).join(', ');
  const decorations = (config.selectedDecorations || []).map((id: string) => ROSE_DECORATIONS_MAP[id] || id).join(', ');
  const paper = ROSE_PAPERS_MAP[config.selectedPaper] || config.selectedPaper;
  const shape = ROSE_SHAPES_MAP[config.selectedShape] || config.selectedShape;

  return (
    <div className="desktop-config-details" onClick={(e) => e.stopPropagation()}>
      <div>
        <div className="config-group-title">🌹 ช่อดอกกุหลาบ</div>
        <ul className="config-item-list">
          <li>จำนวน: {config.selectedQty || 0} ดอก</li>
          {colors && <li>สี: {colors}</li>}
        </ul>
      </div>
      {(layers || paper || shape) && (
        <div>
          <div className="config-group-title">📜 องค์ประกอบการห่อ</div>
          <ul className="config-item-list">
            {layers && <li>รองช่อ: {layers}</li>}
            {paper && <li>กระดาษห่อ: {paper}</li>}
            {shape && <li>รูปทรง: {shape}</li>}
          </ul>
        </div>
      )}
      {decorations && (
        <div>
          <div className="config-group-title">✨ ของตกแต่งเพิ่มเติม</div>
          <ul className="config-item-list">
            <li>{decorations}</li>
          </ul>
        </div>
      )}
      {(config.customerName || config.deliveryDate) && (
        <div>
          <div className="config-group-title">📍 ข้อมูลการจัดส่ง</div>
          <ul className="config-item-list">
            {config.customerName && <li>ผู้รับ: {config.customerName} ({config.customerPhone || 'ไม่ระบุเบอร์'})</li>}
            {config.customerAddress && <li>ที่อยู่: {config.customerAddress}</li>}
            {config.deliveryDate && <li>ส่ง: {config.deliveryDate} ({config.deliveryTime || 'ไม่ระบุเวลา'})</li>}
            {config.additionalNote && <li>โน๊ต: "{config.additionalNote}"</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

const BasketIcon = ({ colors = [], size = 46 }: { colors: string[], size?: number }) => {
  const c1 = colors[0] || '#F48FB1';
  const c2 = colors[1] || c1;
  const c3 = colors[2] || (colors.length > 1 ? colors[0] : c1); // Cycle colors if only 2

  return (
    <svg height={size} width={size} viewBox="0 0 512 512" style={{ filter: `drop-shadow(0px 4px 6px ${c1}40)` }}>
      {/* Basket Handle and Base */}
      <path style={{ fill: '#834E00' }} d="M401.171,150.142C401.171,67.354,333.818,0,251.031,0S100.889,67.354,100.889,150.142v74.557 c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.461,0.035,0.691c0.017,0.344,0.032,0.689,0.07,1.026 c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266h201.168c8.207,0,15.125-6.12,16.126-14.266 l33.309-271.053c0.006-0.045,0.004-0.089,0.009-0.134c0.038-0.338,0.054-0.682,0.07-1.026c0.011-0.231,0.033-0.461,0.035-0.691 c0-0.044,0.007-0.086,0.007-0.131v-74.557H401.171z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647 s117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />
      <path style={{ fill: '#DF871E' }} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h300.182c0.002-0.044,0.007-0.086,0.009-0.131 c0.011-0.231,0.034-0.461,0.035-0.691c0-0.045,0.007-0.086,0.007-0.131v-74.557C401.171,67.354,333.819,0,251.031,0 c-82.788,0-150.142,67.354-150.142,150.142v74.557c0,0.044,0.007,0.086,0.007,0.131C100.897,225.06,100.919,225.29,100.93,225.521z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647c64.871,0,117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />
      <path style={{ fill: '#A66300' }} d="M250.817,208.451H133.384v-58.31c0-64.799,52.662-117.528,117.434-117.644V0.002 c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.46,0.035,0.691 c0.018,0.344,0.032,0.689,0.07,1.026c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266 h100.371V208.451H250.817z" />
      <path style={{ fill: '#EDA637' }} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h149.878v-17.199H133.384v-58.31 c0-64.799,52.662-117.528,117.434-117.644V0.002c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131 C100.897,225.06,100.919,225.29,100.93,225.521z" />
      <g>
        <polygon style={{ fill: '#834E00' }} points="382.876,374.577 119.185,374.577 123.302,408.075 378.759,408.075" />
        <polygon style={{ fill: '#834E00' }} points="374.922,439.293 127.139,439.293 131.256,472.791 370.807,472.791" />
      </g>
      <g>
        <polygon style={{ fill: '#704300' }} points="251.031,374.577 251.031,408.075 378.759,408.075 382.876,374.577" />
        <polygon style={{ fill: '#704300' }} points="251.031,439.293 251.031,472.791 370.807,472.791 374.922,439.293" />
      </g>

      {/* Flower 1 - Left */}
      <g opacity="0.9">
        <path fill={c1} d="M302.957,167.299h-42.325l-3.043-54.663c-0.773-13.897,10.287-25.59,24.206-25.59l0,0 c13.917,0,24.978,11.693,24.204,25.589L302.957,167.299z" />
        <path fill={c1} d="M268.194,154.882l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L268.194,154.882z" />
        <path fill={c1} d="M295.396,154.882l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.077-27.558-11.624-33.25L295.396,154.882z" />
      </g>
      <g opacity="0.7">
        <path fill={c1} d="M295.396,188.467l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.077,27.558-11.624,33.25L295.396,188.467z" />
        <path fill={c1} d="M268.194,188.467l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365-1.078,27.558,11.624,33.25L268.194,188.467z" />
        <path fill={c1} d="M260.632,176.05h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L260.632,176.05z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="282.521" cy="170.716" r="24.903" />

      {/* Flower 2 - Middle */}
      <g opacity="0.8">
        <path fill={c2} d="M180.174,200.726h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L180.174,200.726z" />
        <path fill={c2} d="M145.411,188.308l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L145.411,188.308z" />
        <path fill={c2} d="M172.613,188.308l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L172.613,188.308z" />
      </g>
      <g opacity="0.6">
        <path fill={c2} d="M172.613,221.893l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L172.613,221.893z" />
        <path fill={c2} d="M145.411,221.893l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L145.411,221.893z" />
        <path fill={c2} d="M137.85,209.477h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L137.85,209.477z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="159.74" cy="204.147" r="24.903" />

      {/* Flower 3 - Right */}
      <g opacity="0.95">
        <path fill={c3} d="M374.151,245.227h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L374.151,245.227z" />
        <path fill={c3} d="M339.388,232.81l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L339.388,232.81z" />
        <path fill={c3} d="M366.589,232.81l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L366.589,232.81z" />
      </g>
      <g opacity="0.75">
        <path fill={c3} d="M366.589,266.395l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L366.589,266.395z" />
        <path fill={c3} d="M339.388,266.395l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L339.388,266.395z" />
        <path fill={c3} d="M331.826,253.978h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L331.826,253.978z" />
      </g>
      <circle style={{ fill: '#FACE17' }} cx="353.715" cy="248.643" r="24.903" />
    </svg>
  );
};

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('cart');
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFirebaseEnabled, setIsFirebaseEnabled] = useState(false);
  const [expandedOrderKey, setExpandedOrderKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedOrderKey(prev => prev === key ? null : key);
  };

  useEffect(() => {
    setIsClient(true);
    if (window.location.search.includes('tab=history')) {
      setActiveTab('history');
    }
    const savedCart = localStorage.getItem(STORAGE_CART);
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setIsLoaded(true);

    // Check if Firebase is configured and user is logged in
    let unsubscribe: () => void;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().createdAt?.toDate().toLocaleString('th-TH') || 'กำลังประมวลผล...'
            }));
            setOrders(fetchedOrders);
            setIsFirebaseEnabled(true);
          }, (error) => {
            console.error("Firestore Error:", error);
            setIsFirebaseEnabled(false);
          });
        } catch (e) {
          console.error("Firebase Query Error:", e);
        }
      } else {
        setOrders([]);
        setIsFirebaseEnabled(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_CART, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.qty || 1) + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditItem = (item: any) => {
    if (item.type === 'glitter_rose' && item.config) {
      localStorage.setItem('bear_flower_v1', JSON.stringify(item.config));
      localStorage.setItem('editing_cart_id', item.id);
      window.location.href = '/glitter_rose?edit=true';
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    window.location.href = '/checkout';
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (isFirebaseEnabled) {
      try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
      } catch (e) { }
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_verification': return { text: 'รอดำเนินการ (รอตรวจสอบมัดจำ)', color: '#757575', bg: '#f5f5f5' };
      case 'preparing': return { text: 'กำลังจัดช่อดอกไม้', color: '#ff9800', bg: '#fff3e0' };
      case 'shipping': return { text: 'จัดดอกไม้เสร็จแล้ว กรุณาชำระเงินอีกครึ่งนึงเพื่อดำเนินการจัดส่ง', color: '#2196f3', bg: '#e3f2fd' };
      case 'pending_final_verification': return { text: 'กำลังตรวจสอบยอดเงินส่วนที่เหลือ', color: '#e67e22', bg: '#fdf6ee' };
      case 'delivering': return { text: 'กำลังจัดส่ง', color: '#9c27b0', bg: '#f3e5f5' };
      case 'completed': return { text: 'เสร็จสิ้น', color: '#4caf50', bg: '#e8f5e9' };
      default: return { text: 'รอดำเนินการ', color: '#757575', bg: '#f5f5f5' };
    }
  };

  if (!isClient) return null;

  return (
    <div className="cart-page-container">
      <style>{`
        .cart-page-container {
          height: 100vh;
          background: #fffafb;
          color: #5c4738;
          font-family: 'Noto Sans Thai', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .cart-nav {
          background: #fff;
          height: 64px;
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          flex-shrink: 0;
          position: relative;
          z-index: 100;
        }

        @media (min-width: 1024px) {
          .cart-nav {
            padding: 0 40px;
          }
        }

        .back-btn {
          width: 40px; height: 40px; border-radius: 50%; border: none;
          background: #fdf5f6; color: #db8a9e; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
        }

        .cart-title { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.4rem; color: #db8a9e; }

        .tab-switcher {
          display: flex; background: #fdf5f6; margin: 15px 20px; border-radius: 50px; padding: 4px; flex-shrink: 0;
        }

        @media (min-width: 1024px) {
          .tab-switcher {
            max-width: 1280px;
            margin: 20px auto;
            width: calc(100% - 80px);
          }
        }

        .tab-btn {
          flex: 1; border: none; background: none; padding: 10px; border-radius: 50px;
          font-size: .85rem; font-weight: 600; color: #a08a8e; cursor: pointer;
        }

        .tab-btn.active { color: #fff; background: #db8a9e; box-shadow: 0 4px 12px rgba(219, 138, 158, 0.3); }

        .content-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px 120px 20px;
        }

        @media (min-width: 1024px) {
          .content-scroll {
            padding: 0 40px 120px 40px;
          }
        }

        .content-wrap { max-width: 600px; margin: 0 auto; width: 100%; }

        @media (min-width: 1024px) {
          .content-wrap {
            max-width: 1280px;
          }
        }

        .cart-list { display: flex; flex-direction: column; gap: 12px; }

        .cart-item {
          background: #fff; border-radius: 20px; padding: 16px; display: flex; gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(219, 138, 158, 0.1);
        }

        @media (min-width: 1024px) {
          .cart-item {
            gap: 24px;
            padding: 24px;
            align-items: flex-start;
          }
        }

        .item-img-placeholder {
          width: 90px; height: 90px; background: #fdfafb; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; font-size: 2.2rem; flex-shrink: 0;
        }

        .item-img-placeholder svg {
          width: 58px !important;
          height: 58px !important;
        }

        @media (min-width: 1024px) {
          .item-img-placeholder {
            width: 220px !important;
            height: 220px !important;
            border-radius: 18px;
            font-size: 4rem;
          }
          .item-img-placeholder svg {
            width: 140px !important;
            height: 140px !important;
          }
          .item-price {
            font-size: 1.45rem !important;
          }
        }

        .item-info { flex: 1; display: flex; flex-direction: column; }
        .item-name { font-weight: 600; font-size: 0.95rem; color: #5c4738; }
        .edit-badge { font-size: .6rem; color: #db8a9e; background: #fdf5f6; padding: 2px 6px; border-radius: 6px; margin-top: 4px; display: inline-block; }
        .item-price { color: #db8a9e; font-weight: 700; font-size: 1.25rem; margin-top: 4px; }
        .item-details { font-size: .75rem; color: #a08a8e; margin-top: 4px; }

        .item-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .qty-btns { display: flex; align-items: center; gap: 12px; background: #fdf5f6; padding: 4px 12px; border-radius: 50px; }
        .qty-btn { border: none; background: none; font-size: 1.2rem; color: #db8a9e; cursor: pointer; }
        .qty-num { font-weight: 700; color: #5c4738; }
        .remove-btn {
          border: none;
          background: #fff0f2;
          color: #db3a55;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(219, 58, 85, 0.06);
        }

        .remove-btn:hover {
          background: #db3a55;
          color: #fff;
          transform: scale(1.06) translateY(-1px);
          box-shadow: 0 4px 10px rgba(219, 58, 85, 0.2);
        }

        .remove-btn:active {
          transform: scale(0.95);
        }

        .cart-summary {
          position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
          padding: 20px 24px 30px 24px; border-radius: 30px 30px 0 0;
          box-shadow: 0 -10px 30px rgba(219, 138, 158, 0.1); z-index: 100;
        }

        @media (min-width: 1024px) {
          .cart-summary {
            max-width: 1280px;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: calc(100% - 80px);
            border-radius: 30px 30px 0 0;
          }
        }

        .desktop-config-details {
          display: none;
        }

        @media (min-width: 1024px) {
          .cart-item[data-type="glitter_rose"] .item-details {
            display: none;
          }

          .desktop-config-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            background: #fffcfd;
            padding: 16px;
            border-radius: 12px;
            margin-top: 12px;
            border: 1px dashed rgba(219, 138, 158, 0.25);
            font-size: 0.85rem;
            color: #5c4738;
            text-align: left;
          }

          .config-group-title {
            font-weight: 700;
            color: #db8a9e;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .config-item-list {
            margin: 0;
            padding-left: 16px;
            color: #7a6352;
            list-style-type: disc;
          }
          
          .config-item-list li {
            margin-bottom: 4px;
          }
        }

        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .total-label { font-size: 1rem; color: #a08a8e; }
        .total-value { font-size: 1.6rem; font-weight: 800; color: #db8a9e; }
        .checkout-btn { width: 100%; padding: 16px; background: #db8a9e; color: #fff; border: none; border-radius: 50px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }

        /* History */
        .order-list { display: flex; flex-direction: column; gap: 24px; }

        .order-list-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fffafb;
          border-radius: 24px;
          padding: 16px;
          border: 1px solid rgba(219, 138, 158, 0.12);
          box-shadow: 0 4px 20px rgba(219, 138, 158, 0.05);
        }

        .order-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px dashed rgba(219, 138, 158, 0.2);
        }

        .order-total-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px dashed rgba(219, 138, 158, 0.2);
          margin-top: 4px;
        }

        .status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 8px 14px; border-radius: 12px; font-size: .75rem; font-weight: 700; line-height: 1.3; text-align: center; word-break: break-word; max-width: 100%; }
        .empty-state { padding: 80px 20px; text-align: center; color: #a08a8e; }
        .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.4s ease-out both; }

        /* Mobile expand panel */
        .mobile-expand-panel {
          display: none;
          overflow: hidden;
          transition: max-height 0.35s ease, opacity 0.3s ease;
          max-height: 0;
          opacity: 0;
        }

        @media (max-width: 1023px) {
          .mobile-expand-panel {
            display: block;
          }
          .mobile-expand-panel.open {
            max-height: 600px;
            opacity: 1;
          }
          .mobile-detail-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: #fffcfd;
            padding: 14px;
            border-radius: 12px;
            margin-top: 10px;
            border: 1px dashed rgba(219,138,158,0.25);
            font-size: 0.82rem;
            color: #5c4738;
          }
          .mobile-detail-group-title {
            font-weight: 700;
            color: #db8a9e;
            margin-bottom: 4px;
          }
          .mobile-detail-list {
            margin: 0;
            padding-left: 16px;
            color: #7a6352;
            list-style-type: disc;
          }
          .mobile-detail-list li { margin-bottom: 3px; }
          .history-card-tap-hint {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: .68rem;
            color: #c9a0ac;
            margin-top: 4px;
            font-weight: 500;
          }
          .tap-hint-arrow {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .tap-hint-arrow.rotated {
            transform: rotate(-180deg);
          }
        }

        @media (min-width: 1024px) {
          .history-card-tap-hint { display: none; }
        }
      `}</style>

      <nav className="cart-nav">
        <div className="navbar-inner">
          <button className="back-btn" onClick={() => window.location.href = '/'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="cart-title">Shopping Bag</div>
          <div style={{ width: 40 }}></div>
        </div>
      </nav>

      <div className="tab-switcher">
        <button className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
          ตะกร้าสินค้า
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          ประวัติการสั่งซื้อ
        </button>
      </div>

      <div className="content-scroll">
        <div className="content-wrap">
          {activeTab === 'cart' ? (
            <div className="cart-view animate-fade">
              {cartItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '180px', height: 'auto', display: 'block', margin: '0 auto' }} />
                  </div>
                  <h3>ตะกร้าว่างเปล่า</h3>
                  <p>เลือกสินค้าที่คุณชอบใส่ตะกร้าได้เลย!</p>
                </div>
              ) : (
                <div className="cart-list">
                  {cartItems.map((item: any) => {
                    const isGlitterRose = item.type === 'glitter_rose';
                    const itemColors = isGlitterRose && item.config?.selectedColors?.length > 0
                      ? item.config.selectedColors.map((id: string) => getRoseColorHex(id))
                      : ['#F48FB1'];

                    return (
                      <div key={item.id} className="cart-item" data-type={item.type} onClick={() => handleEditItem(item)}>
                        <div className="item-img-placeholder">
                          {isGlitterRose ? (
                            <BasketIcon colors={itemColors} />
                          ) : '🛍️'}
                        </div>
                        <div className="item-info">
                          <div className="item-name">
                            {item.name}
                            {item.type === 'glitter_rose' && <span className="edit-badge">แก้ไขช่อนี้</span>}
                          </div>
                          {item.details && <div className="item-details">{item.details}</div>}
                          {renderDesktopConfig(item)}
                          <div className="item-controls" onClick={(e) => e.stopPropagation()}>
                            <div className="item-price" style={{ margin: 0 }}>{item.price.toLocaleString()} ฿</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div className="qty-btns">
                                <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                                <span className="qty-num">{item.qty || 1}</span>
                                <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                              </div>
                              <button className="remove-btn" onClick={() => removeItem(item.id)} title="ลบรายการนี้">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="history-view animate-fade">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <img src="/images/Empty State Icon.png" alt="Empty State" style={{ width: '180px', height: 'auto', display: 'block', margin: '0 auto' }} />
                  </div>
                  <h3>ไม่มีประวัติการสั่งซื้อ</h3>
                  <p>เมื่อคุณสั่งซื้อสินค้าแล้ว รายการจะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="cart-list">
                  {orders.map((order: any) => {
                    const statusInfo = getStatusLabel(order.status);
                    return (order.items || []).map((item: any, idx: number) => {
                      const isGlitterRose = item.type === 'glitter_rose' || !!item.config;
                      const itemColors = item.config?.selectedColors?.length > 0
                        ? item.config.selectedColors.map((id: string) => getRoseColorHex(id))
                        : ['#F48FB1'];

                      const cardKey = `${order.id}-${idx}`;
                      const isExpanded = expandedOrderKey === cardKey;

                      // Build mobile detail sections
                      const cfg = item.config || null;
                      const mobileColors = cfg ? (cfg.selectedColors || []).map((id: string) => ROSE_COLORS_MAP[id] || id).join(', ') : '';
                      const mobileLayers = cfg ? (cfg.selectedLayers || []).map((id: string) => ROSE_LAYERS_MAP[id] || id).join(', ') : '';
                      const mobilePaper = cfg ? (ROSE_PAPERS_MAP[cfg.selectedPaper] || cfg.selectedPaper || '') : '';
                      const mobileShape = cfg ? (ROSE_SHAPES_MAP[cfg.selectedShape] || cfg.selectedShape || '') : '';
                      const mobileDecorations = cfg ? (cfg.selectedDecorations || []).map((id: string) => ROSE_DECORATIONS_MAP[id] || id).join(', ') : '';

                      return (
                        <div
                          key={cardKey}
                          className="cart-item"
                          data-type={isGlitterRose ? 'glitter_rose' : 'other'}
                          style={{ cursor: cfg ? 'pointer' : 'default', position: 'relative' }}
                          onClick={() => cfg && toggleExpand(cardKey)}
                        >
                          {/* Order date at top-right */}
                          {order.date && (
                            <div style={{
                              position: 'absolute', top: '14px', right: '16px',
                              fontSize: '.72rem', color: '#a08a8e', fontWeight: 500,
                              background: '#fdf5f6', padding: '3px 8px', borderRadius: '20px',
                              whiteSpace: 'nowrap'
                            }}>
                              {order.date}
                            </div>
                          )}
                          <div className="item-img-placeholder">
                            {isGlitterRose ? (
                              <BasketIcon colors={itemColors} />
                            ) : '🛍️'}
                          </div>
                          <div className="item-info">
                            <div className="item-name" style={{ paddingRight: order.date ? '120px' : '0' }}>
                              {item.name}
                              {isGlitterRose && <span className="edit-badge">Glitter Rose</span>}
                            </div>
                            {cfg && (
                              <span className="history-card-tap-hint">
                                <span>{isExpanded ? 'หุบรายละเอียด' : 'ดูรายละเอียด'}</span>
                                <svg
                                  className={`tap-hint-arrow${isExpanded ? ' rotated' : ''}`}
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </span>
                            )}
                            {/* Desktop config grid (hidden on mobile) */}
                            {item.config && renderDesktopConfig({ type: 'glitter_rose', config: item.config })}
                            {/* Mobile expand panel */}
                            {cfg && (
                              <div className={`mobile-expand-panel${isExpanded ? ' open' : ''}`}>
                                <div className="mobile-detail-grid">
                                  <div>
                                    <div className="mobile-detail-group-title">🌹 ช่อดอกกุหลาบ</div>
                                    <ul className="mobile-detail-list">
                                      <li>จำนวน: {cfg.selectedQty || 0} ดอก</li>
                                      {mobileColors && <li>สี: {mobileColors}</li>}
                                    </ul>
                                  </div>
                                  {(mobileLayers || mobilePaper || mobileShape) && (
                                    <div>
                                      <div className="mobile-detail-group-title">📜 องค์ประกอบการห่อ</div>
                                      <ul className="mobile-detail-list">
                                        {mobileLayers && <li>รองช่อ: {mobileLayers}</li>}
                                        {mobilePaper && <li>กระดาษห่อ: {mobilePaper}</li>}
                                        {mobileShape && <li>รูปทรง: {mobileShape}</li>}
                                      </ul>
                                    </div>
                                  )}
                                  {mobileDecorations && (
                                    <div>
                                      <div className="mobile-detail-group-title">✨ ของตกแต่ง</div>
                                      <ul className="mobile-detail-list"><li>{mobileDecorations}</li></ul>
                                    </div>
                                  )}
                                  {(cfg.customerName || cfg.deliveryDate) && (
                                    <div>
                                      <div className="mobile-detail-group-title">📍 การจัดส่ง</div>
                                      <ul className="mobile-detail-list">
                                        {cfg.customerName && <li>ผู้รับ: {cfg.customerName} ({cfg.customerPhone || 'ไม่ระบุเบอร์'})</li>}
                                        {cfg.customerAddress && <li>ที่อยู่: {cfg.customerAddress}</li>}
                                        {cfg.deliveryDate && <li>ส่ง: {cfg.deliveryDate} ({cfg.deliveryTime || 'ไม่ระบุเวลา'})</li>}
                                        {cfg.additionalNote && <li>โน๊ต: "{cfg.additionalNote}"</li>}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            <div className="item-controls" onClick={(e) => e.stopPropagation()}>
                              <div className="item-price" style={{ margin: 0 }}>
                                {(item.price * (item.qty || 1)).toLocaleString()} ฿
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '.82rem', color: '#a08a8e' }}>x {item.qty || 1}</span>
                                <span className="status-badge" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                                  {statusInfo.text}
                                </span>
                                {order.status === 'shipping' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); window.location.href = `/payment?orderId=${order.id}`; }}
                                    style={{
                                      padding: '8px 16px',
                                      background: '#db8a9e',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '12px',
                                      fontSize: '0.85rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(219, 138, 158, 0.3)'
                                    }}
                                  >
                                    ชำระเงิน
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'cart' && cartItems.length > 0 && (
        <div className="cart-summary">
          <div className="summary-row">
            <span className="total-label">รวมทั้งหมด</span>
            <span className="total-value">{calculateTotal().toLocaleString()} ฿</span>
          </div>
          {isFirebaseEnabled ? (
            <button className="checkout-btn" onClick={handleCheckout}>
              สั่งซื้อสินค้า
            </button>
          ) : (
            <button className="checkout-btn" onClick={() => window.location.href = '/login'}>
              เข้าสู่ระบบเพื่อสั่งซื้อสินค้า
            </button>
          )}
        </div>
      )}
    </div>
  );
}
