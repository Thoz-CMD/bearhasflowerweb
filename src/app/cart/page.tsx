'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

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

const BasketIcon = ({ colors = [], size = 46 }: { colors: string[], size?: number }) => {
  const c1 = colors[0] || '#F48FB1';
  const c2 = colors[1] || c1;
  const c3 = colors[2] || (colors.length > 1 ? colors[0] : c1); // Cycle colors if only 2

  return (
    <svg height={size} width={size} viewBox="0 0 512 512" style={{ filter: `drop-shadow(0px 4px 6px ${c1}40)` }}>
      {/* Basket Handle and Base */}
      <path style={{fill: '#834E00'}} d="M401.171,150.142C401.171,67.354,333.818,0,251.031,0S100.889,67.354,100.889,150.142v74.557 c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.461,0.035,0.691c0.017,0.344,0.032,0.689,0.07,1.026 c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266h201.168c8.207,0,15.125-6.12,16.126-14.266 l33.309-271.053c0.006-0.045,0.004-0.089,0.009-0.134c0.038-0.338,0.054-0.682,0.07-1.026c0.011-0.231,0.033-0.461,0.035-0.691 c0-0.044,0.007-0.086,0.007-0.131v-74.557H401.171z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647 s117.647,52.776,117.647,117.647v58.31H133.384V150.142z"/>
      <path style={{fill: '#DF871E'}} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h300.182c0.002-0.044,0.007-0.086,0.009-0.131 c0.011-0.231,0.034-0.461,0.035-0.691c0-0.045,0.007-0.086,0.007-0.131v-74.557C401.171,67.354,333.819,0,251.031,0 c-82.788,0-150.142,67.354-150.142,150.142v74.557c0,0.044,0.007,0.086,0.007,0.131C100.897,225.06,100.919,225.29,100.93,225.521z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647c64.871,0,117.647,52.776,117.647,117.647v58.31H133.384V150.142z"/>
      <path style={{fill: '#A66300'}} d="M250.817,208.451H133.384v-58.31c0-64.799,52.662-117.528,117.434-117.644V0.002 c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.46,0.035,0.691 c0.018,0.344,0.032,0.689,0.07,1.026c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266 h100.371V208.451H250.817z"/>
      <path style={{fill: '#EDA637'}} d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h149.878v-17.199H133.384v-58.31 c0-64.799,52.662-117.528,117.434-117.644V0.002c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131 C100.897,225.06,100.919,225.29,100.93,225.521z"/>
      <g>
        <polygon style={{fill: '#834E00'}} points="382.876,374.577 119.185,374.577 123.302,408.075 378.759,408.075"/>
        <polygon style={{fill: '#834E00'}} points="374.922,439.293 127.139,439.293 131.256,472.791 370.807,472.791"/>
      </g>
      <g>
        <polygon style={{fill: '#704300'}} points="251.031,374.577 251.031,408.075 378.759,408.075 382.876,374.577"/>
        <polygon style={{fill: '#704300'}} points="251.031,439.293 251.031,472.791 370.807,472.791 374.922,439.293"/>
      </g>

      {/* Flower 1 - Left */}
      <g opacity="0.9">
        <path fill={c1} d="M302.957,167.299h-42.325l-3.043-54.663c-0.773-13.897,10.287-25.59,24.206-25.59l0,0 c13.917,0,24.978,11.693,24.204,25.589L302.957,167.299z"/>
        <path fill={c1} d="M268.194,154.882l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L268.194,154.882z"/>
        <path fill={c1} d="M295.396,154.882l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.077-27.558-11.624-33.25L295.396,154.882z"/>
      </g>
      <g opacity="0.7">
        <path fill={c1} d="M295.396,188.467l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.077,27.558-11.624,33.25L295.396,188.467z"/>
        <path fill={c1} d="M268.194,188.467l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365-1.078,27.558,11.624,33.25L268.194,188.467z"/>
        <path fill={c1} d="M260.632,176.05h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L260.632,176.05z"/>
      </g>
      <circle style={{fill: '#FACE17'}} cx="282.521" cy="170.716" r="24.903"/>

      {/* Flower 2 - Middle */}
      <g opacity="0.8">
        <path fill={c2} d="M180.174,200.726h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L180.174,200.726z"/>
        <path fill={c2} d="M145.411,188.308l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L145.411,188.308z"/>
        <path fill={c2} d="M172.613,188.308l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L172.613,188.308z"/>
      </g>
      <g opacity="0.6">
        <path fill={c2} d="M172.613,221.893l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L172.613,221.893z"/>
        <path fill={c2} d="M145.411,221.893l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L145.411,221.893z"/>
        <path fill={c2} d="M137.85,209.477h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L137.85,209.477z"/>
      </g>
      <circle style={{fill: '#FACE17'}} cx="159.74" cy="204.147" r="24.903"/>

      {/* Flower 3 - Right */}
      <g opacity="0.95">
        <path fill={c3} d="M374.151,245.227h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L374.151,245.227z"/>
        <path fill={c3} d="M339.388,232.81l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L339.388,232.81z"/>
        <path fill={c3} d="M366.589,232.81l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L366.589,232.81z"/>
      </g>
      <g opacity="0.75">
        <path fill={c3} d="M366.589,266.395l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L366.589,266.395z"/>
        <path fill={c3} d="M339.388,266.395l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L339.388,266.395z"/>
        <path fill={c3} d="M331.826,253.978h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L331.826,253.978z"/>
      </g>
      <circle style={{fill: '#FACE17'}} cx="353.715" cy="248.643" r="24.903"/>
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

    // Check if Firebase is configured
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate().toLocaleString('th-TH') || 'กำลังประมวลผล...'
        }));
        setOrders(fetchedOrders);
        setIsFirebaseEnabled(true);
      }, (error) => {
        setIsFirebaseEnabled(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase Init Error:", e);
    }
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
      window.location.href = '/glitter_rose';
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
      } catch (e) {}
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: newStatus} : o));
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'preparing': return { text: 'กำลังจัดช่อดอกไม้', color: '#ff9800', bg: '#fff3e0' };
      case 'shipping': return { text: 'รอจัดส่ง', color: '#2196f3', bg: '#e3f2fd' };
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
          display: flex;
          align-items: center;
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          justify-content: space-between;
          flex-shrink: 0;
          position: relative;
          z-index: 100;
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

        .content-wrap { max-width: 600px; margin: 0 auto; width: 100%; }

        .cart-list { display: flex; flex-direction: column; gap: 12px; }

        .cart-item {
          background: #fff; border-radius: 20px; padding: 16px; display: flex; gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(219, 138, 158, 0.1);
        }

        .item-img-placeholder {
          width: 70px; height: 70px; background: #fdfafb; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0;
        }

        .item-info { flex: 1; display: flex; flex-direction: column; }
        .item-name { font-weight: 600; font-size: 0.95rem; color: #5c4738; }
        .edit-badge { font-size: .6rem; color: #db8a9e; background: #fdf5f6; padding: 2px 6px; border-radius: 6px; margin-top: 4px; display: inline-block; }
        .item-price { color: #db8a9e; font-weight: 700; font-size: 1.1rem; margin-top: 4px; }
        .item-details { font-size: .75rem; color: #a08a8e; margin-top: 4px; }

        .item-controls { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .qty-btns { display: flex; align-items: center; gap: 12px; background: #fdf5f6; padding: 4px 12px; border-radius: 50px; }
        .qty-btn { border: none; background: none; font-size: 1.2rem; color: #db8a9e; cursor: pointer; }
        .qty-num { font-weight: 700; color: #5c4738; }
        .remove-btn { border: none; background: none; color: #a08a8e; cursor: pointer; font-size: .75rem; text-decoration: underline; }

        .cart-summary {
          position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
          padding: 20px 24px 30px 24px; border-radius: 30px 30px 0 0;
          box-shadow: 0 -10px 30px rgba(219, 138, 158, 0.1); z-index: 100;
        }

        .summary-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .total-label { font-size: 1rem; color: #a08a8e; }
        .total-value { font-size: 1.6rem; font-weight: 800; color: #db8a9e; }
        .checkout-btn { width: 100%; padding: 16px; background: #db8a9e; color: #fff; border: none; border-radius: 50px; font-size: 1.1rem; font-weight: 700; cursor: pointer; }

        /* History */
        .order-card { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid rgba(219, 138, 158, 0.1); }
        .order-header { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #fdf5f6; }
        .status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 50px; font-size: .75rem; font-weight: 700; line-height: 1; }
        .empty-state { padding: 80px 20px; text-align: center; color: #a08a8e; }
        .empty-icon { font-size: 4rem; margin-bottom: 20px; opacity: 0.5; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade { animation: fadeIn 0.4s ease-out both; }
      `}</style>

      <nav className="cart-nav">
        <button className="back-btn" onClick={() => window.location.href = '/'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="cart-title">Shopping Bag</div>
        <div style={{ width: 40 }}></div>
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
                  <div className="empty-icon">🛍️</div>
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
                    <div key={item.id} className="cart-item" onClick={() => handleEditItem(item)}>
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
                        <div className="item-price">{item.price.toLocaleString()} ฿</div>
                        {item.details && <div className="item-details">{item.details}</div>}
                        <div className="item-controls" onClick={(e) => e.stopPropagation()}>
                          <div className="qty-btns">
                            <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                            <span className="qty-num">{item.qty || 1}</span>
                            <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                          </div>
                          <button className="remove-btn" onClick={() => removeItem(item.id)}>ลบออก</button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          ) : (
            <div className="history-view animate-fade">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <h3>ไม่มีประวัติการสั่งซื้อ</h3>
                </div>
              ) : (
                <div className="order-list">
                  {orders.map((order: any) => {
                    const statusInfo = getStatusLabel(order.status);
                    return (
                      <div key={order.id} className="order-card">
                        <div className="order-header">
                          <div>
                            <div style={{fontWeight:700}}>#{order.id.toString().slice(-6).toUpperCase()}</div>
                            <div style={{fontSize:'.75rem',color:'#a08a8e'}}>{order.date}</div>
                          </div>
                          <span className="status-badge" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:8}}>
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} style={{display:'flex',justifyContent:'space-between',fontSize:'.85rem'}}>
                              <span>{item.name} x {item.qty}</span>
                              <span>{(item.price * item.qty).toLocaleString()} ฿</span>
                            </div>
                          ))}
                        </div>
                        <div style={{marginTop:15,textAlign:'right',borderTop:'1px dashed #fdf5f6',paddingTop:10}}>
                          <span style={{fontSize:'.85rem',color:'#a08a8e'}}>ยอดรวม: </span>
                          <span style={{fontWeight:700,color:'#db8a9e',fontSize:'1.1rem'}}>{order.total.toLocaleString()} ฿</span>
                        </div>
                      </div>
                    );
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
          <button className="checkout-btn" onClick={handleCheckout}>
            สั่งซื้อสินค้า
          </button>
        </div>
      )}
    </div>
  );
}
