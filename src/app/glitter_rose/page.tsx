'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePresetProduct } from '@/hooks/usePresetProduct';
import { ToastProvider, useToast } from '@/components/Toast';
import dynamic from 'next/dynamic';

const DateTimePicker = dynamic(() => import('@/components/DateTimePicker'), { ssr: false });

// ===== Constants =====
const ROSE_PRICES = [
  { qty: 1, price: 79 },
  { qty: 3, price: 159 },
  { qty: 5, price: 189 },
  { qty: 7, price: 259 },
  { qty: 10, price: 299 },
  { qty: 12, price: 329 },
  { qty: 14, price: 359 },
  { qty: 20, price: 529 },
  { qty: 30, price: 739 },
  { qty: 40, price: 899 },
  { qty: 50, price: 1000 },
];

const ROSE_COLORS = [
  { id: 'red', name: 'แดง', img: '/images/Glitter Rose/ริบบิ้นแดง.jpg' },
  { id: 'pink', name: 'ชมพู', img: '/images/Glitter Rose/ริบบิ้นชมพู.jpg' },
  { id: 'blue', name: 'น้ำเงิน', img: '/images/Glitter Rose/ริบบิ้นน้ำเงิน.jpg' },
  { id: 'white', name: 'ขาว', img: '/images/Glitter Rose/ริบบิ้นขาว.jpg' },
  { id: 'sky', name: 'ฟ้า', img: '/images/Glitter Rose/ริบบิ้นฟ้า.jpg' },
  { id: 'purple', name: 'ม่วง', img: '/images/Glitter Rose/ริบบิ้นม่วง.jpg' },
];

const ROSE_LAYERS = [
  { id: 'ramy_white', name: 'รามี่ขาว', img: '/images/Glitter Rose/รามี่ขาว.jpg' },
  { id: 'pearl_net_white', name: 'ตาข่ายมุกขาว', img: '/images/Glitter Rose/ตาข่ายขอบมุกขาว.jpg' },
  { id: 'sa_paper_white', name: 'กระดาษสาขาว', img: '/images/Glitter Rose/กระดาษสาขาว.jpg' },
  { id: 'ramy_black', name: 'รามี่ดำ', img: '/images/Glitter Rose/รามี่ดำ.jpg' },
  { id: 'pearl_net_black', name: 'ตาข่ายมุกดำ', img: '/images/Glitter Rose/ตาข่ายขอบมุกดำ.jpg' },
  { id: 'sa_paper_black', name: 'กระดาษสาดำ', img: '/images/Glitter Rose/กระดาษสาดำ.jpg' },
];

const ROSE_PAPERS = [
  { id: 'white_solid', name: 'ขาวทึบ', img: '/images/Glitter Rose/ขาวทึบ.jpg' },
  { id: 'white_clear', name: 'ขาวใส', img: '/images/Glitter Rose/ขาวใส.jpg' },
  { id: 'white_gold', name: 'ขาวขอบทอง', img: '/images/Glitter Rose/ขาวขอบทอง.jpg' },
  { id: 'black_solid', name: 'ดำทึบ', img: '/images/Glitter Rose/ดำทึบ.jpg' },
  { id: 'black_gold', name: 'ดำขอบทอง', img: '/images/Glitter Rose/ดำขอบทอง.jpg' },
];

interface ShapeOption {
  id: string;
  name: string;
  price: number;
  img?: string;
}

const ROSE_SHAPES: ShapeOption[] = [
  { id: 'triangle', name: 'สามเหลี่ยม', price: 0 },
  { id: 'rectangle', name: 'สี่เหลี่ยม', price: 0 },
  { id: 'open_front', name: 'เปิดหน้า', price: 0 },
  { id: 'bouquet_triangle', name: 'ช่อฟูสามเหลี่ยม', price: 25 },
  { id: 'bouquet_rectangle', name: 'ช่อฟูสี่เหลี่ยม', price: 25 },
];

const ROSE_DECORATIONS = [
  { id: 'ribbon_jfy_clear', name: 'โบว์คาดช่อ JUST FOR YOU สีขาวโปร่ง', price: 15, img: '/images/Glitter Rose/โบว์คาดช่อ JUST FOR YOU สีขาวโปร่ง.jpg' },
  { id: 'ribbon_jfy_solid', name: 'โบว์คาดช่อ Just For You สีขาวทึบ', price: 15, img: '/images/Glitter Rose/โบว์คาดช่อ Just For You สีขาวทึบ.jpg' },
  { id: 'ribbon_hbd_clear', name: 'โบว์คาดช่อ HAPPY BIRTHDAY สีดำโปร่ง', price: 15, img: '/images/Glitter Rose/โบว์คาดช่อ HAPPY BIRTHDAY สีดำโปร่ง.png' },
  { id: 'butterfly', name: 'ผีเสื้อ', price: 0, img: '/images/Glitter Rose/ผีเสื้อ.jpg' },
  { id: 'blank_card', name: 'การ์ดเปล่า', price: 0, img: '/images/Glitter Rose/การ์ดเปล่า.png' },
  { id: 'stick', name: 'ก้านเสียบ', price: 5, img: '/images/Glitter Rose/ก้านเสียบ.png' },
  { id: 'fairy_light', name: 'ไฟ', price: 15, img: '/images/Glitter Rose/ไฟ.jpg' },
  { id: 'crown', name: 'มงกุฎ', price: 15, img: '/images/Glitter Rose/มงกุฏ.jpg' },
];

const STEPS = [
  { name: 'Rose', icon: '🌹', text: 'เลือกจำนวนดอกกุหลาบ' },
  { name: 'Secondary Layer', icon: '🌿', text: 'เลือกดอกไม้ประกอบ' },
  { name: 'Paper', icon: '📜', text: 'เลือกกระดาษห่อ' },
  { name: 'Decorations', icon: '✨', text: 'เลือกการตกแต่ง' },
  { name: 'Address', icon: '📍', text: 'ที่อยู่สำหรับจัดส่ง' },
];

const STORAGE_KEY = 'bear_flower_v1';
const CART_KEY = 'bear_flower_cart';

// ===== Helpers =====
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getMinDeliveryStr(qty: number | null) {
  const d = new Date();
  let offset = 1;
  if (qty && qty >= 40) offset = 3;
  else if (qty && qty >= 30) offset = 2;
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getLayerExtraPrice(qty: number | null) {
  const q = qty || 0;
  if (q <= 3) return 0;
  if (q <= 10) return 10;
  if (q <= 20) return 15;
  return 20; // 30-50
}

interface GlitterState {
  current: number;
  maxStepReached: number;
  selectedQty: number | null;
  selectedColors: string[];
  selectedLayers: string[];
  selectedPaper: string | null;
  selectedShape: string | null;
  selectedDecorations: string[];
  basePrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  additionalNote: string;
}

const initialState: GlitterState = {
  current: 0,
  maxStepReached: 0,
  selectedQty: null,
  selectedColors: [],
  selectedLayers: [],
  selectedPaper: null,
  selectedShape: null,
  selectedDecorations: [],
  basePrice: 0,
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  deliveryDate: '',
  deliveryTime: '',
  additionalNote: '',
};

function GlitterRoseContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { presetProduct, isLoading, error } = usePresetProduct();

  const [state, setState] = useState<GlitterState>(() => {
    if (typeof window === 'undefined') return initialState;
    const isEditMode = window.location.search.includes('edit=true');
    if (!isEditMode) {
      window.localStorage.removeItem('editing_cart_id');
      window.localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...initialState, ...JSON.parse(saved) };
    } catch (err) {
      console.error('Failed to parse saved state', err);
    }
    return initialState;
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Sync state to localStorage (and auto-update cart if editing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // Auto-update cart if editing
      const editingId = window.localStorage.getItem('editing_cart_id');
      if (editingId) {
        const cartStr = window.localStorage.getItem(CART_KEY) || '[]';
        const cart = JSON.parse(cartStr);
        const itemIndex = cart.findIndex((i: any) => i.id === editingId);
        if (itemIndex !== -1) {
          const total = calculateTotalPrice();
          const colorNames = state.selectedColors.map(c => ROSE_COLORS.find(rc => rc.id === c)?.name).join(', ');
          
          cart[itemIndex] = {
            ...cart[itemIndex],
            name: 'ช่อกุหลาบกริตเตอร์ (' + (state.selectedQty || 0) + ' ดอก)',
            price: total,
            details: 'สี: ' + colorNames,
            config: { ...state, productCoverImage: presetProduct?.coverImage || '' }
          };
          window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
      }
    } catch (e) {
      console.error('Failed to save state', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, presetProduct]);

  // Load preset product configurations if necessary
  useEffect(() => {
    if (presetProduct && !isLoading && !window.location.search.includes('edit=true')) {
      const config = presetProduct.config;
      if (config) {
        let extra = 0;
        const layerUnitPrice = getLayerExtraPrice(config.selectedQty);
        const layersCount = config.selectedLayers ? config.selectedLayers.length : 0;
        if (layersCount > 1 && layerUnitPrice > 0) {
          extra += (layersCount - 1) * layerUnitPrice;
        }
        if (config.selectedDecorations) {
          extra += config.selectedDecorations.reduce((acc: number, id: string) => {
            const item = ROSE_DECORATIONS.find(x => x.id === id);
            return acc + (item ? item.price : 0);
          }, 0);
        }

        const calculatedBasePrice = Math.max(0, (presetProduct.price || 0) - extra);
        
        setState(prev => ({
          ...prev,
          selectedQty: config.selectedQty || null,
          selectedColors: config.selectedColors || [],
          selectedLayers: config.selectedLayers || [],
          selectedPaper: config.selectedPaper || null,
          selectedShape: config.selectedShape || null,
          selectedDecorations: config.selectedDecorations || [],
          basePrice: calculatedBasePrice,
          current: 4,
          maxStepReached: 4,
        }));

        setTimeout(() => {
          document.getElementById('step5-customer')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [presetProduct, isLoading]);

  useEffect(() => {
    if (isLoading) showToast('กำลังโหลดแบบสินค้าสำเร็จรูป...');
    else if (presetProduct) {
      if (presetProduct.readyToShip && Number(presetProduct.stockQuantity || 0) <= 0) {
        showToast('สินค้าหมดชั่วคราว');
        setTimeout(() => router.push('/'), 900);
      } else {
        showToast('โหลดแบบสินค้าสำเร็จรูปเสร็จสิ้น!');
      }
    } else if (error) {
      showToast(error);
    }
  }, [presetProduct, isLoading, error, router, showToast]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('order_success_toast')) {
      sessionStorage.removeItem('order_success_toast');
      setTimeout(() => showToast('เพิ่มลงตะกร้าเรียบร้อยแล้ว!'), 300);
    }
  }, [showToast]);

  useEffect(() => {
    const minDelivery = getMinDeliveryStr(state.selectedQty);
    if (state.deliveryDate && state.deliveryDate < minDelivery) {
      setState(prev => ({ ...prev, deliveryDate: '', deliveryTime: '' }));
    }
  }, [state.selectedQty, state.deliveryDate]);

  // Derived state calculations
  const calculateTotalPrice = useCallback(() => {
    let total = state.basePrice;
    const layerUnitPrice = getLayerExtraPrice(state.selectedQty);
    if (state.selectedLayers.length > 1 && layerUnitPrice > 0) {
      total += (state.selectedLayers.length - 1) * layerUnitPrice;
    }
    total += state.selectedDecorations.reduce((acc, id) => {
      const item = ROSE_DECORATIONS.find(x => x.id === id);
      return acc + (item ? item.price : 0);
    }, 0);
    if (state.selectedShape) {
      const shapeItem = ROSE_SHAPES.find(x => x.id === state.selectedShape);
      if (shapeItem && shapeItem.price) {
        total += shapeItem.price;
      }
    }
    return total;
  }, [state]);

  const totalPrice = calculateTotalPrice();

  const updateField = (field: keyof GlitterState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const selectQty = (qty: number, price: number) => {
    setState(prev => {
      let newState = { ...prev, selectedQty: qty, basePrice: price };
      // Filter out invalid shapes if qty < 10
      if (qty < 10 && (prev.selectedShape === 'bouquet_triangle' || prev.selectedShape === 'bouquet_rectangle')) {
        newState.selectedShape = null;
      }
      return newState;
    });
    setDropdownOpen(false);
  };

  const toggleArraySelection = (field: 'selectedColors' | 'selectedLayers' | 'selectedDecorations', id: string) => {
    setState(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
    });
  };

  const selectPaper = (id: string) => {
    updateField('selectedPaper', id);
    setTimeout(() => {
      document.getElementById('shape-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  };

  const selectShape = (id: string) => {
    updateField('selectedShape', id);
  };

  const handleDateChange = (dateStr: string, timeStr: string) => {
    setState(prev => ({ ...prev, deliveryDate: dateStr, deliveryTime: timeStr }));
  };

  const jumpToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  const nextStep = () => {
    if (state.current === 0) {
      if (state.selectedQty === null || state.selectedColors.length === 0) {
        showToast(state.selectedQty === null ? 'กรุณาเลือกจำนวนดอกกุหลาบ' : 'กรุณาเลือกสีดอกกุหลาบอย่างน้อย 1 สี');
        return;
      }
    } else if (state.current === 1) {
      if (state.selectedLayers.length === 0) {
        showToast('กรุณาเลือกรองช่ออย่างน้อย 1 แบบ');
        return;
      }
    } else if (state.current === 2) {
      if (!state.selectedPaper || !state.selectedShape) {
        showToast(!state.selectedPaper ? 'กรุณาเลือกกระดาษห่อช่อดอกไม้' : 'กรุณาเลือกรูปทรงการห่อ');
        return;
      }
    } else if (state.current === 4) {
      const minDelivery = getMinDeliveryStr(state.selectedQty);
      if (!state.customerName.trim() || !state.customerPhone.trim() || !state.customerAddress.trim() || !state.deliveryDate || !state.deliveryTime) {
        showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
        return;
      }
      if (state.deliveryDate < minDelivery) {
        showToast('ต้องเลือกวันจัดส่งล่วงหน้าอย่างน้อย 2 วัน');
        return;
      }
      const tomorrowStr = getTomorrowStr();
      if (state.deliveryDate === tomorrowStr && state.deliveryTime < '09:00') {
        showToast('หากจัดส่งวันพรุ่งนี้ กรุณาเลือกเวลารับตั้งแต่ 09:00 น. เป็นต้นไป');
        return;
      }
    }

    if (state.current < STEPS.length - 1) {
      setState(prev => ({
        ...prev,
        current: prev.current + 1,
        maxStepReached: Math.max(prev.maxStepReached, prev.current + 1)
      }));
      setTimeout(jumpToTop, 0);
    } else {
      setShowReceipt(true);
    }
  };

  const prevStep = () => {
    if (state.current > 0) {
      setState(prev => ({ ...prev, current: prev.current - 1 }));
    }
  };

  const saveToCartOnly = () => {
    const editingId = window.localStorage.getItem('editing_cart_id');
    
    if (editingId) {
      window.localStorage.removeItem('editing_cart_id');
      window.localStorage.removeItem(STORAGE_KEY);
      router.push('/cart');
      return;
    }

    if (presetProduct && presetProduct.readyToShip && Number(presetProduct.stockQuantity || 0) <= 0) {
      showToast('สินค้าหมดชั่วคราว');
      return;
    }

    const total = calculateTotalPrice();
    const colorNames = state.selectedColors.map(id => ROSE_COLORS.find(x => x.id === id)?.name).join(', ');
    const customItem = {
      id: 'custom_' + Date.now(),
      type: 'glitter_rose',
      name: 'ช่อกุหลาบกริตเตอร์ (' + (state.selectedQty || 0) + ' ดอก)',
      price: total,
      qty: 1,
      details: 'สี: ' + colorNames,
      coverImage: presetProduct?.coverImage || '',
      presetId: presetProduct?.id || null,
      readyToShip: Boolean(presetProduct?.readyToShip),
      stockQuantity: Number(presetProduct?.stockQuantity || 0),
      config: {
        ...state,
        productCoverImage: presetProduct?.coverImage || ''
      }
    };

    try {
      const cart = JSON.parse(window.localStorage.getItem(CART_KEY) || '[]');
      cart.push(customItem);
      window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch(e) {
      window.localStorage.setItem(CART_KEY, JSON.stringify([customItem]));
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setShowReceipt(false);
    sessionStorage.setItem('order_success_toast', '1');
    router.push('/cart');
  };

  const getSummaryItems = () => {
    const items = [];
    if (state.selectedQty || state.selectedColors.length > 0) {
      let label = state.selectedQty ? `${state.selectedQty} ดอก` : '';
      if (state.selectedColors.length > 0) {
        const names = state.selectedColors.map(id => ROSE_COLORS.find(c => c.id === id)?.name).join(', ');
        if (label) label += ' · ';
        label += names;
      }
      items.push({ icon: '🌹', label });
    }
    if (state.selectedLayers.length > 0) {
      const names = state.selectedLayers.map(id => ROSE_LAYERS.find(c => c.id === id)?.name).join(', ');
      let label = names;
      const layerUnitPrice = getLayerExtraPrice(state.selectedQty);
      if (state.selectedLayers.length > 1 && layerUnitPrice > 0) {
        label += ` (+${(state.selectedLayers.length - 1) * layerUnitPrice} ฿)`;
      }
      items.push({ icon: '🌿', label });
    }
    if (state.selectedPaper || state.selectedShape) {
      let label = '';
      if (state.selectedPaper) label += ROSE_PAPERS.find(c => c.id === state.selectedPaper)?.name || '';
      if (state.selectedShape) {
        const sName = ROSE_SHAPES.find(c => c.id === state.selectedShape)?.name || '';
        label += (label ? ' · ' : '') + 'ทรง' + sName;
      }
      items.push({ icon: '📜', label });
    }
    if (state.selectedDecorations.length > 0) {
      const names = state.selectedDecorations.map(id => ROSE_DECORATIONS.find(c => c.id === id)?.name).join(', ');
      const totalExtra = state.selectedDecorations.reduce((acc, id) => {
        const item = ROSE_DECORATIONS.find(c => c.id === id);
        return acc + (item ? item.price : 0);
      }, 0);
      let label = names;
      if (totalExtra > 0) label += ` (+${totalExtra} ฿)`;
      items.push({ icon: '✨', label });
    }
    return items;
  };

  const availableShapes = state.selectedQty && state.selectedQty < 10 
    ? ROSE_SHAPES.filter(c => c.id !== 'bouquet_triangle' && c.id !== 'bouquet_rectangle') 
    : ROSE_SHAPES;

  const minDelivery = getMinDeliveryStr(state.selectedQty);
  const tomorrowStr = getTomorrowStr();
  const initialMinTime = state.deliveryDate === tomorrowStr ? '09:00' : '00:00';

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={() => window.history.length > 1 ? router.back() : router.push('/')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <a href="/" className="nav-logo" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
            &quot;Bear has flower&quot;
          </a>
        </div>
      </nav>

      <div className="page-wrap">
        <div className="page-heading">
          <h1>&quot;Glitter Rose&quot;</h1>
          <p className="subtitle">ออกแบบดอกกุหลาบกลิตเตอร์ของคุณ</p>
        </div>

        {/* Stepper */}
        <div className="stepper-outer">
          <div className="stepper-container" id="stepper">
            <div className="stepper-line"></div>
            {STEPS.map((step, i) => (
              <div 
                key={i} 
                className={`step ${i === state.current ? 'active' : ''} ${i < state.current || (i < state.maxStepReached && i !== state.current) ? 'done' : ''}`}
                onClick={() => {
                  if (i <= state.maxStepReached && i !== state.current) updateField('current', i);
                }}
              >
                <div className="step-circle">{i + 1}</div>
                <span className="step-label">{step.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary" id="order-summary">
          <span className="summary-label">🛒 สินค้าที่เลือก</span>
          <div className="summary-chips" id="summary-chips">
            {getSummaryItems().length === 0 ? (
              <span className="summary-empty">ยังไม่ได้เลือกสินค้า...</span>
            ) : (
              getSummaryItems().map((item, idx) => (
                <span key={idx} className="summary-chip">
                  <span className="chip-icon">{item.icon}</span>
                  {item.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Selection Bar (Desktop/iPad) */}
        <div className="selection-bar">
          <div className="bar-step-info">
            ราคา: <strong id="desktop-price-val" style={{ color: 'var(--rose-gold)', fontSize: '1.4rem' }}>{totalPrice.toLocaleString()}</strong> บาท
          </div>
          <div className="btn-group">
            <button className="btn-back" style={{ visibility: state.current === 0 ? 'hidden' : 'visible' }} onClick={prevStep}>ก่อนหน้า</button>
            <button className="btn-next" onClick={nextStep}>
              {state.current === STEPS.length - 1 ? 'สั่งซื้อ' : 'ถัดไป'}
            </button>
          </div>
        </div>

        {/* Main Box Area */}
        <div className="main-box" id="main-box" style={{ justifyContent: 'flex-start' }}>
          
          {/* STEP 1: Rose */}
          {state.current === 0 && (
            <>
              <div className="qty-header">
                <h3>🌹 เลือกจำนวนดอกกุหลาบ</h3>
                <p>กรุณาเลือกจำนวนที่ต้องการ</p>
              </div>

              <div className={`custom-dropdown ${dropdownOpen ? 'open' : ''}`} id="qty-dropdown">
                <div className="dropdown-header" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <span>
                    {state.selectedQty ? (
                      <span style={{ color: 'var(--deep-brown)' }}><b>{state.selectedQty} ดอก</b> &nbsp;—&nbsp; {state.basePrice.toLocaleString()} บาท</span>
                    ) : 'ระบุจำนวนที่ท่านต้องการ'}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
                <div className="dropdown-list">
                  {ROSE_PRICES.map(item => (
                    <div 
                      key={item.qty} 
                      className={`dropdown-item ${state.selectedQty === item.qty ? 'selected' : ''}`}
                      onClick={() => selectQty(item.qty, item.price)}
                    >
                      <span>{item.qty} ดอก</span>
                      <span className="dropdown-price">{item.price.toLocaleString()} ฿</span>
                    </div>
                  ))}
                </div>
              </div>

              <div id="qty-warning" style={{ marginTop: '12px', fontSize: '0.8rem', color: '#e53935', fontWeight: 600, display: (state.selectedQty === 40 || state.selectedQty === 50) ? 'block' : 'none' }}>
                * ต้องสั่งล่วงหน้าอย่างน้อย 3 วัน (เนื่องจากดอกไม้มีจำนวน {state.selectedQty} ดอก)
              </div>

              <div style={{ width: '100%', borderTop: '1px dashed var(--glass-border)', margin: '32px 0 12px' }}></div>

              <div className="qty-header">
                <h3>🎨 เลือกสีดอกกุหลาบ</h3>
                <p>สามารถเลือกได้มากกว่า 1 สี</p>
              </div>
              <div className="color-grid" id="color-grid">
                {ROSE_COLORS.map(c => (
                  <div 
                    key={c.id} 
                    className={`color-card ${state.selectedColors.includes(c.id) ? 'selected' : ''}`} 
                    onClick={() => toggleArraySelection('selectedColors', c.id)}
                  >
                    <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                    </div>
                    <span className="color-name">{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 2: Secondary Layer */}
          {state.current === 1 && (() => {
            const layerPrice = getLayerExtraPrice(state.selectedQty);
            const priceNote = layerPrice === 0 ? 'เลือกฟรีทั้งหมด (ไม่มีค่าใช้จ่ายเพิ่ม)' : `เลือกฟรี 1 อัน (ชิ้นถัดไป +${layerPrice} บาท/อัน)`;
            return (
              <>
                <div className="qty-header">
                  <h3>🌿 เลือกรองช่อ</h3>
                  <p>{priceNote}</p>
                </div>
                <div className="color-grid" id="layer-grid" style={{ marginTop: '20px' }}>
                  {ROSE_LAYERS.map(c => (
                    <div 
                      key={c.id} 
                      className={`color-card ${state.selectedLayers.includes(c.id) ? 'selected' : ''}`} 
                      onClick={() => toggleArraySelection('selectedLayers', c.id)}
                    >
                      <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                        {c.img && <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
                      </div>
                      <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem' }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}

          {/* STEP 3: Paper and Shape */}
          {state.current === 2 && (
            <>
              <div className="qty-header">
                <h3>📜 เลือกกระดาษห่อ</h3>
                <p>เลือกรูปแบบกระดาษห่อให้ช่อดอกไม้ของคุณ</p>
              </div>
              <div className="color-grid" id="paper-grid" style={{ marginTop: '20px' }}>
                {ROSE_PAPERS.map(c => (
                  <div 
                    key={c.id} 
                    className={`color-card ${state.selectedPaper === c.id ? 'selected' : ''}`} 
                    onClick={() => selectPaper(c.id)}
                  >
                    <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                      {c.img && <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
                    </div>
                    <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem' }}>{c.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ width: '100%', borderTop: '1px dashed var(--glass-border)', margin: '32px 0 12px' }}></div>

              <div className="qty-header" id="shape-section">
                <h3>📦 เลือกรูปทรงห่อ</h3>
                <p>เลือกรูปทรงในการห่อช่อดอกไม้</p>
              </div>
              <div className="color-grid" id="shape-grid" style={{ marginTop: '20px' }}>
                {availableShapes.map(c => (
                  <div 
                    key={c.id} 
                    className={`color-card ${state.selectedShape === c.id ? 'selected' : ''}`} 
                    onClick={() => selectShape(c.id)}
                  >
                    <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                      {c.img && <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
                    </div>
                    <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem', marginBottom: '4px' }}>{c.name}</span>
                    {c.price > 0 && <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--rose-gold)', background: 'rgba(201,149,107,0.1)', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>+{c.price} ฿</span>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 4: Decorations */}
          {state.current === 3 && (() => {
            const freeDecors = ROSE_DECORATIONS.filter(c => c.price === 0);
            const paidDecors = ROSE_DECORATIONS.filter(c => c.price > 0);
            return (
              <>
                <div className="qty-header">
                  <h3>✨ เลือกการตกแต่ง</h3>
                  <p>เพิ่มความสวยงามให้ช่อดอกไม้ของคุณ (เลือกได้หลายแบบ หรือไม่รับก็ได้)</p>
                </div>
                
                <div style={{ marginTop: '20px', textAlign: 'left', width: '100%' }}>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--deep-brown)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    อุปกรณ์ตกแต่งฟรี
                  </div>
                  <div className="color-grid" id="decor-free-grid">
                    {freeDecors.map(c => (
                      <div 
                        key={c.id} 
                        className={`color-card ${state.selectedDecorations.includes(c.id) ? 'selected' : ''}`} 
                        onClick={() => toggleArraySelection('selectedDecorations', c.id)}
                      >
                        <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                          {c.img && <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
                        </div>
                        <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem', marginBottom: '4px' }}>{c.name}</span>
                        <span style={{ fontSize: '.7rem', fontWeight: 700, color: '#4caf50', background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>ฟรี</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ width: '100%', borderTop: '1px dashed var(--glass-border)', margin: '30px 0 20px' }}></div>

                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--deep-brown)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>เพิ่มเติม (มีค่าบริการ)
                  </div>
                  <div className="color-grid" id="decor-paid-grid">
                    {paidDecors.map(c => (
                      <div 
                        key={c.id} 
                        className={`color-card ${state.selectedDecorations.includes(c.id) ? 'selected' : ''}`} 
                        onClick={() => toggleArraySelection('selectedDecorations', c.id)}
                      >
                        <div className="color-swatch" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--warm-white)', border: '1px solid var(--glass-border)' }}>
                          {c.img && <img src={c.img} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />}
                        </div>
                        <span className="color-name" style={{ textTransform: 'none', fontSize: '.8rem', marginBottom: '4px' }}>{c.name}</span>
                        <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--rose-gold)', background: 'rgba(201,149,107,0.1)', padding: '2px 10px', borderRadius: '12px', letterSpacing: '.02em' }}>+{c.price} ฿</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {/* STEP 5: Address */}
          {state.current === 4 && (
            <div id="step5-customer">
              <div className="qty-header">
                <h3>📍 ข้อมูลการจัดส่ง</h3>
                <p>กรอกข้อมูลสำหรับการจัดส่งดอกไม้</p>
              </div>
              
              <div style={{ width: '100%', marginTop: '20px' }}>
                <div className="form-group">
                  <label>ชื่อผู้รับ</label>
                  <input type="text" id="ipt-name" placeholder="ชื่อเล่นหรือนามแฝง" value={state.customerName} onChange={e => updateField('customerName', e.target.value)} style={{ fontSize: '16px' }} />
                </div>
                
                <div className="form-group">
                  <label>เบอร์โทรติดต่อ</label>
                  <input type="tel" id="ipt-phone" placeholder="06X-XXX-XXXX" value={state.customerPhone} onChange={e => updateField('customerPhone', e.target.value)} style={{ fontSize: '16px' }} />
                </div>
                
                <div className="form-group">
                  <label>ที่อยู่จัดส่ง</label>
                  <textarea id="ipt-address" placeholder="ชื่อหอ.." value={state.customerAddress} onChange={e => updateField('customerAddress', e.target.value)} style={{ fontSize: '16px' }}></textarea>
                  <div className="form-note">ส่งฟรีบริเวณกำแพงแสน</div>
                </div>
                
                <div className="form-group">
                  <label>วันที่และเวลาที่ต้องการรับสินค้า</label>
                  <DateTimePicker
                    id="ipt-date"
                    placeholder="เลือกวันที่และเวลาจัดส่ง"
                    value={state.deliveryDate && state.deliveryTime ? `${state.deliveryDate} ${state.deliveryTime}` : undefined}
                    minDate={minDelivery}
                    minTime={initialMinTime}
                    onChange={handleDateChange}
                    style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '12px', color: 'var(--text-color)', fontSize: '16px' }}
                  />
                  <span id="delivery-warning" style={{ fontSize: '.75rem', color: 'red', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
                    {presetProduct?.readyToShip ? '' : (
                      state.selectedQty && state.selectedQty >= 30 
                        ? `* ต้องสั่งล่วงหน้าอย่างน้อย ${state.selectedQty >= 40 ? '3' : '2'} วัน (เนื่องจากดอกไม้มีจำนวน ${state.selectedQty} ดอก)` 
                        : '* กรุณาสั่งล่วงหน้าอย่างน้อย 1 วัน'
                    )}
                  </span>
                </div>
                
                <div className="form-group">
                  <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
                  <textarea id="ipt-note" placeholder="เช่น ข้อความฝากเขียนการ์ด..." value={state.additionalNote} onChange={e => updateField('additionalNote', e.target.value)} style={{ fontSize: '16px' }}></textarea>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      <div className="sticky-bottom" id="sticky-bottom">
        <div className="sticky-price">
          <span id="sticky-price-val">{totalPrice.toLocaleString()}</span><small>บาท</small>
        </div>
        <div className="sticky-btn-row">
          <button className="sticky-prev" style={{ visibility: state.current === 0 ? 'hidden' : 'visible' }} onClick={prevStep}>←</button>
          <button className="sticky-next" onClick={nextStep}>
            {state.current === STEPS.length - 1 ? 'สั่งซื้อ' : 'ถัดไป'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="receipt-modal show" id="receipt-modal" style={{ display: 'block' }}>
          <div className="drawer-backdrop" onClick={() => setShowReceipt(false)}></div>
          <div className="receipt-card" id="receipt-card">
            <div className="receipt-header">
              <h2>Glitter Rose</h2>
              <p>ออเดอร์ #GR{String(Math.floor(Math.random() * 899999 + 100000))}</p>
            </div>
            
            <div className="r-row bold" style={{ marginTop: 0 }}>
              <span>กุหลาบ {state.selectedQty} ดอก</span><span>{state.basePrice.toLocaleString()} ฿</span>
            </div>
            <div className="r-row" style={{ color: 'var(--text-muted)' }}>
              <span>สี: {state.selectedColors.map(id => ROSE_COLORS.find(x => x.id === id)?.name).join(', ')}</span><span></span>
            </div>
            
            <div className="r-row bold">
              <span>รองช่อ</span>
              <span>
                {(() => {
                  const layerUnitPrice = getLayerExtraPrice(state.selectedQty);
                  const extra = state.selectedLayers.length > 1 && layerUnitPrice > 0 ? (state.selectedLayers.length - 1) * layerUnitPrice : 0;
                  return extra > 0 ? `+${extra.toLocaleString()} ฿` : 'ฟรี';
                })()}
              </span>
            </div>
            <div className="r-row" style={{ color: 'var(--text-muted)' }}>
              <span>{state.selectedLayers.map(id => ROSE_LAYERS.find(x => x.id === id)?.name).join(', ') || '-'}</span><span></span>
            </div>

            <div className="r-row bold">
              <span>กระดาษและทรงห่อ</span>
              <span>
                {(() => {
                  const shapePrice = ROSE_SHAPES.find(x => x.id === state.selectedShape)?.price || 0;
                  return shapePrice > 0 ? `+${shapePrice.toLocaleString()} ฿` : 'ฟรี';
                })()}
              </span>
            </div>
            <div className="r-row" style={{ color: 'var(--text-muted)' }}>
              <span>{(ROSE_PAPERS.find(x => x.id === state.selectedPaper)?.name || '-') + ' · ทรง' + (ROSE_SHAPES.find(x => x.id === state.selectedShape)?.name || '-')}</span><span></span>
            </div>

            <div className="r-row bold">
              <span>ของตกแต่ง</span>
              <span>
                {(() => {
                  const extra = state.selectedDecorations.reduce((acc, id) => {
                    const item = ROSE_DECORATIONS.find(x => x.id === id);
                    return acc + (item ? item.price : 0);
                  }, 0);
                  return extra > 0 ? `+${extra.toLocaleString()} ฿` : (state.selectedDecorations.length > 0 ? 'ฟรี' : '-');
                })()}
              </span>
            </div>
            <div className="r-row" style={{ color: 'var(--text-muted)' }}>
              <span>{state.selectedDecorations.length > 0 ? state.selectedDecorations.map(id => ROSE_DECORATIONS.find(x => x.id === id)?.name).join(', ') : '-'}</span><span></span>
            </div>

            <div className="r-row total">
              <span>ยอดชำระสุทธิ</span><span>{totalPrice.toLocaleString()} ฿</span>
            </div>

            <div className="r-info">
              <div style={{ marginBottom: '6px' }}><b>ผู้รับ:</b> {state.customerName}</div>
              <div style={{ marginBottom: '6px' }}><b>ที่อยู่จัดส่ง:</b> {state.customerAddress}</div>
              <div style={{ marginBottom: '6px' }}><b>จัดส่ง:</b> {state.deliveryDate} เวลา {state.deliveryTime} น.</div>
              {state.additionalNote && <div style={{ marginTop: '10px', borderTop: '1px dashed #ddd', paddingTop: '10px' }}><i>หมายเหตุ: {state.additionalNote}</i></div>}
            </div>

            <button className="btn-receipt" onClick={saveToCartOnly}>บันทึกลงตะกร้า</button>
          </div>
        </div>
      )}
    </>
  );
}

// Wrapper with Toast provider
export default function GlitterRose() {
  return (
    <ToastProvider>
      <GlitterRoseContent />
    </ToastProvider>
  );
}
