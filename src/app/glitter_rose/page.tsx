'use client';
import { useEffect } from 'react';

export default function GlitterRose() {
  useEffect(() => {
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
        { id: 'red', name: 'แดง', hex: '#E53935' },
        { id: 'pink', name: 'ชมพู', hex: '#F48FB1' },
        { id: 'blue', name: 'น้ำเงิน', hex: '#1976D2' },
        { id: 'white', name: 'ขาว', hex: '#F9F9F9', border: '#e0e0e0' },
        { id: 'sky', name: 'ฟ้า', hex: '#81D4FA' },
        { id: 'purple', name: 'ม่วง', hex: '#CE93D8' },
      ];

      const ROSE_LAYERS = [
        { id: 'ramy_white', name: 'รามี่ขาว' },
        { id: 'pearl_net_white', name: 'ตาข่ายมุกขาว' },
        { id: 'sa_paper_white', name: 'กระดาษสาขาว' },
        { id: 'ramy_black', name: 'รามี่ดำ' },
        { id: 'pearl_net_black', name: 'ตาข่ายมุกดำ' },
        { id: 'sa_paper_black', name: 'กระดาษสาดำ' },
      ];

      const ROSE_PAPERS = [
        { id: 'white_solid', name: 'ขาวทึบ' },
        { id: 'white_clear', name: 'ขาวใส' },
        { id: 'white_gold', name: 'ขาวขอบทอง' },
        { id: 'black_solid', name: 'ดำทึบ' },
        { id: 'black_gold', name: 'ดำขอบทอง' },
        { id: 'pink', name: 'ชมพู' },
      ];

      const ROSE_SHAPES = [
        { id: 'triangle', name: 'สามเหลี่ยม' },
        { id: 'rectangle', name: 'สี่เหลี่ยม' },
        { id: 'open_front', name: 'เปิดหน้า' },
      ];

      const ROSE_DECORATIONS = [
        { id: 'ribbon', name: 'โบว์คาดช่อ', price: 15 },
        { id: 'butterfly', name: 'ผีเสื้อ', price: 0 },
        { id: 'blank_card', name: 'การ์ดเปล่า', price: 0 },
        { id: 'stick', name: 'ก้านเสียบ', price: 5 },
        { id: 'fairy_light', name: 'ไฟ', price: 15 },
        { id: 'crown', name: 'มงกุฎ', price: 15 },
      ];

      const steps = [
        { name: 'Rose', icon: '🌹', text: 'เลือกจำนวนดอกกุหลาบ' },
        { name: 'Secondary Layer', icon: '🌿', text: 'เลือกดอกไม้ประกอบ' },
        { name: 'Paper', icon: '📜', text: 'เลือกกระดาษห่อ' },
        { name: 'Decorations', icon: '✨', text: 'เลือกการตกแต่ง' },
        { name: 'Address', icon: '📍', text: 'ที่อยู่สำหรับจัดส่ง' },
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
        return total;
      }

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

        const sv = document.getElementById('sticky-price-val');
        if (sv) sv.textContent = total.toLocaleString();
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
                <div class="color-swatch" style="background:\${c.hex};\${c.border ? 'border:1.5px solid ' + c.border + ';' : ''}"></div>
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
                <div class="color-swatch" style="background:var(--warm-white); border:1px solid var(--glass-border);"></div>
                <span class="color-name" style="text-transform:none; font-size:.8rem;">\${c.name}</span>
              </div>
            \`).join('')}
          </div>
        \`;
      }

      function renderStep3() {
        mainBox.style.justifyContent = 'flex-start';
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
                <div class="color-swatch" style="background:var(--warm-white); border:1px solid var(--glass-border);"></div>
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
            \${ROSE_SHAPES.map(c => \`
              <div class="color-card\${selectedShape === c.id ? ' selected' : ''}" 
                  data-id="\${c.id}" 
                  onclick="selectShape('\${c.id}')">
                <div class="color-swatch" style="background:var(--warm-white); border:1px solid var(--glass-border);"></div>
                <span class="color-name" style="text-transform:none; font-size:.8rem;">\${c.name}</span>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>อุปกรณ์ตกแต่งฟรี
            </div>
            <div class="color-grid" id="decor-free-grid">
              \${freeDecors.map(c => \`
                <div class="color-card\${selectedDecorations.includes(c.id) ? ' selected' : ''}" 
                    data-id="\${c.id}" 
                    onclick="selectDecoration('\${c.id}')">
                  <div class="color-swatch" style="background:var(--warm-white); border:1px solid var(--glass-border);"></div>
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
                  <div class="color-swatch" style="background:var(--warm-white); border:1px solid var(--glass-border);"></div>
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
          const tmr = getTomorrowStr();
          if (d.value && d.value < tmr) {
            alert('ไม่สามารถเลือกวันจัดส่งย้อนหลังหรือวันปัจจุบันได้ ต้องสั่งล่วงหน้าอย่างน้อย 1 วันค่ะ');
            d.value = '';
            deliveryDate = '';
          } else {
            deliveryDate = d.value;
          }
        }
        const t = document.getElementById('ipt-time');
        if (t) deliveryTime = t.value;
        const note = document.getElementById('ipt-note');
        if (note) additionalNote = note.value;
        saveState();
      }

      function renderStep5() {
        mainBox.style.justifyContent = 'flex-start';
        const tmr = getTomorrowStr();   

        mainBox.innerHTML = \`
          <div class="qty-header">
            <h3>📍 ข้อมูลการจัดส่ง</h3>
            <p>กรอกข้อมูลสำหรับการจัดส่งดอกไม้</p>
          </div>
          
          <div style="width:100%; margin-top:20px;">
            <div class="form-group">
              <label>ชื่อผู้รับ</label>
              <input type="text" id="ipt-name" placeholder="ชื่อ-นามสกุล" value="\${customerName}" oninput="updateFormState()">
            </div>
            
            <div class="form-group">
              <label>เบอร์โทรติดต่อ</label>
              <input type="tel" id="ipt-phone" placeholder="06X-XXX-XXXX" value="\${customerPhone}" oninput="updateFormState()">
            </div>
            
            <div class="form-group">
              <label>ที่อยู่จัดส่ง</label>
              <textarea id="ipt-address" placeholder="ชื่อหอ.." oninput="updateFormState()">\${customerAddress}</textarea>
              <div class="form-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg> ส่งฟรีบริเวณกำแพงแสน
              </div>
            </div>
            
            <div class="form-group">
              <label>วันที่และเวลาที่ต้องการรับสินค้า</label>
              <div style="display:flex; gap:10px;">
                <input type="date" id="ipt-date" min="\${tmr}" value="\${deliveryDate}" onchange="updateFormState()" style="flex:1;">
                <input type="time" id="ipt-time" value="\${deliveryTime}" onchange="updateFormState()" style="flex:1;">
              </div>
              <span style="font-size:.75rem; color:var(--text-muted); margin-top:6px; display:block; line-height:1.4;">
                * ไม่สามารถเลือกวันย้อนหลังหรือวันปัจจุบันได้ ต้องสั่งล่วงหน้าอย่างน้อย 1 วัน
              </span>
            </div>
            
            <div class="form-group">
              <label>รายละเอียดเพิ่มเติม (ถ้ามี)</label>
              <textarea id="ipt-note" placeholder="เช่น เวลาที่สะดวกรับ, ข้อความฝากเขียนการ์ด..." oninput="updateFormState()">\${additionalNote}</textarea>
            </div>
          </div>
        \`;

        // Explicitly enforce the min date on the DOM element to ensure mobile browsers respect it
        setTimeout(() => {
          const dInput = document.getElementById('ipt-date');
          if (dInput) {
            (dInput as any).min = tmr;
            dInput.setAttribute('min', tmr);
            // Some mobile browsers need it re-applied on focus
            dInput.addEventListener('focus', function() {
              (this as any).min = tmr;
              this.setAttribute('min', tmr);
            });
            dInput.addEventListener('click', function() {
              (this as any).min = tmr;
              this.setAttribute('min', tmr);
            });
          }
        }, 10);
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

        if (current === 0) {
          renderStep1();
        } else if (current === 1) {
          renderStep2();
        } else if (current === 2) {
          renderStep3();
        } else if (current === 3) {
          renderStep4();
        } else if (current === 4) {
          renderStep5();
        } else {
          renderPlaceholder(s);
        }

        const isLast = current === steps.length - 1;
        const isFirst = current === 0;

        // Desktop bar
        if (btnPrev) btnPrev.style.visibility = isFirst ? 'hidden' : 'visible';
        const nextBtnEl = document.getElementById('btn-next-step');
        if (nextBtnEl) {
          nextBtnEl.innerHTML = isLast
            ? \`สั่งซื้อ\`
            : \`ถัดไป\`;
        }
        // Sticky bar
        if (stickyPrev) stickyPrev.style.visibility = isFirst ? 'hidden' : 'visible';
        if (stickyNext) {
          stickyNext.innerHTML = isLast
            ? \`สั่งซื้อ\`
            : \`ถัดไป\`;
        }
      }

      function nextStep() {
        // ขั้น 1 ต้องเลือกจำนวนและสี
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
            const msg = !selectedPaper ? 'กรุณาเลือกกระดาษห่อช่อดอกไม้' : 'กรุณาเลือกรูปทรงการห่อ';
            showToast(msg);
            return;
          }
        } else if (current === 4) {
          if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !deliveryDate || !deliveryTime) {
            showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            const inputs = ['ipt-name', 'ipt-phone', 'ipt-address', 'ipt-date', 'ipt-time'];
            inputs.forEach(id => {
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
          generateReceipt();
        }
      }

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
        let total = basePrice;
        let layerAdd = 0;
        const layerUnitPrice = getLayerExtraPrice();
        if (selectedLayers.length > 1 && layerUnitPrice > 0) {
          layerAdd = (selectedLayers.length - 1) * layerUnitPrice;
          total += layerAdd;
        }
        let decorAdd = selectedDecorations.reduce((acc, id) => {
          const item = ROSE_DECORATIONS.find(x => x.id === id);
          return acc + (item ? item.price : 0);
        }, 0);
        total += decorAdd;

        const colorNames = selectedColors.map(id => ROSE_COLORS.find(x => x.id === id).name).join(', ');
        let layerNames = selectedLayers.map(id => ROSE_LAYERS.find(x => x.id === id).name).join(', ');
        if (!layerNames) layerNames = '-';
        const paperName = selectedPaper ? ROSE_PAPERS.find(x => x.id === selectedPaper).name : '-';
        const shapeName = selectedShape ? ROSE_SHAPES.find(x => x.id === selectedShape).name : '-';
        const decorNames = selectedDecorations.length > 0 ? selectedDecorations.map(id => ROSE_DECORATIONS.find(x => x.id === id).name).join(', ') : '-';
        const orderId = String(Math.floor(Math.random() * 899999 + 100000));

        const modal = document.getElementById('receipt-modal');
        const rc = document.getElementById('receipt-card');
        if (rc && modal) {
          rc.innerHTML = \`
            <div class="receipt-header">
              <h2>Glitter Rose</h2>
              <p>ออเดอร์ #GR\${orderId}</p>
            </div>
            
            <div class="r-row bold" style="margin-top:0;">
              <span>กุหลาบ \${selectedQty} ดอก</span><span>\${basePrice.toLocaleString()} ฿</span>
            </div>
            <div class="r-row" style="color:var(--text-muted);"><span>สี: \${colorNames}</span><span></span></div>
            
            <div class="r-row bold">
              <span>รองช่อ</span><span>\${layerAdd > 0 ? '+' + layerAdd.toLocaleString() + ' ฿' : 'ฟรี'}</span>
            </div>
            <div class="r-row" style="color:var(--text-muted);"><span>\${layerNames}</span><span></span></div>

            <div class="r-row bold">
              <span>กระดาษและทรงห่อ</span><span>ฟรี</span>
            </div>
            <div class="r-row" style="color:var(--text-muted);"><span>\${paperName} · ทรง\${shapeName}</span><span></span></div>

            <div class="r-row bold">
              <span>ของตกแต่ง</span><span>\${decorAdd > 0 ? '+' + decorAdd.toLocaleString() + ' ฿' : (selectedDecorations.length > 0 ? 'ฟรี' : '-')}</span>
            </div>
            <div class="r-row" style="color:var(--text-muted);"><span>\${decorNames}</span><span></span></div>

            <div class="r-row total">
              <span>ยอดชำระสุทธิ</span><span>\${total.toLocaleString()} ฿</span>
            </div>

            <div class="r-info">
              <div style="margin-bottom:6px;"><b>ผู้รับ:</b> \${customerName}</div>
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
        const editingId = localStorage.getItem('editing_cart_id');
        
        if (editingId) {
          // If editing, it's already auto-saved via saveState()
          // Just clean up and go back
          localStorage.removeItem('editing_cart_id');
          localStorage.removeItem(STORAGE_KEY);
          window.location.href = '/cart';
          return;
        }

        // Calculate price and description for NEW item
        const total = calculateTotalPrice();
        const colorNames = selectedColors.map(id => ROSE_COLORS.find(x => x.id === id).name).join(', ');
        const customItem = {
          id: 'custom_' + Date.now(),
          type: 'glitter_rose',
          name: 'ช่อกุหลาบกริตเตอร์ (' + (selectedQty || 0) + ' ดอก)',
          price: total,
          qty: 1,
          details: 'สี: ' + colorNames,
          config: {
            selectedQty, selectedColors, selectedLayers, 
            selectedPaper, selectedShape, selectedDecorations,
            customerName, customerPhone, customerAddress, 
            deliveryDate, deliveryTime, additionalNote,
            current, maxStepReached, basePrice
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

      loadState();

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
    <nav class="navbar" style="padding-left: 20px; padding-right: 20px;">
      <button class="back-btn-circle" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <a href="/" class="nav-logo" style="position: absolute; left: 50%; transform: translateX(-50%);">"Bear has flower"</a>
    </nav>

    <div class="page-wrap">

      <!-- Heading -->
      <div class="page-heading">
        <h1>"Glitter Rose"</h1>
        <p class="subtitle">ออกแบบดอกกุหลาบกลิตเตอร์ของคุณ</p>
      </div>

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
            <span class="step-label">Address</span>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary" id="order-summary">
        <span class="summary-label">🛒 สินค้าที่เลือก</span>
        <div class="summary-chips" id="summary-chips">
          <span class="summary-empty">ยังไม่ได้เลือกสินค้า...</span>
        </div>
      </div>

      <!-- Selection Bar (Desktop/iPad) -->
      <div class="selection-bar">
        <div class="bar-step-info">
          ขั้นตอนที่ <strong id="step-num">1</strong> / 5 &nbsp;—&nbsp; <strong id="step-name">Rose</strong>
        </div>
        <div class="btn-group">
          <button class="btn-back" id="btn-prev-step" onclick="prevStep()">← ก่อนหน้า</button>
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
