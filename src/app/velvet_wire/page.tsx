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
          box-sizing: content-box !important;
          width: 315px !important;
        }
        .flatpickr-days {
          width: 315px !important;
        }
        .dayContainer {
          width: 315px !important;
          min-width: 315px !important;
          max-width: 315px !important;
        }
        .flatpickr-day {
          max-width: 45px !important;
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
          transition: none !important;
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
      function showToast(msg) {
        let box = document.getElementById('toast-box');
        if (!box) {
          box = document.createElement('div');
          box.id = 'toast-box';
          box.style.position = 'fixed';
          box.style.top = '20px';
          box.style.left = '50%';
          box.style.transform = 'translateX(-50%)';
          box.style.background = 'rgba(0,0,0,0.8)';
          box.style.color = '#fff';
          box.style.padding = '10px 20px';
          box.style.borderRadius = '20px';
          box.style.zIndex = '99999';
          box.style.fontSize = '14px';
          box.style.opacity = '0';
          box.style.transition = 'opacity 0.3s ease';
          box.style.pointerEvents = 'none';
          document.body.appendChild(box);
        }
        box.textContent = msg;
        box.style.opacity = '1';
        setTimeout(() => { box.style.opacity = '0'; }, 3000);
      }

      let presetProduct = null;
      let basePrice = 0;

      let customerName = '';
      let customerPhone = '';
      let customerAddress = '';
      let deliveryDate = '';
      let deliveryTime = '';
      let additionalNote = '';
      let productCoverImage = '';

      const STORAGE_KEY = 'bear_flower_velvet_v1';

      function saveState() {
        const state = {
          customerName, customerPhone, customerAddress, deliveryDate, deliveryTime, additionalNote,
          productCoverImage
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      function loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const s = JSON.parse(saved);
            customerName = s.customerName || '';
            customerPhone = s.customerPhone || '';
            customerAddress = s.customerAddress || '';
            deliveryDate = s.deliveryDate || '';
            deliveryTime = s.deliveryTime || '';
            additionalNote = s.additionalNote || '';
            productCoverImage = s.productCoverImage || '';
          } catch (err) { console.error('Failed to parse saved state', err); }
        }
        renderForm();
      }

      function updateSummary() {
        const container = document.getElementById('summary-chips');
        if (!container) return;
        
        if (!presetProduct) {
          container.innerHTML = '<span class="summary-empty">กำลังโหลดข้อมูลสินค้า...</span>';
          return;
        }

        container.innerHTML = \`<span class="summary-chip" style="display:flex; align-items:center; gap:8px;">
            \${presetProduct.coverImage ? \`<img src="\${presetProduct.coverImage}" style="width:30px; height:30px; object-fit:cover; border-radius:50%;" />\` : '🌸'}
            <span>\${presetProduct.name}</span>
          </span>\`;
          
        const sv = document.getElementById('sticky-price-val');
        if (sv) sv.textContent = basePrice.toLocaleString();
        const dv = document.getElementById('desktop-price-val');
        if (dv) dv.textContent = basePrice.toLocaleString();
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

      function renderForm() {
        const mainBox = document.getElementById('main-box');
        if(!mainBox) return;
        
        mainBox.style.justifyContent = 'flex-start';
        const tmr = getTomorrowStr();   
        
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
              <label>วันที่และเวลาจัดส่ง</label>
              <input type="text" id="ipt-date" placeholder="เลือกวันที่และเวลา" readonly style="font-size: 16px; background-color: #fff; cursor: pointer;">
              <div class="form-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> สั่งล่วงหน้าอย่างน้อย 1 วัน
              </div>
            </div>

            <div class="form-group">
              <label>หมายเหตุ (เพิ่มเติม)</label>
              <textarea id="ipt-note" placeholder="เช่น ขอการ์ดวันเกิด เขียนว่า..." oninput="updateFormState()" style="font-size: 16px;">\${additionalNote}</textarea>
            </div>
          </div>
        \`;

        // Init flatpickr
        setTimeout(() => {
          if (window.flatpickr && document.getElementById('ipt-date')) {
            const tomorrowStr = getTomorrowStr();
            const initialMinTime = (deliveryDate === tomorrowStr) ? "09:00" : "00:00";

            window.flatpickr('#ipt-date', {
              enableTime: true,
              dateFormat: "Y-m-d H:i",
              minDate: tomorrowStr,
              minTime: initialMinTime,
              time_24hr: true,
              locale: "th",
              defaultHour: 9,
              defaultMinute: 0,
              disableMobile: true,
              defaultDate: (deliveryDate && deliveryTime) ? (deliveryDate + ' ' + deliveryTime) : null,
              onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                  const d = selectedDates[0];
                  const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                  
                  if (dStr === tomorrowStr) {
                    instance.set('minTime', '09:00');
                    if (d.getHours() < 9) {
                      d.setHours(9, 0, 0, 0);
                      instance.setDate(d, false);
                    }
                  } else {
                    instance.set('minTime', '00:00');
                  }
                  
                  const currentD = instance.selectedDates[0] || d;
                  const currentDStr = currentD.getFullYear() + '-' + String(currentD.getMonth() + 1).padStart(2, '0') + '-' + String(currentD.getDate()).padStart(2, '0');
                  const tStr = String(currentD.getHours()).padStart(2, '0') + ':' + String(currentD.getMinutes()).padStart(2, '0');
                  
                  deliveryDate = currentDStr;
                  deliveryTime = tStr;
                  const el = document.getElementById('ipt-date');
                  if (el) el.value = currentDStr + ' ' + tStr;
                }
                updateFormState();
              }
            });
          }
        }, 100);
      }

      function finishOrder() {
        if (!presetProduct) {
          showToast('ไม่พบข้อมูลสินค้า');
          return;
        }
        if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim() || !deliveryDate || !deliveryTime) {
          showToast('กรุณากรอกข้อมูลจัดส่งให้ครบถ้วน');
          return;
        }
        const tomorrowStr = getTomorrowStr();
        if (deliveryDate === tomorrowStr && deliveryTime < '09:00') {
          showToast('หากจัดส่งวันพรุ่งนี้ กรุณาเลือกเวลารับตั้งแต่ 09:00 น. เป็นต้นไป');
          return;
        }

        const CART_KEY = 'bear_flower_cart';
        
        const customItem = {
          id: 'vw_' + Date.now(),
          type: 'velvet_flower',
          name: presetProduct.name,
          price: basePrice,
          qty: 1,
          details: presetProduct.description || 'ดอกไม้ลวดกำมะหยี่',
          coverImage: presetProduct.coverImage,
          config: {
            customerName, customerPhone, customerAddress, 
            deliveryDate, deliveryTime, additionalNote,
            presetId: presetProduct.id
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
        
        sessionStorage.setItem('order_success_toast', '1');
        window.location.href = '/cart';
      }

      async function loadPresetIfNeeded() {
        const urlParams = new URLSearchParams(window.location.search);
        const presetId = urlParams.get('preset');
        if (presetId && window.fetchPresetProductHelper) {
          try {
            showToast('กำลังโหลดแบบสินค้าสำเร็จรูป...');
            const p = await window.fetchPresetProductHelper(presetId);
            if (p) {
              presetProduct = p;
              presetProduct.id = presetId;
              basePrice = p.price || 0;
              productCoverImage = p.coverImage || '';

              updateSummary();
              renderForm();

              showToast('โหลดแบบสินค้าสำเร็จรูปเสร็จสิ้น!');
            } else {
              showToast('ไม่พบแบบสินค้าดังกล่าว');
            }
          } catch(e) {
            console.error('Failed to load preset:', e);
            showToast('เกิดข้อผิดพลาดในการโหลดแบบสินค้า');
          }
        }
      }

      // Initialize
      loadState();
      loadPresetIfNeeded();

      if (sessionStorage.getItem('order_success_toast')) {
        sessionStorage.removeItem('order_success_toast');
        setTimeout(() => {
          showToast('เพิ่มลงตะกร้าเรียบร้อยแล้ว!');
        }, 300);
      }

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
        <h1>"Velvet Wire"</h1>
        <p class="subtitle">ออกแบบดอกไม้ลวดกำมะหยี่ของคุณ</p>
      </div>

      <!-- Order Summary -->
      <div class="order-summary" id="order-summary" style="margin-top: 20px;">
        <span class="summary-label">🛒 สินค้าที่เลือก</span>
        <div class="summary-chips" id="summary-chips">
          <span class="summary-empty">กำลังโหลด...</span>
        </div>
      </div>

      <!-- Selection Bar (Desktop/iPad) -->
      <div class="selection-bar">
        <div class="bar-step-info">
          ราคา: <strong id="desktop-price-val" style="color: var(--rose-gold); font-size: 1.4rem;">0</strong> บาท
        </div>
        <div class="btn-group">
          <button class="btn-next" onclick="finishOrder()" style="padding: 10px 30px;">
            เพิ่มลงตะกร้า
          </button>
        </div>
      </div>

      <!-- Main Box -->
      <div class="main-box" id="main-box" style="margin-top: 30px;"></div>

    </div><!-- /.page-wrap -->

    <!-- Sticky Bottom Bar (Mobile) -->
    <div class="sticky-bottom" id="sticky-bottom">
      <div class="sticky-price">
        <span id="sticky-price-val">0</span><small>บาท</small>
      </div>
      <div class="sticky-btn-row">
        <button class="sticky-next" onclick="finishOrder()" style="width: 100%;">
          เพิ่มลงตะกร้า
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>
    </div>

    ` }} />;
}
