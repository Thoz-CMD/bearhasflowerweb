'use client';
import { useEffect } from 'react';

export default function VelvetWire() {
  // Dynamic product preset loader helper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fetchPresetProductHelper = async (presetId: string) => {
        try {
          const { db } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          const docRef = doc(db, 'products', presetId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data();
          }
          return null;
        } catch (e) {
          console.error("fetchPresetProductHelper Error:", e);
          return null;
        }
      };
    }
  }, []);

  useEffect(() => {
    // โหลด Flatpickr CSS
    if (!document.getElementById('flatpickr-css')) {
      const link = document.createElement('link');
      link.id = 'flatpickr-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
      document.head.appendChild(link);
    }
    // โหลด Flatpickr JS
    if (!document.getElementById('flatpickr-js')) {
      const js = document.createElement('script');
      js.id = 'flatpickr-js';
      js.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
      document.head.appendChild(js);

      // Load Thai locale after main script
      js.onload = () => {
        const thJs = document.createElement('script');
        thJs.id = 'flatpickr-th';
        thJs.src = 'https://npmcdn.com/flatpickr/dist/l10n/th.js';
        document.head.appendChild(thJs);
      };
    }

    // เพิ่ม CSS แต่ง Flatpickr ให้เข้ากับธีมของแอป (Rose Gold / Deep Brown)
    if (!document.getElementById('flatpickr-custom-theme')) {
      const style = document.createElement('style');
      style.id = 'flatpickr-custom-theme';
      style.innerHTML = `
        .flatpickr-calendar {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid var(--glass-border) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08) !important;
          font-family: inherit !important;
          padding: 10px !important;
        }
        .flatpickr-day.selected, .flatpickr-day.selected:hover, .flatpickr-day.selected:focus {
          background: var(--rose-gold) !important;
          border-color: var(--rose-gold) !important;
          color: white !important;
          font-weight: bold;
        }
        .flatpickr-day:hover {
          background: var(--soft-peach) !important;
          color: var(--deep-brown) !important;
        }
        .flatpickr-months .flatpickr-month {
          color: var(--deep-brown) !important;
          fill: var(--deep-brown) !important;
        }
        .flatpickr-current-month .flatpickr-monthDropdown-months {
          font-weight: bold !important;
          color: var(--deep-brown) !important;
          background: transparent !important;
          border: none !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          cursor: pointer !important;
          padding: 2px 8px !important;
          border-radius: 4px !important;
          transition: background 0.2s !important;
        }
        .flatpickr-current-month .flatpickr-monthDropdown-months:hover {
          background: var(--soft-peach) !important;
        }
        /* ซ่อนลูกศร Dropdown ของเดือน */
        .flatpickr-current-month .flatpickr-monthDropdown-months::-ms-expand {
          display: none !important;
        }
        .flatpickr-current-month .numInputWrapper span {
          display: none !important; /* ซ่อนลูกศรขึ้นลงของปีถ้าต้องการความคลีน */
        }
        .flatpickr-current-month input.cur-year {
          font-weight: bold !important;
          color: var(--deep-brown) !important;
        }
        .flatpickr-weekday {
          color: var(--deep-brown) !important;
          font-weight: 600 !important;
        }
        .flatpickr-time {
          border-top: 1px dashed var(--glass-border) !important;
        }
        .flatpickr-time input:hover, .flatpickr-time .flatpickr-am-pm:hover, .flatpickr-time input:focus, .flatpickr-time .flatpickr-am-pm:focus {
          background: var(--soft-peach) !important;
        }
        
        /* สไตล์สำหรับการแสดงผลแบบ Modal (กลางจอ) */
        body.flatpickr-modal-open::after {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(3px);
          z-index: 9998;
          animation: fadeIn 0.2s ease-out;
        }
        .flatpickr-calendar {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 9999 !important;
          margin: 0 !important;
          transition: none !important; /* ปิด transition เพื่อไม่ให้มันดีดจากมุมจอมาตรงกลาง */
          opacity: 0;
          visibility: hidden;
        }
        .flatpickr-calendar.open {
          opacity: 1 !important;
          visibility: visible !important;
          animation: modalFadeIn 0.2s ease-out !important;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    const script = document.createElement('script');
    script.innerHTML = `
      // ===== Price list (ดอก -> บาท) =====
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
        { name: 'Address', icon: '📍', text: 'ที่อยู่สำหรับจัดส่ง' }
      ];

      let current = 0;
      let selectedQty = null;  // จำนวนดอกที่เลือก
      let selectedColors = [];   // สีที่เลือก (id)
      let selectedLayers = [];   // รองช่อที่เลือก (id)
      let selectedPaper = null; // กระดาษห่อที่เลือก (id)
      let selectedShape = null; // รูปทรงห่อที่เลือก (id)
      let selectedDecorations = []; // ของตกแต่งที่เลือก (id[])
      let basePrice = 0;     // ราคาจากขั้นตอน 1
      let maxStepReached = 0; // ขั้นตอนที่ไปถึงไกลที่สุด

      let customerName = '';
      let customerPhone = '';
      let customerAddress = '';
      let deliveryDate = '';
      let deliveryTime = '';
      let additionalNote = '';

      const STORAGE_KEY = 'bear_flower_v1';

      function calculateTotalPrice() { return basePrice; }

      function saveState() {
        const state = {
          current, maxStepReached, selectedQty, selectedColors, selectedLayers, selectedPaper,
          selectedShape, selectedDecorations, basePrice,
          customerName, customerPhone, customerAddress, deliveryDate, deliveryTime, additionalNote
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        // Auto-update cart if editing
        const editingId = localStorage.getItem('editing_cart_id');
        if (editingId) {
          try {
            const CART_KEY = 'bear_flower_cart';
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            const itemIndex = cart.findIndex(i => i.id === editingId);
            if (itemIndex !== -1) {
              const total = calculateTotalPrice();
              const colorNames = selectedColors.map(c => ROSE_COLORS.find(rc => rc.id === c)?.name).join(', ');
              
              cart[itemIndex] = {
                ...cart[itemIndex],
                name: 'ช่อกุหลาบกริตเตอร์ (' + (selectedQty || 0) + ' ดอก)',
                price: total,
                details: 'สี: ' + colorNames,
                config: state
              };
              localStorage.setItem(CART_KEY, JSON.stringify(cart));
            }
          } catch(e) { console.error('Auto-save error:', e); }
        }
      }

      function loadState() {
        const isEditMode = window.location.search.includes('edit=true');
        if (!isEditMode) {
          localStorage.removeItem('editing_cart_id');
          localStorage.removeItem(STORAGE_KEY);
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
            customerName = s.customerName || '';
            customerPhone = s.customerPhone || '';
            customerAddress = s.customerAddress || '';
            deliveryDate = s.deliveryDate || '';
            deliveryTime = s.deliveryTime || '';
            additionalNote = s.additionalNote || '';
          } catch (err) { console.error('Failed to parse saved state', err); }
        } else {
          // Reset all variables to start completely fresh!
          current = 0;
          maxStepReached = 0;
          selectedQty = null;
          selectedColors = [];
          selectedLayers = [];
          selectedPaper = null;
          selectedShape = null;
          selectedDecorations = [];
          basePrice = 0;
          customerName = '';
          customerPhone = '';
          customerAddress = '';
          deliveryDate = '';
          deliveryTime = '';
          additionalNote = '';
        }
        // รีเฟรชข้อมูลและ Summary
        updateTotalPrice();
        updateStep1Summary();
        updateStep2Summary();
        updateStep3Summary();
        updateStep4Summary();
        updateUI();
      }

      const stepEls = document.querySelectorAll('.step');
      const stepNum = document.getElementById('step-num');
      const stepName = document.getElementById('step-name');
      const mainBox = document.getElementById('main-box');
      const btnPrev = document.getElementById('btn-prev-step');
      const stickyPrev = document.getElementById('sticky-prev-btn');
      const stickyNext = document.getElementById('sticky-next-btn');

      // order summary: { step index -> { icon, label, price } }
      const orderItems = {};

      /* ---- helpers ---- */
      function getLayerExtraPrice() {
        const qty = selectedQty || 0;
        if (qty <= 3) return 0;
        if (qty <= 10) return 10;
        if (qty <= 20) return 15;
        return 20; // 30-50
      }

      function updateTotalPrice() {
        let total = basePrice;
        const layerUnitPrice = getLayerExtraPrice();
        if (selectedLayers.length > 1 && layerUnitPrice > 0) {
          total += (selectedLayers.length - 1) * layerUnitPrice;
        }
        total += selectedDecorations.reduce((acc, id) => {
          const item = ROSE_DECORATIONS.find(c => c.id === id);
          return acc + (item ? item.price : 0);
        }, 0);
        if (selectedShape) {
          const shapeItem = ROSE_SHAPES.find(x => x.id === selectedShape);
          if (shapeItem && shapeItem.price) {
            total += shapeItem.price;
          }
        }

        const sv = document.getElementById('sticky-price-val');
        if (sv) sv.textContent = total.toLocaleString();
        const dv = document.getElementById('desktop-price-val');
        if (dv) dv.textContent = total.toLocaleString();
      }

      function updateSummary() {
        const container = document.getElementById('summary-chips');
        if (!container) return;
        const keys = Object.keys(orderItems);
        if (keys.length === 0) {
          container.innerHTML = '<span class="summary-empty">ยังไม่ได้เลือกสินค้า...</span>';
          return;
        }
        // build chips
        container.innerHTML = keys.map(k => {
          const it = orderItems[k];
          return \`<span class="summary-chip">
            <span class="chip-icon">\${it.icon}</span>
            \${it.label}
          </span>\`;
        }).join('');
      }

      function renderStep1() {
        // สำหรับมือถือให้ scrolling ได้ดีเวลา content ยาว
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
            updateStep3Summary();
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
              อุปกรณ์ตกแต่งฟรี
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>เพิ่มเติม (มีค่าบริการ)
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

      function renderPlaceholder(s) {
        mainBox.style.justifyContent = 'center';
        mainBox.innerHTML = \`
          <div class="placeholder-icon">\${s.icon}</div>
          <div class="placeholder-text">\${s.text}</div>
          <div class="placeholder-sub">ขั้นตอนที่ \${current + 1} จาก 5</div>
        \`;
      }

      function updateStep1Summary() {
        if (!selectedQty && selectedColors.length === 0) {
          delete orderItems[0];
        } else {
          let label = '';
          if (selectedQty) label += \`\${selectedQty} ดอก\`;
          if (selectedColors.length > 0) {
            const names = selectedColors.map(id => ROSE_COLORS.find(c => c.id === id).name).join(', ');
            if (label) label += ' · ';
            label += names;
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

      function selectQty(qty, price) {
        selectedQty = qty;
        basePrice = price;
        updateTotalPrice();
        updateStep1Summary();

        const lbl = document.getElementById('dropdown-label');
        if (lbl) lbl.innerHTML = \`<span style="color:var(--deep-brown)"><b>\${qty} ดอก</b> &nbsp;—&nbsp; \${price.toLocaleString()} บาท</span>\`;

        const dd = document.getElementById('qty-dropdown');
        if (dd) dd.classList.remove('open');

        // re-render เฉพาะการ์ด ไม่ต้อง re-render ทั้งหมด
        document.querySelectorAll('.dropdown-item').forEach(item => {
          const itemQty = parseInt(item.dataset.qty);
          item.classList.toggle('selected', itemQty === qty);
        });
        saveState();
      }

      function selectColor(id) {
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

      function selectLayer(id) {
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

      function selectPaper(id) {
        selectedPaper = id;
        updateStep3Summary();
        document.querySelectorAll('#paper-grid .color-card').forEach(card => {
          const isSelected = card.dataset.id === id;
          card.classList.toggle('selected', isSelected);
        });
        saveState();
        // Auto-scroll ไปยังส่วนเลือกรูปทรงห่อ
        setTimeout(() => {
          const shapeSection = document.getElementById('shape-section');
          if (shapeSection) shapeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 250);
      }

      function selectShape(id) {
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

      function selectDecoration(id) {
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

      function getTomorrowStr() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return \`\${yyyy}-\${mm}-\${dd}\`;
      }

      function updateFormState() {
        const n = document.getElementById('ipt-name');
        if (n) customerName = n.value;
        const p = document.getElementById('ipt-phone');
        if (p) customerPhone = p.value;
        const a = document.getElementById('ipt-address');
        if (a) customerAddress = a.value;
        const d = document.getElementById('ipt-date');
        if (d) {
          const parts = d.value.split(' ');
          if (parts.length >= 1) deliveryDate = parts[0];
          if (parts.length >= 2) deliveryTime = parts[1];
        }
        const note = document.getElementById('ipt-note');
        if (note) additionalNote = note.value;
        saveState();
      }

      function renderStep5() {
        mainBox.style.justifyContent = 'flex-start';
        const tmr = getTomorrowStr();   
        
        // Ensure saved delivery date is not in the past
        if (deliveryDate && deliveryDate < tmr) {
          deliveryDate = '';
          saveState();
        }

        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>📍 ข้อมูลการจัดส่ง</h3>
            <p>กรอกข้อมูลสำหรับการจัดส่งดอกไม้</p>
          </div>
          
          <div style="width:100%; margin-top:20px;">
            <div class="form-group">
              <label>ชื่อผู้รับ</label>
              <input type="text" id="ipt-name" placeholder="ชื่อ-นามสกุล" value="\${customerName}" oninput="updateFormState()" style="font-size: 16px;">
            </div>
            
            <div class="form-group">
              <label>เบอร์โทรติดต่อ</label>
              <input type="tel" id="ipt-phone" placeholder="06X-XXX-XXXX" value="\${customerPhone}" oninput="updateFormState()" style="font-size: 16px;">
            </div>
            
            <div class="form-group">
              <label>ที่อยู่จัดส่ง</label>
              <textarea id="ipt-address" placeholder="ชื่อหอ.." oninput="updateFormState()" style="font-size: 16px;">\${customerAddress}</textarea>
              <div class="form-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg> ส่งฟรีบริเวณกำแพงแสน
              </div>
            </div>
            
            <div class="form-group">
              <label>วันที่และเวลาที่ต้องการรับสินค้า</label>
              <div style="width:100%;">
                <input type="text" id="ipt-date" placeholder="เลือกวันที่และเวลาจัดส่ง" value="\${deliveryDate ? deliveryDate + (deliveryTime ? ' ' + deliveryTime : '') : ''}" style="width:100%; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 12px; border-radius: 12px; color: var(--text-color); font-size: 16px;" readonly>
              </div>
              <span style="font-size:.75rem; color:var(--text-muted); margin-top:6px; display:block; line-height:1.4;">
                * ไม่สามารถเลือกวันย้อนหลังหรือวันปัจจุบันได้ ต้องสั่งล่วงหน้าอย่างน้อย 1 วัน
              </span>
            </div>
            
            <div class="form-group">
              <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
              <textarea id="ipt-note" placeholder="เช่น เวลาที่สะดวกรับ, ข้อความฝากเขียนการ์ด..." oninput="updateFormState()" style="font-size: 16px;">\${additionalNote}</textarea>
            </div>
          </div>
        \`;

        // บังคับใช้ Flatpickr
        setTimeout(() => {
          const dateInput = document.getElementById('ipt-date');
          if (dateInput && typeof window.flatpickr !== 'undefined') {
            const tmrDate = new Date();
            tmrDate.setDate(tmrDate.getDate() + 1);
            
            window.flatpickr('#ipt-date', {
              enableTime: true,
              dateFormat: "Y-m-d H:i",
              minDate: tmrDate,
              locale: window.flatpickr.l10ns ? window.flatpickr.l10ns.th : "default",
              time_24hr: true,
              disableMobile: true, // บังคับใช้หน้าตาของ Flatpickr เสมอบนมือถือ
              onOpen: function() {
                document.body.classList.add('flatpickr-modal-open');
              },
              onClose: function() {
                document.body.classList.remove('flatpickr-modal-open');
              },
              onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                  const d = selectedDates[0];
                  const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                  const tStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
                  
                  deliveryDate = dStr;
                  deliveryTime = tStr;
                  const el = document.getElementById('ipt-date');
                  if (el) el.value = dStr + ' ' + tStr;
                }
              }
            });
          }
        }, 500); // รอให้ script โหลดเสร็จและ DOM พร้อม
      }

      /* ---- main updateUI ---- */
      function updateUI() {
        stepEls.forEach((el, i) => {
          el.classList.remove('active', 'done');
          if (i < current || (i < maxStepReached && i !== current)) el.classList.add('done');
          if (i === current) el.classList.add('active');
        });
        const s = steps[current];
        if (stepNum) stepNum.textContent = current + 1;
        if (stepName) stepName.textContent = s.name;

        renderStep5();

        const isLast = current === steps.length - 1;
        const isFirst = current === 0;

        // Desktop bar
        if (btnPrev) btnPrev.style.visibility = 'hidden';
        const nextBtnEl = document.getElementById('btn-next-step');
        if (nextBtnEl) {
          nextBtnEl.innerHTML = isLast
            ? \`สั่งซื้อ\`
            : \`ถัดไป\`;
        }
        // Sticky bar
        if (stickyPrev) stickyPrev.style.visibility = 'hidden';
        if (stickyNext) {
          stickyNext.innerHTML = isLast
            ? \`สั่งซื้อ\`
            : \`ถัดไป\`;
        }
      }

      function nextStep() { 
        const tmr = getTomorrowStr();
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !deliveryDate || !deliveryTime) {
          showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
          const inputs = ['ipt-name', 'ipt-phone', 'ipt-address', 'ipt-date'];
          inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value.trim()) {
              el.style.borderColor = '#e53935';
              setTimeout(() => { el.style.borderColor = 'var(--glass-border)'; }, 2000);
            }
          });
          return;
        }
        if (deliveryDate < tmr) {
          showToast('ต้องเลือกวันจัดส่งล่วงหน้าอย่างน้อย 1 วัน');
          const el = document.getElementById('ipt-date');
          if (el) {
            el.style.borderColor = '#e53935';
            setTimeout(() => { el.style.borderColor = 'var(--glass-border)'; }, 2000);
          }
          return;
        }
        generateReceipt(); }

      function prevStep() {
        if (current > 0) {
          current--;
          saveState();
          updateUI();
        }
      }

      /* ---- Toast notification ---- */
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
            z-index:200; white-space:nowrap;
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

      /* ---- Global event listeners ---- */
      document.addEventListener('click', function (e) {
        const dd = document.getElementById('qty-dropdown');
        if (dd && dd.classList.contains('open') && !dd.contains(e.target)) {
          dd.classList.remove('open');
        }
      });

      // Stepper circle click navigation
      stepEls.forEach((el, i) => {
        el.addEventListener('click', () => {
          // Allow clicking on any previously visited step
          if (i <= maxStepReached && i !== current) {
            current = i;
            saveState();
            updateUI();
          }
        });
      });

      
      function generateReceipt() {
        const total = basePrice;
        const orderId = String(Math.floor(Math.random() * 899999 + 100000));
        const pName = window._productName || 'ดอกไม้ลวดกำมะหยี่';

        const modal = document.getElementById('receipt-modal');
        const rc = document.getElementById('receipt-card');
        if (rc && modal) {
          rc.innerHTML = \`
            <div class="receipt-header">
              <h2>\${pName}</h2>
              <p>ออเดอร์ #VW\${orderId}</p>
            </div>
            
            <div class="r-row total" style="margin-top: 20px;">
              <span>ยอดชำระสุทธิ</span><span>\${total.toLocaleString()} ฿</span>
            </div>

            <div class="r-info">
              <div style="margin-bottom:6px;"><b>ผู้รับ:</b> \${customerName}</div>
              <div style="margin-bottom:6px;"><b>ข้อมูลติดต่อ:</b> \${customerPhone}</div>
              <div style="margin-bottom:6px;"><b>ที่อยู่จัดส่ง:</b> \${customerAddress}</div>
              <div style="margin-bottom:6px;"><b>จัดส่ง:</b> \${deliveryDate} เวลา \${deliveryTime} น.</div>
              \${additionalNote ? \`<div style="margin-top:10px; border-top:1px dashed #ddd; padding-top:10px;"><i>หมายเหตุ: \${additionalNote}</i></div>\` : ''}
            </div>

            <button class="btn-receipt" onclick="finishOrder()">บันทึกลงตะกร้า</button>
          \`;
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
        }
      }

      
      function saveToCartOnly() {
        const CART_KEY = 'bear_flower_cart';
        
        // Calculate price and description for NEW item
        const total = basePrice;
        const pName = window._productName || 'ดอกไม้ลวดกำมะหยี่';
        const customItem = {
          id: 'velvet_' + Date.now(),
          type: 'velvet_flower',
          name: pName,
          price: total,
          qty: 1,
          details: 'สำเร็จรูป',
          config: {
            customerName, customerPhone, customerAddress, 
            deliveryDate, deliveryTime, additionalNote,
            basePrice
          }
        };

        try {
          const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
          cart.push(customItem);
          localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch(e) {
          localStorage.setItem(CART_KEY, JSON.stringify([customItem]));
        }

        localStorage.removeItem(STORAGE_KEY);
        window.location.href = '/cart';
      }

      function finishOrder() {
        saveToCartOnly();
      }

      
      async function loadPresetIfNeeded() {
        const urlParams = new URLSearchParams(window.location.search);
        const presetId = urlParams.get('preset');
        if (presetId && window.fetchPresetProductHelper) {
          try {
            showToast('กำลังโหลดข้อมูลสินค้า...');
            const p = await window.fetchPresetProductHelper(presetId);
            if (p) {
              basePrice = p.price || 0;
              window._productName = p.name || 'ดอกไม้ลวดกำมะหยี่';
              saveState();
              updateTotalPrice();
              updateUI();
              showToast('โหลดข้อมูลสำเร็จ');
            } else {
              showToast('ไม่พบข้อมูลสินค้า');
            }
          } catch(e) {
            console.error('Failed to load preset:', e);
            showToast('เกิดข้อผิดพลาดในการโหลดสินค้า');
          }
        }
      }

      loadState();
      loadPresetIfNeeded();

      // ตรวจสอบและแสดงแจ้งเตือนถ้าเพิ่งสั่งสินค้าสำเร็จ
      if (sessionStorage.getItem('order_success_toast')) {
        sessionStorage.removeItem('order_success_toast');
        setTimeout(() => {
          showToast('เพิ่มลงตะกร้าเรียบร้อยแล้ว!');
        }, 300);
      }

      // ===== Routing: handle anchor links smoothly =====
      document.addEventListener('click', function (e) {
        const a = e.target.closest('a');
        if (a) {
          const href = a.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            if (href !== '#') {
              const targetEl = document.querySelector(href);
              if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }
      });
    `;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div dangerouslySetInnerHTML={{
    __html: `

    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-inner">
        <button class="back-btn-circle" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <a href="/" class="nav-logo" style="position: absolute; left: 50%; transform: translateX(-50%);">"Bear has flower"</a>
      </div>
    </nav>

    <div class="page-wrap">

      <!-- Heading -->
      <div class="page-heading">
        <h1>Velvet Wire</h1>
        <p class="subtitle">ออกแบบดอกไม้ลวดกำมะหยี่ของคุณ</p>
      </div>

      <!-- Selection Bar (Desktop/iPad) -->
      <div class="selection-bar">
        <div class="bar-step-info">
          ราคา: <strong id="desktop-price-val" style="color: var(--rose-gold); font-size: 1.4rem;">0</strong> บาท
        </div>
        <div class="btn-group">
          <button class="btn-back" id="btn-prev-step" onclick="prevStep()">ก่อนหน้า</button>
          <button class="btn-next" id="btn-next-step" onclick="nextStep()">
            ถัดไป
          </button>
        </div>
      </div>


      <!-- Main Box -->
      <div class="main-box" id="main-box"></div>

    </div><!-- /.page-wrap -->

    <!-- Sticky Bottom Bar (Mobile) -->
    <div class="sticky-bottom" id="sticky-bottom">
      <div class="sticky-price">
        <span id="sticky-price-val">0</span><small>บาท</small>
      </div>
      <div class="sticky-btn-row">
        <button class="sticky-prev" id="sticky-prev-btn" onclick="prevStep()">←</button>
        <button class="sticky-next" id="sticky-next-btn" onclick="nextStep()">
          ถัดไป
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div class="receipt-modal" id="receipt-modal">
      <div class="drawer-backdrop" onclick="closeReceipt()"></div>
      <div class="receipt-card" id="receipt-card">
        <!-- Content injected by JS -->
      </div>
    </div>

    <script>
      function closeReceipt() {
        const modal = document.getElementById('receipt-modal');
        if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
        }
      }
    </script>

    ` }} />;
}
