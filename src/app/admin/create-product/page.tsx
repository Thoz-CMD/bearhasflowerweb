'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { checkIsAdmin } from '@/lib/admin';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDocs, orderBy, query } from 'firebase/firestore';

export default function CreateProductPage() {
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'select' | 'form' | 'manage'>('select');
  const [manageProducts, setManageProducts] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

  const EDIT_KEY = 'bear_flower_edit_product';
  const EDIT_ID_KEY = 'bear_flower_edit_product_id';

  // Auth & Admin check
  useEffect(() => {
    // Beautiful alerts/confirms initialization (similar to other admin pages)
    if (typeof window !== 'undefined') {
      (window as any).showBeautifulAlert = function (message: string, type: string = 'info', title: string = 'แจ้งเตือน') {
        return new Promise((resolve) => {
          const existing = document.getElementById('beautiful-alert-overlay');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'beautiful-alert-overlay';
          overlay.className = 'beautiful-alert-overlay';

          let icon = '🌸';
          if (type === 'success') icon = '✅';
          if (type === 'error') icon = '❌';
          if (type === 'warning') icon = '⚠️';

          overlay.innerHTML = `
            <div class="beautiful-alert-modal">
              <div class="beautiful-alert-icon ${type}">${icon}</div>
              <h3 class="beautiful-alert-title">${title}</h3>
              <p class="beautiful-alert-message">${message}</p>
              <div class="beautiful-alert-buttons">
                <button class="beautiful-alert-btn confirm-btn">ตกลง</button>
              </div>
            </div>
          `;

          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';

          setTimeout(() => overlay.classList.add('active'), 10);

          const closeAlert = () => {
            overlay.classList.remove('active');
            overlay.classList.add('closing');
            document.body.style.overflow = '';
            setTimeout(() => {
              overlay.remove();
              resolve(true);
            }, 300);
          };

          overlay.querySelector('.confirm-btn')?.addEventListener('click', closeAlert);
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAlert();
          });
        });
      };

      (window as any).showBeautifulConfirm = function (message: string, title: string = 'ยืนยัน') {
        return new Promise((resolve) => {
          const existing = document.getElementById('beautiful-alert-overlay');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'beautiful-alert-overlay';
          overlay.className = 'beautiful-alert-overlay';

          overlay.innerHTML = `
            <div class="beautiful-alert-modal">
              <div class="beautiful-alert-icon warning">❓</div>
              <h3 class="beautiful-alert-title">${title}</h3>
              <p class="beautiful-alert-message">${message}</p>
              <div class="beautiful-alert-buttons confirm-layout">
                <button class="beautiful-alert-btn cancel-btn">ยกเลิก</button>
                <button class="beautiful-alert-btn confirm-btn">ตกลง</button>
              </div>
            </div>
          `;

          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';

          setTimeout(() => overlay.classList.add('active'), 10);

          const closeConfirm = (confirmed: boolean) => {
            overlay.classList.remove('active');
            overlay.classList.add('closing');
            document.body.style.overflow = '';
            setTimeout(() => {
              overlay.remove();
              resolve(confirmed);
            }, 300);
          };

          overlay.querySelector('.confirm-btn')?.addEventListener('click', () => closeConfirm(true));
          overlay.querySelector('.cancel-btn')?.addEventListener('click', () => closeConfirm(false));
          overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeConfirm(false);
          });
        });
      };
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const hasAdmin = await checkIsAdmin(currentUser.uid, currentUser.displayName);
        setIsAdminUser(hasAdmin);
      } else {
        setUser(null);
        setIsAdminUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || isAdminUser !== true) return;
    const params = new URLSearchParams(window.location.search);
    const isManageQuery = params.get('manage') === 'true';
    const isEditQuery = params.get('edit') === 'true';
    const editRaw = sessionStorage.getItem(EDIT_KEY);
    const editId = sessionStorage.getItem(EDIT_ID_KEY);

    if (isManageQuery) {
      setViewMode('manage');
      return;
    }

    if (editRaw || editId || isEditQuery) {
      if (selectedType !== 'glitter_rose') {
        setSelectedType('glitter_rose');
      }
      setViewMode('form');
    }
  }, [isAdminUser, selectedType]);

  useEffect(() => {
    if (isAdminUser !== true || viewMode !== 'manage') return;
    let active = true;
    setManageLoading(true);

    (async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const items: any[] = [];
        snap.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (active) setManageProducts(items);
      } catch (e) {
        console.error('Failed to load products:', e);
      } finally {
        if (active) setManageLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdminUser, viewMode]);

  // Main interactive logic is loaded when option is selected
  useEffect(() => {
    if (isAdminUser !== true || selectedType !== 'glitter_rose' || viewMode !== 'form') return;

    const script = document.createElement('script');
    script.innerHTML = `
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

      const ROSE_SHAPES = [
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

      const steps = [
        { name: 'Rose', icon: '🌹', text: 'เลือกจำนวนดอกกุหลาบ' },
        { name: 'Secondary Layer', icon: '🌿', text: 'เลือกดอกไม้ประกอบ' },
        { name: 'Paper', icon: '📜', text: 'เลือกกระดาษห่อ' },
        { name: 'Decorations', icon: '✨', text: 'เลือกการตกแต่ง' },
        { name: 'Product Settings', icon: '🛍️', text: 'ข้อมูลและการแสดงผลสินค้า' },
      ];

      let current = 0;
      let selectedQty = null;  
      let selectedColors = [];   
      let selectedLayers = [];   
      let selectedPaper = null; 
      let selectedShape = null; 
      let selectedDecorations = []; 
      let basePrice = 0;     
      let maxStepReached = 0; 

      // Product fields
      let productName = '';
      let productDesc = '';
      let productBadge = '';
      let productPrice = '';
      let productCoverImage = ''; // Base64 data URL

      let editingProductId = null;
      const EDIT_KEY = 'bear_flower_edit_product';
      const EDIT_ID_KEY = 'bear_flower_edit_product_id';

      const STORAGE_KEY = 'bear_flower_create_prod_v1';

      function calculateTotalPrice() {
        let total = basePrice;
        const layerUnitPrice = getLayerExtraPrice();
        if (selectedLayers.length > 1 && layerUnitPrice > 0) {
          total += (selectedLayers.length - 1) * layerUnitPrice;
        }
        total += selectedDecorations.reduce((acc, id) => {
          const item = ROSE_DECORATIONS.find(x => x.id === id);
          return acc + (item ? item.price : 0);
        }, 0);
        if (selectedShape) {
          const shapeItem = ROSE_SHAPES.find(x => x.id === selectedShape);
          if (shapeItem && shapeItem.price) {
            total += shapeItem.price;
          }
        }
        return total;
      }

      function saveState() {
        const state = {
          current, maxStepReached, selectedQty, selectedColors, selectedLayers, selectedPaper,
          selectedShape, selectedDecorations, basePrice,
          productName, productDesc, productBadge, productPrice, productCoverImage
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      function loadState() {
        const editRaw = sessionStorage.getItem(EDIT_KEY);
        if (editRaw) {
          try {
            const p = JSON.parse(editRaw);
            editingProductId = p.id || null;
            if (editingProductId) {
              sessionStorage.setItem(EDIT_ID_KEY, editingProductId);
            }
            productName = p.name || '';
            productDesc = p.description || '';
            productBadge = p.badge || '';
            productPrice = p.price !== undefined ? String(p.price) : '';
            productCoverImage = p.coverImage || '';

            const cfg = p.config || {};
            selectedQty = cfg.selectedQty || null;
            selectedColors = cfg.selectedColors || [];
            selectedLayers = cfg.selectedLayers || [];
            selectedPaper = cfg.selectedPaper || null;
            selectedShape = cfg.selectedShape || null;
            selectedDecorations = cfg.selectedDecorations || [];
            basePrice = cfg.basePrice || 0;
            current = 0;
            maxStepReached = 4;
            saveState();
          } catch (err) {
            console.error('Failed to parse edit product', err);
          }
          sessionStorage.removeItem(EDIT_KEY);
        } else {
          const storedEditId = sessionStorage.getItem(EDIT_ID_KEY);
          if (storedEditId) editingProductId = storedEditId;
        }

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const s = JSON.parse(saved);
            current = s.current || 0;
            maxStepReached = s.maxStepReached || 0;
            selectedQty = s.selectedQty || null;
            selectedColors = s.selectedColors || [];
            selectedLayers = s.selectedLayers || [];
            selectedPaper = s.selectedPaper || null;
            selectedShape = s.selectedShape || null;
            selectedDecorations = s.selectedDecorations || [];
            basePrice = s.basePrice || 0;
            productName = s.productName || '';
            productDesc = s.productDesc || '';
            productBadge = s.productBadge || '';
            productPrice = s.productPrice || '';
            productCoverImage = s.productCoverImage || '';
          } catch (err) { console.error('Failed to parse saved state', err); }
        } else {
          resetForm();
        }
        updateTotalPrice();
        updateStep1Summary();
        updateStep2Summary();
        updateStep3Summary();
        updateStep4Summary();
        updateUI();
      }

      function resetForm() {
        current = 0;
        maxStepReached = 0;
        selectedQty = null;
        selectedColors = [];
        selectedLayers = [];
        selectedPaper = null;
        selectedShape = null;
        selectedDecorations = [];
        basePrice = 0;
        productName = '';
        productDesc = '';
        productBadge = '';
        productPrice = '';
        productCoverImage = '';
        editingProductId = null;
        sessionStorage.removeItem(EDIT_ID_KEY);
        sessionStorage.removeItem(EDIT_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }

      window.resetProductCreatorForm = function() {
        window.showBeautifulConfirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลเพื่อเริ่มระบุใหม่ทั้งหมด?', 'ยืนยันการล้างข้อมูล').then(ok => {
          if (ok) {
            resetForm();
            loadState();
          }
        });
      };

      const stepEls = document.querySelectorAll('.step');
      const stepNum = document.getElementById('step-num');
      const stepName = document.getElementById('step-name');
      const mainBox = document.getElementById('main-box');
      const btnPrev = document.getElementById('btn-prev-step');
      const stickyPrev = document.getElementById('sticky-prev-btn');
      const stickyNext = document.getElementById('sticky-next-btn');

      const orderItems = {};

      function getLayerExtraPrice() {
        const qty = selectedQty || 0;
        if (qty <= 3) return 0;
        if (qty <= 10) return 10;
        if (qty <= 20) return 15;
        return 20; 
      }

      function updateTotalPrice() {
        let total = calculateTotalPrice();
        const sv = document.getElementById('sticky-price-val');
        if (sv) sv.textContent = total.toLocaleString();
        const dv = document.getElementById('desktop-price-val');
        if (dv) dv.textContent = total.toLocaleString();
        
        const calcPriceEl = document.getElementById('calculated-price-display');
        if (calcPriceEl) calcPriceEl.textContent = total.toLocaleString();
      }

      function updateSummary() {
        const container = document.getElementById('summary-chips');
        if (!container) return;
        const keys = Object.keys(orderItems);
        if (keys.length === 0) {
          container.innerHTML = '<span class="summary-empty">ยังไม่ได้เลือกองค์ประกอบสินค้า...</span>';
          return;
        }
        container.innerHTML = keys.map(k => {
          const it = orderItems[k];
          return \`<span class="summary-chip">
            <span class="chip-icon">\${it.icon}</span>
            \${it.label}
          </span>\`;
        }).join('');
      }

      function renderStep1() {
        mainBox.style.justifyContent = 'flex-start';
        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>🌹 เลือกจำนวนดอกกุหลาบ</h3>
            <p>กรุณาเลือกจำนวนที่ต้องการ</p>
          </div>
          
          <div class="custom-dropdown" id="qty-dropdown">
            <div class="dropdown-header" onclick="toggleDropdown(event)">
              <span id="dropdown-label">\${selectedQty
            ? \`<span style="color:var(--deep-brown)"><b>\${selectedQty} ดอก</b> &nbsp;—&nbsp; \${basePrice.toLocaleString()} บาท</span>\`
            : 'ระบุจำนวนที่ท่านต้องการ'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div class="dropdown-list">
              \${ROSE_PRICES.map(item => \`
                <div class="dropdown-item\${selectedQty === item.qty ? ' selected' : ''}"
                    data-qty="\${item.qty}"
                    onclick="selectQty(\${item.qty}, \${item.price})">
                  <span>\${item.qty} ดอก</span>
                  <span class="dropdown-price">\${item.price.toLocaleString()} ฿</span>
                </div>
              \`).join('')}
            </div>
          </div>

          <div style="width:100%; border-top:1px dashed var(--glass-border); margin: 32px 0 12px;"></div>

          <div class="qty-header">
            <h3>🎨 เลือกสีดอกกุหลาบ</h3>
            <p>สามารถเลือกได้มากกว่า 1 สี</p>
          </div>
          <div class="color-grid" id="color-grid">
            \${ROSE_COLORS.map(c => \`
              <div class="color-card\${selectedColors.includes(c.id) ? ' selected' : ''}" 
                  data-id="\${c.id}" 
                  onclick="selectColor('\${c.id}')">
                <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
                  <img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />
                </div>
                <span class="color-name">\${c.name}</span>
              </div>
            \`).join('')}
          </div>
        \`;
      }

      function renderStep2() {
        mainBox.style.justifyContent = 'flex-start';
        const layerPrice = getLayerExtraPrice();
        const priceNote = layerPrice === 0
          ? 'เลือกฟรีทั้งหมด (ไม่มีค่าใช้จ่ายเพิ่ม)'
          : \`เลือกฟรี 1 อัน (ชิ้นถัดไป +\${layerPrice} บาท/อัน)\`;
        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>🌿 เลือกรองช่อ</h3>
            <p>\${priceNote}</p>
          </div>
          <div class="color-grid" id="layer-grid" style="margin-top:20px;">
            \${ROSE_LAYERS.map(c => \`
              <div class="color-card\${selectedLayers.includes(c.id) ? ' selected' : ''}" 
                  data-id="\${c.id}" 
                  onclick="selectLayer('\${c.id}')">
                <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--warm-white); border:1px solid var(--glass-border);">
                  \${c.img ? \`<img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />\` : ''}
                </div>
                <span class="color-name" style="text-transform:none; font-size:.8rem;">\${c.name}</span>
              </div>
            \`).join('')}
          </div>
        \`;
      }

      function renderStep3() {
        mainBox.style.justifyContent = 'flex-start';

        let availableShapes = ROSE_SHAPES;
        if (selectedQty < 10) {
          availableShapes = availableShapes.filter(c => c.id !== 'bouquet_triangle' && c.id !== 'bouquet_rectangle');
          if (selectedShape === 'bouquet_triangle' || selectedShape === 'bouquet_rectangle') {
            selectedShape = null;
            updateTotalPrice();
            saveState();
          }
        }

        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>📜 เลือกกระดาษห่อ</h3>
            <p>เลือกรูปแบบกระดาษห่อให้ช่อดอกไม้ของคุณ</p>
          </div>
          <div class="color-grid" id="paper-grid" style="margin-top:20px;">
            \${ROSE_PAPERS.map(c => \`
              <div class="color-card\${selectedPaper === c.id ? ' selected' : ''}" 
                  data-id="\${c.id}" 
                  onclick="selectPaper('\${c.id}')">
                <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--warm-white); border:1px solid var(--glass-border);">
                  \${c.img ? \`<img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />\` : ''}
                </div>
                <span class="color-name" style="text-transform:none; font-size:.8rem;">\${c.name}</span>
              </div>
            \`).join('')}
          </div>

          <div style="width:100%; border-top:1px dashed var(--glass-border); margin: 32px 0 12px;"></div>

          <div class="qty-header" id="shape-section">
            <h3>📦 เลือกรูปทรงห่อ</h3>
            <p>เลือกรูปทรงในการห่อช่อดอกไม้</p>
          </div>
          <div class="color-grid" id="shape-grid" style="margin-top:20px;">
            \${availableShapes.map(c => \`
              <div class="color-card\${selectedShape === c.id ? ' selected' : ''}" 
                  data-id="\${c.id}" 
                  onclick="selectShape('\${c.id}')">
                <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--warm-white); border:1px solid var(--glass-border);">
                  \${c.img ? \`<img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />\` : ''}
                </div>
                <span class="color-name" style="text-transform:none; font-size:.8rem; margin-bottom:4px;">\${c.name}</span>
                \${c.price > 0 ? \`<span style="font-size:.7rem; font-weight:700; color:var(--rose-gold); background:rgba(201,149,107,0.1); padding:2px 10px; border-radius:12px; letter-spacing:.02em;">+\${c.price} ฿</span>\` : ''}
              </div>
            \`).join('')}
          </div>
        \`;
      }

      function renderStep4() {
        mainBox.style.justifyContent = 'flex-start';
        const freeDecors = ROSE_DECORATIONS.filter(c => c.price === 0);
        const paidDecors = ROSE_DECORATIONS.filter(c => c.price > 0);

        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>✨ เลือกการตกแต่ง</h3>
            <p>เพิ่มความสวยงามให้ช่อดอกไม้ของคุณ (เลือกได้หลายแบบ หรือไม่รับก็ได้)</p>
          </div>
          
          <div style="margin-top:20px; text-align:left; width:100%;">
            <div style="font-size:.9rem; font-weight:600; color:var(--deep-brown); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              หอุปกรณ์ตกแต่งฟรี
            </div>
            <div class="color-grid" id="decor-free-grid">
              \${freeDecors.map(c => \`
                <div class="color-card\${selectedDecorations.includes(c.id) ? ' selected' : ''}" 
                    data-id="\${c.id}" 
                    onclick="selectDecoration('\${c.id}')">
                  <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--warm-white); border:1px solid var(--glass-border);">
                    \${c.img ? \`<img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />\` : ''}
                  </div>
                  <span class="color-name" style="text-transform:none; font-size:.8rem; margin-bottom:4px;">\${c.name}</span>
                  <span style="font-size:.7rem; font-weight:700; color:#4caf50; background:#e8f5e9; padding:2px 10px; border-radius:12px; letter-spacing:.02em;">ฟรี</span>
                </div>
              \`).join('')}
            </div>
          </div>

          <div style="width:100%; border-top:1px dashed var(--glass-border); margin: 30px 0 20px;"></div>

          <div style="text-align:left; width:100%;">
            <div style="font-size:.9rem; font-weight:600; color:var(--deep-brown); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
               เพิ่มเติม (มีค่าบริการเพิ่ม)
            </div>
            <div class="color-grid" id="decor-paid-grid">
              \${paidDecors.map(c => \`
                <div class="color-card\${selectedDecorations.includes(c.id) ? ' selected' : ''}" 
                    data-id="\${c.id}" 
                    onclick="selectDecoration('\${c.id}')">
                  <div class="color-swatch" style="overflow:hidden; display:flex; align-items:center; justify-content:center; background:var(--warm-white); border:1px solid var(--glass-border);">
                    \${c.img ? \`<img src="\${c.img}" alt="\${c.name}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" />\` : ''}
                  </div>
                  <span class="color-name" style="text-transform:none; font-size:.8rem; margin-bottom:4px;">\${c.name}</span>
                  <span style="font-size:.7rem; font-weight:700; color:var(--rose-gold); background:rgba(201,149,107,0.1); padding:2px 10px; border-radius:12px; letter-spacing:.02em;">+\${c.price} ฿</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      function updateStep1Summary() {
        if (!selectedQty && selectedColors.length === 0) {
          delete orderItems[0];
        } else {
          let label = '';
          if (selectedQty) label += \`\${selectedQty} ดอก\`;
          if (selectedColors && selectedColors.length > 0) {
            const names = selectedColors.map(id => ROSE_COLORS.find(c => c.id === id)?.name).filter(Boolean).join(', ');
            if (label && names) label += ' · ';
            if (names) label += names;
          }
          orderItems[0] = { icon: '🌹', label: label, price: basePrice || 0 };
        }
        updateSummary();
      }

      function toggleDropdown(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('qty-dropdown');
        if (dd) dd.classList.toggle('open');
      }

      window.selectQty = function(qty, price) {
        selectedQty = qty;
        basePrice = price;
        updateTotalPrice();
        updateStep1Summary();

        const lbl = document.getElementById('dropdown-label');
        if (lbl) lbl.innerHTML = \`<span style="color:var(--deep-brown)"><b>\${qty} ดอก</b> &nbsp;—&nbsp; \${price.toLocaleString()} บาท</span>\`;

        const dd = document.getElementById('qty-dropdown');
        if (dd) dd.classList.remove('open');

        document.querySelectorAll('.dropdown-item').forEach(item => {
          const itemQty = parseInt(item.dataset.qty);
          item.classList.toggle('selected', itemQty === qty);
        });
        saveState();
      }

      window.selectColor = function(id) {
        if (selectedColors.includes(id)) {
          selectedColors = selectedColors.filter(c => c !== id);
        } else {
          selectedColors.push(id);
        }
        updateStep1Summary();
        document.querySelectorAll('.color-card').forEach(card => {
          const isSelected = selectedColors.includes(card.dataset.id);
          card.classList.toggle('selected', isSelected);
        });
        saveState();
      }

      function updateStep2Summary() {
        if (selectedLayers.length === 0) {
          delete orderItems[1];
        } else {
          const names = selectedLayers.map(id => ROSE_LAYERS.find(c => c.id === id).name).join(', ');
          let label = names;
          let extra = 0;
          const layerUnitPrice = getLayerExtraPrice();
          if (selectedLayers.length > 1 && layerUnitPrice > 0) {
            extra = (selectedLayers.length - 1) * layerUnitPrice;
            label += \` (+\${extra} ฿)\`;
          }
          orderItems[1] = { icon: '🌿', label: label, price: extra };
        }
        updateSummary();
      }

      window.selectLayer = function(id) {
        if (selectedLayers.includes(id)) {
          selectedLayers = selectedLayers.filter(x => x !== id);
        } else {
          selectedLayers.push(id);
        }
        updateTotalPrice();
        updateStep2Summary();
        document.querySelectorAll('#layer-grid .color-card').forEach(card => {
          const isSelected = selectedLayers.includes(card.dataset.id);
          card.classList.toggle('selected', isSelected);
        });
        saveState();
      }

      function updateStep3Summary() {
        if (!selectedPaper && !selectedShape) {
          delete orderItems[2];
        } else {
          let label = '';
          if (selectedPaper) label += ROSE_PAPERS.find(c => c.id === selectedPaper).name;
          if (selectedShape) {
            const sName = ROSE_SHAPES.find(c => c.id === selectedShape).name;
            label += (label ? ' · ' : '') + 'ทรง' + sName;
          }
          orderItems[2] = { icon: '📜', label: label, price: 0 };
        }
        updateSummary();
      }

      window.selectPaper = function(id) {
        selectedPaper = id;
        updateStep3Summary();
        document.querySelectorAll('#paper-grid .color-card').forEach(card => {
          const isSelected = card.dataset.id === id;
          card.classList.toggle('selected', isSelected);
        });
        saveState();
        setTimeout(() => {
          const shapeSection = document.getElementById('shape-section');
          if (shapeSection) shapeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
      }

      window.selectShape = function(id) {
        selectedShape = id;
        updateStep3Summary();
        document.querySelectorAll('#shape-grid .color-card').forEach(card => {
          const isSelected = card.dataset.id === id;
          card.classList.toggle('selected', isSelected);
        });
        saveState();
      }

      function updateStep4Summary() {
        if (selectedDecorations.length === 0) {
          delete orderItems[3];
        } else {
          const names = selectedDecorations.map(id => ROSE_DECORATIONS.find(c => c.id === id).name).join(', ');
          let totalExtra = selectedDecorations.reduce((acc, id) => {
            const item = ROSE_DECORATIONS.find(c => c.id === id);
            return acc + (item ? item.price : 0);
          }, 0);

          let label = names;
          if (totalExtra > 0) label += \` (+\${totalExtra} ฿)\`;

          orderItems[3] = { icon: '✨', label: label, price: totalExtra };
        }
        updateSummary();
      }

      window.selectDecoration = function(id) {
        if (selectedDecorations.includes(id)) {
          selectedDecorations = selectedDecorations.filter(x => x !== id);
        } else {
          selectedDecorations.push(id);
        }
        updateTotalPrice();
        updateStep4Summary();
        document.querySelectorAll('#decor-free-grid .color-card, #decor-paid-grid .color-card').forEach(card => {
          const isSelected = selectedDecorations.includes(card.dataset.id);
          card.classList.toggle('selected', isSelected);
        });
        saveState();
      }

      window.updateProductFormState = function() {
        const nameEl = document.getElementById('ipt-prod-name');
        if (nameEl) productName = nameEl.value;

        const descEl = document.getElementById('ipt-prod-desc');
        if (descEl) productDesc = descEl.value;

        const badgeEl = document.getElementById('ipt-prod-badge');
        if (badgeEl) productBadge = badgeEl.value;

        const priceEl = document.getElementById('ipt-prod-price');
        if (priceEl) productPrice = priceEl.value;

        saveState();
      };

      window.useCalculatedPrice = function() {
        const total = calculateTotalPrice();
        productPrice = String(total);
        const priceEl = document.getElementById('ipt-prod-price');
        if (priceEl) priceEl.value = productPrice;
        saveState();
      };

      window.handleCoverImageUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const maxDimension = 600;
        const targetBytes = 200 * 1024;
        const reader = new FileReader();

        reader.onload = function(e) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
              const scale = Math.min(maxDimension / width, maxDimension / height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              window.showBeautifulAlert('ไม่สามารถประมวลผลรูปภาพได้ค่ะ', 'error', 'อัปโหลดไม่สำเร็จ');
              return;
            }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            let quality = 0.7;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            while (dataUrl.length > targetBytes * 1.37 && quality > 0.2) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            if (dataUrl.length > 900 * 1024 * 1.37) {
              window.showBeautifulAlert('ไฟล์รูปยังมีขนาดใหญ่เกินไป กรุณาใช้รูปที่มีความละเอียดต่ำลงค่ะ', 'warning', 'ขนาดรูปใหญ่เกินไป');
              return;
            }

            productCoverImage = dataUrl;
            saveState();

            const previewWrap = document.getElementById('image-preview-wrap');
            const previewImg = document.getElementById('image-preview');
            if (previewWrap && previewImg) {
              previewImg.src = productCoverImage;
              previewWrap.style.display = 'block';
            }
          };
          img.onerror = function() {
            window.showBeautifulAlert('ไฟล์รูปภาพไม่ถูกต้องค่ะ', 'error', 'อัปโหลดไม่สำเร็จ');
          };
          img.src = e.target.result;
        };

        reader.readAsDataURL(file);
      };

      window.removeUploadedImage = function() {
        productCoverImage = '';
        saveState();
        
        const previewWrap = document.getElementById('image-preview-wrap');
        const previewImg = document.getElementById('image-preview');
        const fileInput = document.getElementById('ipt-prod-image');
        if (previewWrap && previewImg) {
          previewImg.src = '';
          previewWrap.style.display = 'none';
        }
        if (fileInput) fileInput.value = '';
      };

      function renderStep5() {
        mainBox.style.justifyContent = 'flex-start';
        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>✨ ข้อมูลและการแสดงผลสินค้า</h3>
            <p>กรอกข้อมูลรายละเอียดของสินค้าที่จะนำไปแสดงบนหน้าแรก Our Products</p>
          </div>
          
          <div style="width:100%; margin-top:20px; text-align: left;">
            <div class="form-group">
              <label style="font-weight: 600; color: var(--deep-brown); margin-bottom: 6px; display: block;">ชื่อสินค้า</label>
              <input type="text" id="ipt-prod-name" placeholder="เช่น ช่อกุหลาบรักนิรันดร์ชมพูประกาย" value="\${productName}" oninput="updateProductFormState()" style="width: 100%; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px; border-radius: 12px; color: var(--text-color); font-size: 16px;">
            </div>
            
            <div class="form-group" style="margin-top: 15px;">
              <label style="font-weight: 600; color: var(--deep-brown); margin-bottom: 6px; display: block;">คำอธิบาย / รายละเอียดสินค้า</label>
              <textarea id="ipt-prod-desc" placeholder="เช่น ดอกกุหลาบประกายวิบวับ จัดในกล่องพรีเมียม สวยสะดุดตา..." oninput="updateProductFormState()" style="width: 100%; min-height: 80px; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px; border-radius: 12px; color: var(--text-color); font-size: 16px; font-family: inherit;">\${productDesc}</textarea>
            </div>
            
            <div class="form-group" style="margin-top: 15px;">
              <label style="font-weight: 600; color: var(--deep-brown); margin-bottom: 6px; display: block;">ป้ายกำกับสินค้า (Badge)</label>
              <input type="text" id="ipt-prod-badge" placeholder="เช่น 50 ดอก, ขายดี, แนะนำ, ยอดนิยม" value="\${productBadge}" oninput="updateProductFormState()" style="width: 100%; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px; border-radius: 12px; color: var(--text-color); font-size: 16px;">
            </div>

            <div class="form-group" style="margin-top: 15px;">
              <label style="font-weight: 600; color: var(--deep-brown); margin-bottom: 6px; display: block;">ราคาสินค้า (บาท)</label>
              <input type="number" id="ipt-prod-price" placeholder="ระบุราคา เช่น 1290" value="\${productPrice}" oninput="updateProductFormState()" style="width: 100%; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px; border-radius: 12px; color: var(--text-color); font-size: 16px;">
              <div style="margin-top: 8px; font-size: 0.8rem; color: var(--mid-brown); display: flex; align-items: center; justify-content: space-between;">
                <span>* ราคาประเมินตามจริงจากช่อที่เลือก: <strong style="color: var(--rose-gold)">\${calculateTotalPrice().toLocaleString()}</strong> บาท</span>
                <button type="button" onclick="useCalculatedPrice()" style="background: var(--soft-peach); border: 1px solid var(--glass-border); color: var(--deep-brown); padding: 3px 8px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all 0.2s;">ใช้ราคานี้</button>
              </div>
            </div>

            <div class="form-group" style="margin-top: 20px;">
              <label style="font-weight: 600; color: var(--deep-brown); margin-bottom: 6px; display: block;">รูปภาพหน้าปกสินค้า</label>
              <div class="cover-image-uploader-container">
                <input type="file" id="ipt-prod-image" accept="image/*" onchange="handleCoverImageUpload(event)" style="display: none;">
                <div class="uploader-box" onclick="document.getElementById('ipt-prod-image').click()" style="border: 2px dashed var(--rose-gold); background: rgba(219, 138, 158, 0.03); border-radius: 16px; padding: 25px; text-align: center; cursor: pointer; transition: all 0.2s;">
                  <span class="upload-icon" style="font-size: 1.8rem; display: block; margin-bottom: 6px;">📷</span>
                  <span class="upload-text" style="font-size: 0.85rem; color: var(--mid-brown); font-weight: 600;">คลิกเพื่อเลือกไฟล์รูปภาพหน้าปก</span>
                </div>
                <div id="image-preview-wrap" style="margin-top: 15px; display: \${productCoverImage ? 'block' : 'none'}; position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--glass-border);">
                  <img id="image-preview" src="\${productCoverImage}" alt="Preview" style="width: 100%; max-height: 200px; object-fit: contain; background: #fff;">
                  <button type="button" onclick="removeUploadedImage()" class="remove-preview-btn" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: background 0.2s;">✕</button>
                </div>
              </div>
            </div>
          </div>
        \`;
      }

      function updateUI() {
        stepEls.forEach((el, i) => {
          el.classList.remove('active', 'done');
          if (i < current || (i < maxStepReached && i !== current)) el.classList.add('done');
          if (i === current) el.classList.add('active');
        });
        const s = steps[current];
        if (stepNum) stepNum.textContent = current + 1;
        if (stepName) stepName.textContent = s.name;

        if (current === 0) renderStep1();
        else if (current === 1) renderStep2();
        else if (current === 2) renderStep3();
        else if (current === 3) renderStep4();
        else if (current === 4) renderStep5();

        const isLast = current === steps.length - 1;
        const isFirst = current === 0;

        if (btnPrev) btnPrev.style.visibility = isFirst ? 'hidden' : 'visible';
        const nextBtnEl = document.getElementById('btn-next-step');
        if (nextBtnEl) {
          nextBtnEl.innerHTML = isLast ? 'สร้างสินค้า' : 'ถัดไป';
        }
        if (stickyPrev) stickyPrev.style.visibility = isFirst ? 'hidden' : 'visible';
        if (stickyNext) {
          stickyNext.innerHTML = isLast ? 'สร้างสินค้า' : 'ถัดไป';
        }
      }

      window.nextStep = function() {
        if (current === 0) {
          if (selectedQty === null || selectedColors.length === 0) {
            const gridId = selectedQty === null ? 'qty-dropdown' : 'color-grid';
            const element = document.getElementById(gridId);
            if (element) {
              element.style.animation = 'none';
              element.style.transition = 'transform .1s';
              setTimeout(() => { element.style.transform = 'translateX(8px)'; }, 0);
              setTimeout(() => { element.style.transform = 'translateX(-8px)'; }, 100);
              setTimeout(() => { element.style.transform = 'translateX(5px)'; }, 200);
              setTimeout(() => { element.style.transform = 'translateX(0)'; }, 300);
            }
            const msg = selectedQty === null ? 'กรุณาเลือกจำนวนดอกกุหลาบ' : 'กรุณาเลือกสีดอกกุหลาบอย่างน้อย 1 สี';
            showToast(msg);
            return;
          }
        } else if (current === 1) {
          if (selectedLayers.length === 0) {
            const grid = document.getElementById('layer-grid');
            if (grid) {
              grid.style.animation = 'none';
              grid.style.transition = 'transform .1s';
              setTimeout(() => { grid.style.transform = 'translateX(8px)'; }, 0);
              setTimeout(() => { grid.style.transform = 'translateX(-8px)'; }, 100);
              setTimeout(() => { grid.style.transform = 'translateX(5px)'; }, 200);
              setTimeout(() => { grid.style.transform = 'translateX(0)'; }, 300);
            }
            showToast('กรุณาเลือกรองช่ออย่างน้อย 1 แบบ');
            return;
          }
        } else if (current === 2) {
          if (!selectedPaper || !selectedShape) {
            const gridId = !selectedPaper ? 'paper-grid' : 'shape-grid';
            const element = document.getElementById(gridId);
            if (element) {
              element.style.animation = 'none';
              element.style.transition = 'transform .1s';
              setTimeout(() => { element.style.transform = 'translateX(8px)'; }, 0);
              setTimeout(() => { element.style.transform = 'translateX(-8px)'; }, 100);
              setTimeout(() => { element.style.transform = 'translateX(5px)'; }, 200);
              setTimeout(() => { element.style.transform = 'translateX(0)'; }, 300);
            }
            showToast(!selectedPaper ? 'กรุณาเลือกกระดาษห่อช่อดอกไม้' : 'กรุณาเลือกรูปทรงการห่อ');
            return;
          }
        } else if (current === 4) {
          if (!productName.trim() || !productPrice.trim() || !productCoverImage) {
            showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อสินค้า, ราคาสินค้า และรูปหน้าปก)');
            const ids = ['ipt-prod-name', 'ipt-prod-price'];
            ids.forEach(id => {
              const el = document.getElementById(id);
              if (el && !el.value.trim()) {
                el.style.borderColor = '#e53935';
                setTimeout(() => { el.style.borderColor = 'var(--glass-border)'; }, 2000);
              }
            });
            return;
          }
        }

        if (current < steps.length - 1) {
          current++;
          if (current > maxStepReached) maxStepReached = current;
          saveState();
          updateUI();
        } else {
          submitProductToFirestore();
        }
      }

      window.prevStep = function() {
        if (current > 0) {
          current--;
          saveState();
          updateUI();
        }
      }

      async function submitProductToFirestore() {
        try {
          const btn = document.getElementById('btn-next-step');
          const sbtn = document.getElementById('sticky-next-btn');
          if (btn) btn.disabled = true;
          if (sbtn) sbtn.disabled = true;
          
          showToast('กำลังนำเข้าข้อมูลสินค้าเข้าร้าน...');

          const productData = {
            name: productName.trim(),
            description: productDesc.trim() || 'ช่อกุหลาบกลิตเตอร์สั่งทำพิเศษตามแบบ',
            price: parseFloat(productPrice),
            badge: productBadge.trim() || (selectedQty ? selectedQty + ' ดอก' : 'สั่งทำพิเศษ'),
            coverImage: productCoverImage,
            type: 'glitter_rose',
            config: {
              selectedQty,
              selectedColors,
              selectedLayers,
              selectedPaper,
              selectedShape,
              selectedDecorations,
              basePrice
            }
          };

          // dynamic Firestore call injected via window helper set in react context
          const isEditing = Boolean(editingProductId);
          const ok = isEditing
            ? await window.updateProductFirebaseHelper(editingProductId, productData)
            : await window.saveProductFirebaseHelper(productData);
          if (ok) {
            resetForm();
            const message = isEditing
              ? 'อัปเดตสินค้าและข้อมูลใน Our Products สำเร็จเรียบร้อยแล้วค่ะ!'
              : 'สร้างตัวสินค้าและนำขึ้นแสดงใน Our Products สำเร็จเรียบร้อยแล้วค่ะ!';
            const title = isEditing ? 'อัปเดตสำเร็จ' : 'สร้างสินค้าสำเร็จ';
            window.showBeautifulAlert(message, 'success', title).then(() => {
              window.location.href = '/admin/create-product?manage=true';
            });
          } else {
            throw new Error('Firebase save returned false');
          }

        } catch (err) {
          console.error("Failed to submit product:", err);
          window.showBeautifulAlert('เกิดข้อผิดพลาดในการสร้างสินค้า กรุณาลองใหม่อีกครั้งนะคะ', 'error', 'บันทึกไม่สำเร็จ');
          const btn = document.getElementById('btn-next-step');
          const sbtn = document.getElementById('sticky-next-btn');
          if (btn) btn.disabled = false;
          if (sbtn) sbtn.disabled = false;
        }
      }

      function showToast(msg) {
        let t = document.getElementById('toast-msg');
        if (!t) {
          t = document.createElement('div');
          t.id = 'toast-msg';
          t.style.cssText = \`
            position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
            background:var(--deep-brown); color:#fff;
            padding:10px 22px; border-radius:50px;
            font-size:.82rem; font-weight:500; letter-spacing:.04em;
            z-index:2000; white-space:nowrap;
            box-shadow:0 6px 20px rgba(0,0,0,.25);
            opacity:0; transition:opacity .3s;
          \`;
          document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._to);
        t._to = setTimeout(() => { t.style.opacity = '0'; }, 2200);
      }

      document.addEventListener('click', function (e) {
        const dd = document.getElementById('qty-dropdown');
        if (dd && dd.classList.contains('open') && !dd.contains(e.target)) {
          dd.classList.remove('open');
        }
      });

      // Stepper click controls
      stepEls.forEach((el, i) => {
        el.addEventListener('click', () => {
          if (i <= maxStepReached && i !== current) {
            current = i;
            saveState();
            updateUI();
          }
        });
      });

      loadState();
    `;

    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isAdminUser, selectedType]);

  // Expose React Firebase wrapper helper to window for pure JS inside dangerouslySetInnerHTML script
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).saveProductFirebaseHelper = async (productData: any) => {
        try {
          await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: serverTimestamp()
          });
          return true;
        } catch (e) {
          console.error("Firebase Wrapper Error:", e);
          return false;
        }
      };

      (window as any).updateProductFirebaseHelper = async (productId: string, productData: any) => {
        try {
          await updateDoc(doc(db, 'products', productId), {
            ...productData
          });
          return true;
        } catch (e) {
          console.error("Firebase Update Error:", e);
          return false;
        }
      };
    }
  }, []);



  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffafb' }}>
        <div style={{ color: '#db8a9e', fontSize: '1.2rem', fontFamily: 'serif', fontStyle: 'italic' }}>ระบบจัดการสินค้าหลังบ้าน...</div>
      </div>
    );
  }

  if (isAdminUser === false) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fffafb', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(219, 138, 158, 0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ color: '#5c4738', marginBottom: '10px' }}>ไม่ได้รับอนุญาตให้เข้าถึง</h2>
          <p style={{ color: '#a08a8e', fontSize: '0.95rem', marginBottom: '25px' }}>ขออภัย หน้าเว็บส่วนนี้จำกัดการเข้าถึงเฉพาะผู้ดูแลระบบที่มีสิทธิ์เท่านั้น</p>
          <button style={{ background: '#db8a9e', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }} onClick={() => window.location.href = '/'}>
            กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const formatPrice = (value: any) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return num.toLocaleString();
  };

  const handleManageEdit = (product: any) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(EDIT_KEY, JSON.stringify(product));
    sessionStorage.setItem(EDIT_ID_KEY, product.id);
    setSelectedType('glitter_rose');
    setViewMode('form');
    window.history.replaceState(null, '', '/admin/create-product?edit=true');
  };

  const handleManageDelete = async (productId: string) => {
    if (typeof window === 'undefined') return;
    const confirmFn = (window as any).showBeautifulConfirm;
    const confirmed = confirmFn
      ? await confirmFn('ต้องการลบสินค้านี้หรือไม่?', 'ยืนยันการลบ')
      : window.confirm('ต้องการลบสินค้านี้หรือไม่?');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setManageProducts((prev) => prev.filter((item) => item.id !== productId));
      const alertFn = (window as any).showBeautifulAlert;
      if (alertFn) {
        alertFn('ลบสินค้าเรียบร้อยแล้ว', 'success', 'ลบสำเร็จ');
      }
    } catch (e) {
      console.error('Failed to delete product:', e);
      const alertFn = (window as any).showBeautifulAlert;
      if (alertFn) {
        alertFn('เกิดข้อผิดพลาดในการลบสินค้า', 'error', 'ลบไม่สำเร็จ');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f9', paddingBottom: '80px', position: 'relative' }}>

      {/* Admin Navbar */}
      <nav className="admin-nav">
        <div className="navbar-inner">
          <button className="back-btn-circle" onClick={() => window.location.href = '/admin'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="admin-title">Create Product</div>
          <div style={{ width: 40 }}></div>
        </div>
      </nav>

      <div className="admin-dashboard">
        <div className="dashboard-container">

          <style>{`
        .admin-nav {
          background: #fff;
          height: 64px;
          padding: 0 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          height: 100%;
        }

        @media (min-width: 1024px) {
          .admin-nav {
            padding: 0 40px;
          }
        }

        .back-btn-circle {
          width: 40px; height: 40px; border-radius: 50%; border: none;
          background: #fdf5f6; color: #db8a9e; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn-circle:hover {
          background: #f7d6de;
          transform: scale(1.05);
        }

        .admin-title {
          font-family: 'Cormorant Garamond', 'Noto Sans Thai', serif;
          font-style: italic;
          font-weight: 600;
          font-size: 1.4rem;
          color: #db8a9e;
        }

        .admin-dashboard {
          background: #fdf8f9;
          font-family: 'Noto Sans Thai', sans-serif;
          color: #5c4738;
          padding: 20px 20px 40px;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .option-select-screen {
          max-width: 800px;
          margin: 60px auto;
          padding: 0 20px;
          text-align: center;
        }
        .option-select-screen h2 {
          font-size: 1.8rem;
          color: var(--deep-brown);
          margin-bottom: 8px;
        }
        .option-select-screen .subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 40px;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          .options-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .option-card {
          background: #fff;
          border-radius: 24px;
          padding: 40px 25px;
          box-shadow: 0 10px 30px rgba(219, 138, 158, 0.05);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .option-card:not(.disabled):hover {
          border-color: var(--rose-gold);
          transform: translateY(-8px);
          box-shadow: 0 15px 40px rgba(219, 138, 158, 0.12);
        }
        .option-card.disabled {
          background: #fdfafb;
          border: 1px dashed rgba(219, 138, 158, 0.2);
          cursor: not-allowed;
          opacity: 0.85;
        }
        .option-icon {
          font-size: 3.5rem;
          margin-bottom: 20px;
        }
        .option-card h3 {
          font-size: 1.3rem;
          color: var(--deep-brown);
          margin-bottom: 12px;
        }
        .option-card p {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 25px;
          flex-grow: 1;
        }
        .option-badge {
          font-size: 0.85rem;
          font-weight: 700;
          padding: 8px 24px;
          border-radius: 50px;
        }
        .option-badge.active {
          background: var(--rose-gold);
          color: #fff;
          box-shadow: 0 5px 15px rgba(219, 138, 158, 0.2);
        }
        .option-badge.locked {
          background: #eae1e3;
          color: #8c7b7f;
        }

        /* cover uploader styling */
        .cover-image-uploader-container {
          width: 100%;
        }
        .remove-preview-btn:hover {
          background: #e74c3c !important;
        }

        /* manage products screen */
        .manage-screen {
          max-width: 1100px;
          margin: 0 auto;
          padding: 30px 20px 60px;
          width: 100%;
        }
        .manage-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 10px;
        }
        .manage-header h2 {
          font-size: 1.4rem;
          color: var(--deep-brown);
          margin-bottom: 4px;
        }
        .manage-create-btn {
          border: none;
          background: var(--rose-gold);
          color: #fff;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(219, 138, 158, 0.2);
          transition: all var(--transition);
        }
        .manage-create-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(219, 138, 158, 0.28);
        }
        .manage-count {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .manage-loading {
          padding: 30px 0;
          text-align: center;
          color: var(--text-muted);
        }
        .manage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 22px;
        }
        .manage-card {
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(80, 50, 57, 0.08);
          border: 1px solid rgba(219, 138, 158, 0.1);
          display: flex;
          flex-direction: column;
        }
        .manage-image {
          position: relative;
          aspect-ratio: 1;
          background: #f7eef0;
          overflow: hidden;
        }
        .manage-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .manage-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.6rem;
          color: #d9b1bc;
        }
        .manage-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(219, 138, 158, 0.2);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--deep-brown);
        }
        .manage-info {
          padding: 16px 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .manage-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--deep-brown);
        }
        .manage-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .manage-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 6px;
        }
        .manage-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--rose-gold);
        }
        .manage-price span {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .manage-actions {
          display: flex;
          gap: 6px;
        }
      `}</style>

          {viewMode === 'manage' ? (
            <div className="manage-screen">
              <div className="manage-header">
                <div>
                  <h2>จัดเก็บสินค้า</h2>
                  <p className="subtitle">รายการสินค้าที่สร้างไว้ทั้งหมด</p>
                </div>
                <button
                  className="manage-create-btn"
                  onClick={() => {
                    setSelectedType('glitter_rose');
                    setViewMode('form');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState(null, '', '/admin/create-product');
                    }
                  }}
                >
                  สร้างสินค้าใหม่
                </button>
              </div>

              <div className="manage-count">ทั้งหมด {manageProducts.length} รายการ</div>

              {manageLoading ? (
                <div className="manage-loading">กำลังโหลดสินค้า...</div>
              ) : (
                <div className="manage-grid">
                  {manageProducts.map((product) => (
                    <article className="manage-card" key={product.id}>
                      <div className="manage-image">
                        {product.coverImage ? (
                          <img src={product.coverImage} alt={product.name} />
                        ) : (
                          <div className="manage-placeholder">🌹</div>
                        )}
                        {product.badge ? <span className="manage-badge">{product.badge}</span> : null}
                      </div>
                      <div className="manage-info">
                        <div className="manage-name">{product.name}</div>
                        <div className="manage-desc">{product.description}</div>
                        <div className="manage-footer">
                          <div className="manage-price">
                            {formatPrice(product.price)} <span>บาท</span>
                          </div>
                          <div className="manage-actions">
                            <button className="admin-btn edit" onClick={() => handleManageEdit(product)}>แก้ไข</button>
                            <button className="admin-btn delete" onClick={() => handleManageDelete(product.id)}>ลบ</button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'select' ? (
            /* Screen A: Select product type */
            <div className="option-select-screen">
              <h2>เลือกประเภทสินค้าที่ต้องการสร้าง</h2>
              <p className="subtitle">กำหนดการสร้างช่อดอกไม้แบบสำเร็จรูปสำหรับแสดงในส่วน Our Products ของหน้าร้าน</p>

              <div className="options-grid">
                <div className="option-card" onClick={() => {
                  setSelectedType('glitter_rose');
                  setViewMode('form');
                }}>
                  <div className="option-icon">🌹</div>
                  <h3>ช่อดอกกุหลาบกลิตเตอร์</h3>
                  <p>สร้างช่อดอกกุหลาบกลิตเตอร์สำเร็จรูป โดยกำหนดจำนวนกุหลาบ สีของดอกไม้ รองช่อ กระดาษห่อ ทรงห่อ และของตกแต่ง พร้อมอัปโหลดภาพหน้าปกและตั้งราคาตามต้องการ</p>
                  <span className="option-badge active">เริ่มสร้างตัวเลือกสินค้า</span>
                </div>

                <div className="option-card disabled">
                  <div className="option-icon">🧸</div>
                  <h3>ดอกไม้ลวดกำมะหยี่</h3>
                  <p>สร้างสินค้ากลุ่มดอกไม้ประดิษฐ์จากลวดกำมะหยี่ เช่น ดอกทานตะวัน ทิวลิป ดอกเดซี่ และการจัดช่อตกแต่งพิเศษ (ระบบโครงสร้างแบบฟอร์มนี้จะเปิดให้ใช้งานในอนาคต)</p>
                  <span className="option-badge locked">⚡ เร็วๆ นี้</span>
                </div>
              </div>
            </div>
          ) : (
            /* Screen B: Glitter Rose Form (exactly matching glitter_rose/page.tsx size, styling & design) */
            <div dangerouslySetInnerHTML={{
              __html: `
          <div class="page-wrap" style="padding-top: 20px;">

            <!-- Stepper -->
            <div class="stepper-outer">
              <div class="stepper-container" id="stepper">
                <div class="stepper-line"></div>
                <div class="step active" data-step="1">
                  <div class="step-circle">1</div>
                  <span class="step-label">Rose</span>
                </div>
                <div class="step" data-step="2">
                  <div class="step-circle">2</div>
                  <span class="step-label">Secondary Layer</span>
                </div>
                <div class="step" data-step="3">
                  <div class="step-circle">3</div>
                  <span class="step-label">Paper</span>
                </div>
                <div class="step" data-step="4">
                  <div class="step-circle">4</div>
                  <span class="step-label">Decorations</span>
                </div>
                <div class="step" data-step="5">
                  <div class="step-circle">5</div>
                  <span class="step-label">Showcase Settings</span>
                </div>
              </div>
            </div>

            <!-- Elements Chosen Summary -->
            <div class="order-summary" id="order-summary">
              <span class="summary-label">📋 องค์ประกอบช่อดอกไม้ที่กำหนด</span>
              <div class="summary-chips" id="summary-chips">
                <span class="summary-empty">ยังไม่ได้เลือกองค์ประกอบสินค้า...</span>
              </div>
            </div>

            <!-- Selection Control Bar -->
            <div class="selection-bar">
              <div class="bar-step-info">
                ราคาอ้างอิงวัสดุ: <strong id="desktop-price-val" style="color: var(--rose-gold); font-size: 1.4rem;">0</strong> บาท
              </div>
              <div class="btn-group">
                <button class="btn-back" id="btn-prev-step" onclick="prevStep()">ก่อนหน้า</button>
                <button class="btn-next" id="btn-next-step" onclick="nextStep()">ถัดไป</button>
              </div>
            </div>

            <!-- Main Interactive Selector Box -->
            <div class="main-box" id="main-box" style="margin-bottom: 40px;"></div>

          </div><!-- /.page-wrap -->

          <!-- Sticky Bottom Mobile Bar -->
          <div class="sticky-bottom" id="sticky-bottom">
            <div class="sticky-price">
              <span id="sticky-price-val">0</span><small>฿</small>
            </div>
            <div class="sticky-btn-row">
              <button class="sticky-prev" id="sticky-prev-btn" onclick="prevStep()">←</button>
              <button class="sticky-next" id="sticky-next-btn" onclick="nextStep()">ถัดไป</button>
            </div>
          </div>
          `
            }} />
          )}
        </div>
      </div>
    </div>
  );
}
