'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePresetProduct } from '@/hooks/usePresetProduct';
import { ToastProvider, useToast } from '@/components/Toast';
import GreetingCardAI from '@/components/GreetingCardAI';
import dynamic from 'next/dynamic';

// Dynamic import DateTimePicker เพื่อหลีกเลี่ยง SSR issues กับ flatpickr
const DateTimePicker = dynamic(() => import('@/components/DateTimePicker'), { ssr: false });

const STORAGE_KEY = 'bear_flower_velvet_v1';
const CART_KEY = 'bear_flower_cart';

const MESSAGE_CARD_VARIANTS = [
  { id: 'valentine_1', label: "Happy Valentine's day 1" },
  { id: 'valentine_2', label: "Happy Valentine's day 2" },
  { id: 'valentine_3', label: "Happy Valentine's day 3" },
  { id: 'anniversary_1', label: 'Happy Anniversary 1' },
  { id: 'anniversary_2', label: 'Happy Anniversary 2' },
  { id: 'birthday', label: 'Happy Birthday' },
  { id: 'congratulation', label: 'CONGRATULATION' },
];

interface VelvetState {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  additionalNote: string;
  productCoverImage: string;
  selectedCard: string | null;
  selectedMessageCardVariant: string | null;
  selectedStick: boolean;
}

const initialState: VelvetState = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  deliveryDate: '',
  deliveryTime: '',
  additionalNote: '',
  productCoverImage: '',
  selectedCard: null,
  selectedMessageCardVariant: null,
  selectedStick: false,
};

function VelvetWireContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { presetProduct, isLoading, error } = usePresetProduct();

  const [state, setState] = useState<VelvetState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [openDecorationDropdown, setOpenDecorationDropdown] = useState<string | null>(null);

  // Load saved state after hydration to prevent mismatch
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsHydrated(true);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        setState({
          customerName: s.customerName || '',
          customerPhone: s.customerPhone || '',
          customerAddress: s.customerAddress || '',
          deliveryDate: s.deliveryDate || '',
          deliveryTime: s.deliveryTime || '',
          additionalNote: s.additionalNote || '',
          productCoverImage: s.productCoverImage || '',
          selectedCard: s.selectedCard || null,
          selectedMessageCardVariant: s.selectedMessageCardVariant || null,
          selectedStick: s.selectedStick || false,
        });
      }
    } catch (err) {
      console.error('Failed to parse saved state', err);
    }
  }, []);

  const basePrice = useMemo(() => presetProduct?.price || 0, [presetProduct]);
  const isPresetReadyToShip = useMemo(() => Boolean(presetProduct?.readyToShip), [presetProduct]);

  const totalPrice = useMemo(() => {
    let total = basePrice;
    if (state.selectedCard === 'message_card') {
      total += 5;
    }
    if (state.selectedStick) {
      total += 5;
    }
    return total;
  }, [basePrice, state.selectedCard, state.selectedStick]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  }, [state]);

  // Show toast messages for preset loading states
  useEffect(() => {
    if (isLoading) {
      showToast('กำลังโหลดแบบสินค้าสำเร็จรูป...');
    }
  }, [isLoading, showToast]);

  useEffect(() => {
    if (error) {
      showToast(error);
    }
  }, [error, showToast]);

  useEffect(() => {
    if (presetProduct && !isLoading) {
      // Check stock for ready-to-ship products
      if (presetProduct.readyToShip && Number(presetProduct.stockQuantity || 0) <= 0) {
        showToast('สินค้าหมดชั่วคราว');
        setTimeout(() => router.push('/'), 900);
        return;
      }
      showToast('โหลดแบบสินค้าสำเร็จรูปเสร็จสิ้น!');
    }
  }, [presetProduct, isLoading, showToast, router]);

  // Check for order success toast from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('order_success_toast')) {
      sessionStorage.removeItem('order_success_toast');
      setTimeout(() => showToast('เพิ่มลงตะกร้าเรียบร้อยแล้ว!'), 300);
    }
  }, [showToast]);

  // Validate delivery date - reset if it's before tomorrow
  useEffect(() => {
    const tmr = getTomorrowStr();
    if (state.deliveryDate && state.deliveryDate < tmr) {
      setState(prev => ({ ...prev, deliveryDate: '', deliveryTime: '' }));
    }
  }, [state.deliveryDate]);

  const updateField = useCallback((field: keyof VelvetState, value: string) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDateChange = useCallback((dateStr: string, timeStr: string) => {
    setState(prev => ({ ...prev, deliveryDate: dateStr, deliveryTime: timeStr }));
  }, []);

  const handleCardSelect = useCallback((cardId: string) => {
    setState(prev => {
      if (prev.selectedCard === cardId) {
        // Deselect
        setOpenDecorationDropdown(null);
        return { ...prev, selectedCard: null, selectedMessageCardVariant: null };
      }
      // Select
      if (cardId === 'message_card') {
        setOpenDecorationDropdown('message_card');
        return { ...prev, selectedCard: cardId, selectedMessageCardVariant: prev.selectedMessageCardVariant || MESSAGE_CARD_VARIANTS[0].id };
      }
      return { ...prev, selectedCard: cardId };
    });
  }, []);

  const handleStickSelect = useCallback(() => {
    setState(prev => ({ ...prev, selectedStick: !prev.selectedStick }));
  }, []);

  const handleMessageCardVariantSelect = useCallback((variantId: string) => {
    setOpenDecorationDropdown(null);
    setState(prev => ({ ...prev, selectedMessageCardVariant: variantId, selectedCard: 'message_card' }));
  }, []);

  const toggleMessageCardDropdown = useCallback(() => {
    setOpenDecorationDropdown(prev => prev === 'message_card' ? null : 'message_card');
    setState(prev => {
      if (!prev.selectedCard) {
        return { ...prev, selectedCard: 'message_card', selectedMessageCardVariant: MESSAGE_CARD_VARIANTS[0].id };
      }
      return prev;
    });
  }, []);

  const getMessageCardVariantLabel = useCallback((variantId: string | null) => {
    if (!variantId) return 'เลือกแบบการ์ดข้อความ';
    const variant = MESSAGE_CARD_VARIANTS.find(v => v.id === variantId);
    return variant ? variant.label : 'เลือกแบบการ์ดข้อความ';
  }, []);

  const finishOrder = useCallback(() => {
    if (!presetProduct) {
      showToast('ไม่พบข้อมูลสินค้า');
      return;
    }
    if (
      !state.customerName.trim() ||
      !state.customerPhone.trim() ||
      !state.customerAddress.trim() ||
      !state.deliveryDate ||
      !state.deliveryTime
    ) {
      showToast('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน');
      return;
    }
    const tomorrowStr = getTomorrowStr();
    if (state.deliveryDate === tomorrowStr && state.deliveryTime < '09:00') {
      showToast('หากจัดส่งวันพรุ่งนี้ กรุณาเลือกเวลารับตั้งแต่ 09:00 น. เป็นต้นไป');
      return;
    }

    if (isPresetReadyToShip && Number(presetProduct.stockQuantity || 0) <= 0) {
      showToast('สินค้าหมดชั่วคราว');
      return;
    }

    const editingId = typeof window !== 'undefined' ? window.localStorage.getItem('editing_cart_id') : null;
    const customItem = {
      id: editingId || 'vw_' + Date.now(),
      type: 'velvet_flower',
      name: presetProduct.name,
      price: totalPrice,
      qty: 1,
      details: presetProduct.description || 'ดอกไม้ลวดกำมะหยี่',
      coverImage: presetProduct.coverImage,
      presetId: presetProduct.id,
      readyToShip: isPresetReadyToShip,
      stockQuantity: Number(presetProduct.stockQuantity || 0),
      config: {
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerAddress: state.customerAddress,
        deliveryDate: state.deliveryDate,
        deliveryTime: state.deliveryTime,
        additionalNote: state.additionalNote,
        presetId: presetProduct.id,
        selectedCard: state.selectedCard,
        selectedMessageCardVariant: state.selectedMessageCardVariant,
        selectedStick: state.selectedStick,
      },
    };

    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (editingId) {
        // Update existing item
        const index = cart.findIndex((item: any) => item.id === editingId);
        if (index !== -1) {
          cart[index] = customItem;
        }
      } else {
        // Add new item
        cart.push(customItem);
      }
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      if (editingId) {
        localStorage.setItem(CART_KEY, JSON.stringify([customItem]));
      } else {
        localStorage.setItem(CART_KEY, JSON.stringify([customItem]));
      }
    }

    localStorage.removeItem(STORAGE_KEY);
    if (editingId) {
      localStorage.removeItem('editing_cart_id');
    }
    sessionStorage.setItem('order_success_toast', '1');
    router.push('/cart');
  }, [presetProduct, state, basePrice, isPresetReadyToShip, showToast, router]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  // Date picker value for initialization
  const datePickerValue = useMemo(() => {
    if (state.deliveryDate && state.deliveryTime) {
      return `${state.deliveryDate} ${state.deliveryTime}`;
    }
    return undefined;
  }, [state.deliveryDate, state.deliveryTime]);

  const tomorrowStr = useMemo(() => getTomorrowStr(), []);
  const initialMinTime = useMemo(
    () => (state.deliveryDate === tomorrowStr ? '09:00' : '00:00'),
    [state.deliveryDate, tomorrowStr]
  );

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <a href="/" className="nav-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            &quot;Bear has flower&quot;
          </a>
        </div>
      </nav>

      <div className="page-wrap">
        {/* Heading */}
        <div className="page-heading">
          <h1>&quot;Velvet Wire&quot;</h1>
          <p className="subtitle">ออกแบบดอกไม้ลวดกำมะหยี่ของคุณ</p>
        </div>

        {/* Order Summary */}
        <div className="order-summary" id="order-summary" style={{ marginTop: '20px' }}>
          <span className="summary-label">🛒 สินค้าที่เลือก</span>
          <div className="summary-chips" id="summary-chips">
            {!presetProduct ? (
              <span className="summary-empty">
                {isLoading ? 'กำลังโหลดข้อมูลสินค้า...' : 'กำลังโหลด...'}
              </span>
            ) : (
              <span className="summary-chip" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {presetProduct.coverImage ? (
                  <img
                    src={presetProduct.coverImage}
                    alt={presetProduct.name || 'Product'}
                    style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  '🌸'
                )}
                <span>{presetProduct.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Selection Bar (Desktop/iPad) */}
        <div className="selection-bar">
          <div className="bar-step-info">
            ราคา:{' '}
            <strong id="desktop-price-val" style={{ color: 'var(--rose-gold)', fontSize: '1.4rem' }}>
              {totalPrice.toLocaleString()}
            </strong>{' '}
            บาท
          </div>
          <div className="btn-group">
            <button className="btn-next" onClick={finishOrder} style={{ padding: '10px 30px' }}>
              เพิ่มลงตะกร้า
            </button>
          </div>
        </div>

        {/* Main Box - Delivery Form */}
        <div className="main-box" id="main-box" style={{ marginTop: '30px', justifyContent: 'flex-start' }}>
          <div className="qty-header">
            <h3>📍 ข้อมูลการจัดส่ง</h3>
            <p>กรอกข้อมูลสำหรับการจัดส่งดอกไม้</p>
          </div>

          <div style={{ width: '100%', marginTop: '20px' }}>
            <div className="form-group">
              <label>ชื่อผู้รับ</label>
              <input
                type="text"
                id="ipt-name"
                placeholder="ชื่อ-นามสกุล"
                value={state.customerName}
                onChange={e => updateField('customerName', e.target.value)}
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label>เบอร์โทรติดต่อ</label>
              <input
                type="tel"
                id="ipt-phone"
                placeholder="06X-XXX-XXXX"
                value={state.customerPhone}
                onChange={e => updateField('customerPhone', e.target.value)}
                style={{ fontSize: '16px' }}
              />
            </div>

            <div className="form-group">
              <label>ที่อยู่จัดส่ง</label>
              <textarea
                id="ipt-address"
                placeholder="ชื่อหอ.."
                value={state.customerAddress}
                onChange={e => updateField('customerAddress', e.target.value)}
                style={{ fontSize: '16px' }}
              />
              <div className="form-note">ส่งฟรีบริเวณกำแพงแสน</div>
            </div>

            <div className="form-group">
              <label>วันที่และเวลาจัดส่ง</label>
              <DateTimePicker
                id="ipt-date"
                placeholder="เลือกวันที่และเวลา"
                value={datePickerValue}
                minDate={tomorrowStr}
                minTime={initialMinTime}
                onChange={handleDateChange}
              />
              <span
                id="delivery-warning"
                style={{ fontSize: '.75rem', color: 'red', marginTop: '6px', display: 'block', lineHeight: '1.4' }}
              >
                {!isPresetReadyToShip && (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ verticalAlign: 'middle', marginRight: '4px' }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                    สั่งล่วงหน้าอย่างน้อย 1 วัน
                  </>
                )}
              </span>
            </div>

            <div className="form-group">
              <label>เลือกการ์ด (ถ้ามี)</label>
              <div className="color-grid" style={{ marginTop: '10px' }}>
                <div
                  className={`color-card decor-card ${state.selectedCard === 'blank_card' ? 'selected' : ''}`}
                  onClick={() => handleCardSelect('blank_card')}
                >
                  <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                    <img src="/images/Glitter Rose/การ์ดเปล่า.png" alt="การ์ดเปล่า" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  </div>
                  <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem', marginBottom: '4px' }}>การ์ดเปล่า</span>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#4caf50', background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>ฟรี</span>
                </div>

                <div
                  className={`color-card decor-card ${state.selectedCard === 'message_card' ? 'selected' : ''} ${openDecorationDropdown === 'message_card' ? 'dropdown-active' : ''}`}
                  onClick={() => handleCardSelect('message_card')}
                >
                  <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                    <img src="/images/Glitter Rose/การ์ดข้อความ.png" alt="การ์ดข้อความ" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  </div>
                  <div className={`ribbon-variant-dropdown ${openDecorationDropdown === 'message_card' ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="color-name ribbon-variant-trigger"
                      onClick={toggleMessageCardDropdown}
                      aria-expanded={openDecorationDropdown === 'message_card'}
                    >
                      <span>{state.selectedCard === 'message_card' ? getMessageCardVariantLabel(state.selectedMessageCardVariant) : 'การ์ดข้อความ'}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <div className="ribbon-variant-menu">
                      {MESSAGE_CARD_VARIANTS.map(option => (
                        <button
                          key={option.id}
                          type="button"
                          className={`color-name ribbon-variant-option ${state.selectedMessageCardVariant === option.id ? 'selected' : ''}`}
                          onClick={() => handleMessageCardVariantSelect(option.id)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--rose-gold)', background: 'rgba(201,149,107,0.1)', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>+5 ฿</span>
                </div>

                <div
                  className={`color-card decor-card ${state.selectedStick ? 'selected' : ''}`}
                  onClick={handleStickSelect}
                >
                  <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                    <img src="/images/Glitter Rose/ก้านเสียบ.png" alt="ก้านเสียบ" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                  </div>
                  <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem', marginBottom: '4px' }}>ก้านเสียบ</span>
                  <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--rose-gold)', background: 'rgba(201,149,107,0.1)', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>+5 ฿</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
              <textarea
                id="ipt-note"
                placeholder="เช่น ขอการ์ดวันเกิด เขียนว่า..."
                value={state.additionalNote}
                onChange={e => updateField('additionalNote', e.target.value)}
                style={{ fontSize: '16px' }}
              />
              <GreetingCardAI onSelect={(text) => updateField('additionalNote', text)} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="sticky-bottom" id="sticky-bottom">
        <div className="sticky-price">
          <span id="sticky-price-val">{totalPrice.toLocaleString()}</span>
          <small>บาท</small>
        </div>
        <div className="sticky-btn-row">
          <button className="sticky-next" onClick={finishOrder} style={{ width: '100%' }}>
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>
    </>
  );
}

// Wrapper with Toast provider
export default function VelvetWire() {
  return (
    <ToastProvider>
      <VelvetWireContent />
    </ToastProvider>
  );
}

// Utility function
function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
