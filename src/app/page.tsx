'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we've already authenticated in this session to speed up repeat visits
    const alreadyChecked = typeof window !== 'undefined' && sessionStorage.getItem('auth_checked');
    
    if (alreadyChecked && auth.currentUser) {
      setUser(auth.currentUser);
      setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_checked', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const initApp = () => {
      // ===== Slideshow =====
      let currentSlide = 0;
      const slidesEl = document.getElementById('slides');
      const dots = document.querySelectorAll('.dot');
      const totalSlides = document.querySelectorAll('.slide').length;

      function updateSlide() {
        if (slidesEl) slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
      }
      function moveSlide(dir) {
        currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
        updateSlide();
      }

      const slideshowInterval = setInterval(() => moveSlide(1), 5000);

      // Touch swipe on banner
      const bannerEl = document.querySelector('.banner-container');
      if (bannerEl) {
        let tsX = 0;
        bannerEl.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
        bannerEl.addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - tsX;
          if (Math.abs(dx) > 40) moveSlide(dx < 0 ? 1 : -1);
        }, { passive: true });
      }

      // ===== Cart & Wishlist UI Update =====
      const CART_KEY = 'bear_flower_cart';
      const WISHLIST_KEY = 'bear_flower_wishlist';

      const updateCartUI = () => {
        try {
          const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
          const count = cart.reduce((acc, item) => acc + (item.qty || 1), 0);
          const cartEl = document.getElementById('cart-count');
          if (cartEl) cartEl.textContent = count;
        } catch (e) { }
      };

      const updateWishlistBadge = () => {
        try {
          const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
          const badge = document.getElementById('tab-wishlist-badge');
          if (badge) {
            badge.textContent = list.length;
            badge.style.display = list.length > 0 ? 'flex' : 'none';
          }
        } catch (e) { }
      };

      updateCartUI();
      updateWishlistBadge();

      // Listeners for cart/wishlist
      const cartBtn = document.getElementById('nav-cart-btn');
      if (cartBtn) cartBtn.onclick = () => { window.location.href = '/cart'; };

      document.querySelectorAll('.product-wishlist').forEach(btn => {
        btn.onclick = function () {
          const card = this.closest('.product-card');
          const id = card ? card.querySelector('.product-name')?.textContent?.trim().replace(/\s+/g, '_') : '';
          const name = card ? card.querySelector('.product-name')?.textContent?.trim() : '';

          let wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
          const exists = wishlist.find(i => i.id === id);
          if (exists) {
            wishlist = wishlist.filter(i => i.id !== id);
            this.querySelector('path')?.setAttribute('fill', 'none');
            this.style.color = '';
            this.style.borderColor = '';
          } else {
            wishlist.push({ id, name });
            this.querySelector('path')?.setAttribute('fill', '#e05c7a');
            this.style.color = '#e05c7a';
            this.style.borderColor = '#e05c7a';
          }
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
          updateWishlistBadge();
        };
      });

      // ===== Hamburger / Drawer =====
      const hamburger = document.getElementById('hamburger-btn');
      const drawer = document.getElementById('mobile-drawer');
      const backdrop = document.getElementById('drawer-backdrop');
      const navbar = document.querySelector('.navbar');

      if (hamburger && drawer && backdrop) {
        const toggleDrawer = () => {
          const isOpen = drawer.classList.contains('open');
          if (isOpen) {
            drawer.classList.remove('open');
            hamburger.classList.remove('open');
            navbar?.classList.remove('drawer-open');
            document.body.style.overflow = '';
          } else {
            drawer.classList.add('open');
            hamburger.classList.add('open');
            navbar?.classList.add('drawer-open');
            document.body.style.overflow = 'hidden';
          }
        };
        const closeDrawer = () => {
          drawer.classList.remove('open');
          hamburger.classList.remove('open');
          navbar?.classList.remove('drawer-open');
          document.body.style.overflow = '';
        };

        hamburger.onclick = toggleDrawer;
        backdrop.onclick = closeDrawer;
        drawer.querySelectorAll('.drawer-link').forEach(a => a.onclick = closeDrawer);
      }

      // ===== Bottom Tab Bar =====
      const tabItems = document.querySelectorAll('.tab-item');
      tabItems.forEach(tab => {
        tab.onclick = () => {
          tabItems.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        };
      });

      // ===== Smooth Scroll =====
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.onclick = function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        };
      });

      // Cleanup on re-run
      return () => {
        clearInterval(slideshowInterval);
      };
    };

    // Delay slightly to ensure DOM is ready after re-render
    const cleanup = initApp();

    // Export logout to window for HTML onclick
    window.handleLogout = async () => {
      if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        await signOut(auth);
        window.location.reload();
      }
    };

    return cleanup;
  }, [user, loading]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffafb' }}>
      <div style={{ color: '#db8a9e', fontSize: '1.2rem', fontFamily: 'serif', fontStyle: 'italic' }}>Bear has flower...</div>
    </div>
  );

  return <div dangerouslySetInnerHTML={{
    __html: `

  <!-- Navbar -->
  <nav class="navbar">
    <a href="/" class="nav-logo">"Bear has flower"</a>
    <ul class="nav-links">
      <li><a href="#categories">คอลเลกชัน</a></li>
      <li><a href="#products">สินค้า</a></li>
      <li><a href="#">เกี่ยวกับเรา</a></li>
      <li><a href="/contact">ติดต่อ</a></li>
    </ul>
    <div style="display:flex;align-items:center;gap:4px;">
      <div class="nav-cart" id="nav-cart-btn" title="ตะกร้าสินค้า">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span class="nav-cart-badge" id="cart-count">0</span>
      </div>
      <button class="nav-hamburger" id="hamburger-btn" aria-label="เมนู">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <!-- Mobile Drawer -->
  <div class="mobile-drawer" id="mobile-drawer">
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <div class="drawer-panel">
      <div class="drawer-logo">"Bear has flower"</div>
      
      ${user ? `
        <div style="padding: 10px 10px; margin-bottom: 10px; font-size: 1rem; color: #a08a8e; border-bottom: 1px solid #fdf5f6; text-align: left;">
          ID: <span style="color: #db8a9e; font-weight: 600;">${user.email.split('@')[0]}</span>
        </div>
      ` : ''}

      <a href="#categories" class="drawer-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
        คอลเลกชัน
      </a>
      <a href="#products" class="drawer-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
        <path d="M4 8h16l-1.5 13H5.5L4 8z"></path>
        <path d="M16 8v-2a4 4 0 0 0-8 0v2"></path>
        </svg>
        สินค้า
      </a>
      <a href="#" class="drawer-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        เกี่ยวกับเรา
      </a>
      <a href="/contact" class="drawer-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
        <path
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z">
        </path>
        </svg>
        ติดต่อ
      </a>

      <div style="border-top: 1px solid #fdf5f6;">
        ${user ? `
          <a href="javascript:void(0)" onclick="handleLogout()" class="drawer-link" style="color: #e53935;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            ออกจากระบบ
          </a>
        ` : `
          <a href="/login" class="drawer-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            เข้าสู่ระบบ / สมัครสมาชิก
          </a>
        `}
      </div>
    </div>
  </div>

  <!-- Bottom Tab Bar (Mobile) -->
  <div class="bottom-tab-bar" id="bottom-tab-bar">
    <div class="tab-inner">
      <a href="#" class="tab-item active" id="tab-home">
        <span class="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="nav-svg">
            <path class="icon-fill" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </span>
        <span class="tab-label">หน้าหลัก</span>
      </a>
      <a href="#categories" class="tab-item" id="tab-cat">
        <span class="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="nav-svg">
            <rect class="icon-fill" x="3" y="3" width="7" height="7" rx="1.5"></rect>
            <rect class="icon-fill" x="14" y="3" width="7" height="7" rx="1.5"></rect>
            <rect class="icon-fill" x="14" y="14" width="7" height="7" rx="1.5"></rect>
            <rect class="icon-fill" x="3" y="14" width="7" height="7" rx="1.5"></rect>
          </svg>
        </span>
        <span class="tab-label">คอลเลกชัน</span>
      </a>
      <a href="#products" class="tab-item" id="tab-prod">
        <span class="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="nav-svg">
            <path class="icon-fill" d="M4 8h16l-1.5 13H5.5L4 8z"></path>
            <path d="M16 8v-2a4 4 0 0 0-8 0v2"></path>
          </svg>
        </span>
        <span class="tab-label">สินค้า</span>
      </a>
      <a href="/wishlist" class="tab-item" id="tab-wishlist-tab">
        <span class="tab-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="nav-svg">
            <path class="icon-fill" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span id="tab-wishlist-badge" style="position:absolute;top:-6px;right:-8px;background:var(--rose-gold);color:#fff;border-radius:50%;width:16px;height:16px;font-size:.6rem;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;display:none;">0</span>
        </span>
        <span class="tab-label">ถูกใจ</span>
      </a>
    </div>
  </div>

  <!-- Hero -->
  <section class="hero">
    <h1 class="brand-title">Bear has flower</h1>
    <p class="brand-sub">- หมีมีดอกไม้ -</p>

    <div class="banner-container">
      <div class="slides" id="slides">
        <div class="slide">
          <div class="slide-label">Glitter Rose Collection</div>
        </div>
        <div class="slide">
          <div class="slide-label">Wire Velvet Flowers</div>
        </div>
        <div class="slide">
          <div class="slide-label">Bespoke Bouquets</div>
        </div>
      </div>
      <button class="banner-btn prev" id="btn-prev" onclick="moveSlide(-1)" aria-label="ก่อนหน้า">&#10094;</button>
      <button class="banner-btn next" id="btn-next" onclick="moveSlide(1)" aria-label="ถัดไป">&#10095;</button>
      <div class="banner-dots" id="banner-dots">
        <div class="dot active" onclick="goSlide(0)"></div>
        <div class="dot" onclick="goSlide(1)"></div>
        <div class="dot" onclick="goSlide(2)"></div>
      </div>
    </div>
  </section>

  <!-- Welcome -->
  <section class="welcome-section">
    <div class="divider-line">
      <span class="welcome-title">Welcome</span>
    </div>
    <p class="slogan">"ให้ดอกไม้ของเรา แทนความทรงจำที่ไม่มีวันเหี่ยวเฉา"</p>
    <a href="/glitter_rose" class="order-btn" id="design-btn">
      ออกแบบช่อดอกไม้
    </a>
  </section>

  <!-- Category Section -->
  <div class="section-heading" id="categories">
    <h2>Collections</h2>
    <p class="subtitle">คอลเลกชัน</p>
  </div>

  <section class="section-two">
    <div class="section-two-content">

      <a href="/glitter_rose" class="category-card fade-in" id="cat-glitter">
        <div class="cat-bg cat-bg-1"></div>
        <div class="cat-deco"></div>
        <div class="cat-overlay">
          <h3 class="cat-title">ดอกกุหลาบ<br>กลิตเตอร์</h3>
        </div>
      </a>

      <div class="category-card fade-in" id="cat-velvet" style="animation-delay:.1s">
        <div class="cat-bg cat-bg-2"></div>
        <div class="cat-deco"></div>
        <div class="cat-overlay">
          <h3 class="cat-title">ดอกไม้ลวด<br>กำมะหยี่</h3>
        </div>
      </div>

    </div>
  </section>

  <!-- Products Section -->
  <div class="section-heading" id="products">
    <h2>Our Products</h2>
    <p class="subtitle">สินค้าของเรา</p>
  </div>

  <section class="section-three">
    <div class="product-grid">

      <!-- Product 1 -->
      <article class="product-card fade-in" style="animation-delay:.05s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌹</div>
          <span class="product-badge">50 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">กุหลาบกลิตเตอร์ชมพู</div>
          <div class="product-desc">ดอกกุหลาบประกาย พร้อมริบบิ้นทอง ห่อกระดาษลาย</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 2 -->
      <article class="product-card fade-in" style="animation-delay:.1s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌸</div>
          <span class="product-badge">30 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">กุหลาบกลิตเตอร์แดง</div>
          <div class="product-desc">คลาสสิกสีแดงเลือดนกประกายทอง สวยงามโดดเด่น</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 3 -->
      <article class="product-card fade-in" style="animation-delay:.15s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌼</div>
          <span class="product-badge">20 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ดอกไม้ลวดกำมะหยี่ม่วง</div>
          <div class="product-desc">ดอกไม้เพ้อฝัน สีม่วงลึก กำมะหยี่นุ่มละเอียด</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 4 -->
      <article class="product-card fade-in" style="animation-delay:.2s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌺</div>
          <span class="product-badge">50 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ช่อใหญ่พิเศษ</div>
          <div class="product-desc">ช่อดอกไม้ขนาดใหญ่ พร้อมบรรจุภัณฑ์เกรด A</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 5 -->
      <article class="product-card fade-in" style="animation-delay:.25s">
        <div class="product-image-wrap">
          <div class="product-placeholder">💐</div>
          <span class="product-badge">15 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ช่อมินิหวานใจ</div>
          <div class="product-desc">ช่อเล็กน้อยน่ารัก เหมาะเป็นของขวัญวาเลนไทน์</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 6 -->
      <article class="product-card fade-in" style="animation-delay:.3s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌷</div>
          <span class="product-badge">40 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ทิวลิปกลิตเตอร์</div>
          <div class="product-desc">ทิวลิปประกายสีพาสเทล ดูอ่อนหวานเหมือนนิทาน</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 7 -->
      <article class="product-card fade-in" style="animation-delay:.35s">
        <div class="product-image-wrap">
          <div class="product-placeholder">🌻</div>
          <span class="product-badge">25 ดอก</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ทานตะวันกำมะหยี่</div>
          <div class="product-desc">สีเหลืองอบอุ่น สว่างเหมือนแสงตะวัน นุ่มกำมะหยี่</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

      <!-- Product 8 -->
      <article class="product-card fade-in" style="animation-delay:.4s">
        <div class="product-image-wrap">
          <div class="product-placeholder">✨</div>
          <span class="product-badge">Custom</span>
          <button class="product-wishlist" aria-label="บันทึก">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
        <div class="product-info">
          <div class="product-name">ออกแบบเอง (Custom)</div>
          <div class="product-desc">เลือกสี ดอก และสไตล์ได้ตามใจ สร้างความทรงจำของคุณ</div>
          <div class="product-footer">
            <div class="product-price">— <span>บาท</span></div>
            <button class="add-cart-btn" onclick="addToCart(this)" aria-label="เพิ่มในตะกร้า">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <g stroke="white" stroke-width="2">
                  <path stroke-linejoin="round"
                    d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                  <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                </g>
              </svg>
            </button>
          </div>
        </div>
      </article>

    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-brand">"Bear has flower"</div>
    <div class="footer-tagline">Luxury Flower Studio</div>
    <ul class="footer-links">
      <li><a href="#">คอลเลกชัน</a></li>
      <li><a href="#">เกี่ยวกับเรา</a></li>
      <li><a href="/contact">ติดต่อ</a></li>
      <li><a href="#">Instagram</a></li>
    </ul>
    <p class="footer-copy">&copy; 2025 Bear has flower. All rights reserved.</p>
  </footer>

  ` }} />;
}
