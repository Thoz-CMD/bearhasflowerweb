'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { checkIsAdmin } from '@/lib/admin';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we've already authenticated in this session to speed up repeat visits
    const alreadyChecked = typeof window !== 'undefined' && sessionStorage.getItem('auth_checked');

    if (alreadyChecked && auth.currentUser) {
      setUser(auth.currentUser);
      setLoading(false);
      checkIsAdmin(auth.currentUser.uid, auth.currentUser.displayName, auth.currentUser.email).then(res => setIsAdmin(res));
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const res = await checkIsAdmin(u.uid, u.displayName, u.email);
        setIsAdmin(res);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_checked', 'true');
      }
    });
    return () => unsubscribe();
  }, []);

  // Expose React Firebase helper for fetching products on Home page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).fetchDynamicProductsHelper = async () => {
        try {
          const { db } = await import('@/lib/firebase');
          const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          const products: any[] = [];
          snap.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
          });
          return products;
        } catch (e) {
          console.error("fetchDynamicProductsHelper Error:", e);
          return [];
        }
      };
    }
  }, []);

  useEffect(() => {
    if (loading) return;

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

    if (typeof window !== 'undefined') {
      (window as any).adminEditProduct = function (productId: string) {
        if (!isAdmin) return;
        const cache = (window as any).__adminProductCache || {};
        const product = cache[productId];
        if (!product) {
          (window as any).showBeautifulAlert('ไม่พบข้อมูลสินค้า', 'error', 'แก้ไขไม่สำเร็จ');
          return;
        }
        sessionStorage.setItem('bear_flower_edit_product', JSON.stringify(product));
        sessionStorage.setItem('bear_flower_edit_product_id', productId);
        window.location.href = '/admin/create-product?edit=true';
      };

      (window as any).adminDeleteProduct = async function (productId: string, buttonEl: any) {
        if (!isAdmin) return;
        const confirmed = await (window as any).showBeautifulConfirm('ต้องการลบสินค้านี้หรือไม่?', 'ยืนยันการลบ');
        if (!confirmed) return;

        try {
          const { db } = await import('@/lib/firebase');
          const { doc, deleteDoc } = await import('firebase/firestore');
          await deleteDoc(doc(db, 'products', productId));
          const cache = (window as any).__adminProductCache;
          if (cache) delete cache[productId];
          const card = buttonEl?.closest('.product-card');
          if (card) card.remove();
          (window as any).showBeautifulAlert('ลบสินค้าเรียบร้อยแล้ว', 'success', 'ลบสำเร็จ');
        } catch (e) {
          console.error('Admin delete failed:', e);
          (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการลบสินค้า', 'error', 'ลบไม่สำเร็จ');
        }
      };
    }

    const initApp = () => {
      (window as any).filterProducts = function (type: string) {
        const section = document.getElementById('products');
        if (section) {
          const yOffset = -80; // account for navbar
          const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        
        document.querySelectorAll('.product-card').forEach((card: any) => {
          if (type === 'all' || card.getAttribute('data-product-type') === type) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      };

      // ===== Slideshow =====
      let currentSlide = 0;
      const slidesEl = document.getElementById('slides');
      const dots = document.querySelectorAll('.dot');
      const totalSlides = document.querySelectorAll('.slide').length;

      function updateSlide() {
        if (slidesEl) slidesEl.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
      }
      function moveSlide(dir: number) {
        currentSlide = (currentSlide + dir + totalSlides) % totalSlides;
        updateSlide();
      }
      function goSlide(n: number) {
        currentSlide = n;
        updateSlide();
      }
      (window as any).moveSlide = moveSlide;
      (window as any).goSlide = goSlide;

      const slideshowInterval = setInterval(() => moveSlide(1), 5000);

      // Touch swipe on banner
      const bannerEl = document.querySelector('.banner-container');
      if (bannerEl) {
        let tsX = 0;
        bannerEl.addEventListener('touchstart', (e: any) => { tsX = e.touches[0].clientX; }, { passive: true });
        bannerEl.addEventListener('touchend', (e: any) => {
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
          const count = cart.reduce((acc: number, item: any) => acc + (item.qty || 1), 0);
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

      const initializeWishlistHearts = () => {
        try {
          const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
          document.querySelectorAll('.product-wishlist').forEach((btn: any) => {
            const card = btn.closest('.product-card');
            const id = card ? card.getAttribute('data-product-id') : '';
            const exists = wishlist.some((i: any) => i.id === id);

            if (exists) {
              btn.querySelector('path')?.setAttribute('fill', '#e05c7a');
              btn.style.color = '#e05c7a';
              btn.style.borderColor = '#e05c7a';
            } else {
              btn.querySelector('path')?.setAttribute('fill', 'none');
              btn.style.color = '';
              btn.style.borderColor = '';
            }
          });
        } catch (e) { }
      };

      // ===== Load Dynamic Products from Firestore =====
      async function loadDynamicProducts() {
        if (!(window as any).fetchDynamicProductsHelper) return;
        const products = await (window as any).fetchDynamicProductsHelper();
        const grid = document.getElementById('main-product-grid');
        if (!grid || !products || products.length === 0) return;

        const WISHLIST_KEY = 'bear_flower_wishlist';
        let wishlist = [];
        try {
          wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        } catch (e) { }

        const adminCache = (window as any).__adminProductCache || {};
        (window as any).__adminProductCache = adminCache;

        products.forEach((p: any, idx: number) => {
          const cleanIdForHearts = p.id;
          const existsInWishlist = wishlist.some((item: any) => item.id === cleanIdForHearts);
          const currentLikes = Math.max(0, p.likes || 0);

          const card = document.createElement('article');
          card.className = 'product-card fade-in';
          card.style.animationDelay = (0.05 + idx * 0.05) + 's';
          card.setAttribute('data-product-id', p.id);
          adminCache[p.id] = p;

          const isVelvet = p.type === 'velvet_flower' || (p.name && p.name.includes('กำมะหยี่')) || (p.description && p.description.includes('กำมะหยี่'));
          const targetUrl = isVelvet ? '/velvet_wire?preset=' + p.id : '/glitter_rose?preset=' + p.id;
          card.setAttribute('data-product-type', isVelvet ? 'velvet' : 'glitter');

          card.innerHTML = `
            <div class="product-image-wrap" onclick="window.location.href='${targetUrl}'" style="cursor:pointer; position:relative; overflow:hidden;">
              ${p.coverImage
              ? `<img src="${p.coverImage}" alt="${p.name}" class="product-image" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:inherit;" />`
              : `<div class="product-placeholder">🌹</div>`
            }
              <span class="product-badge">${p.badge || 'แนะนำ'}</span>
              <button class="product-wishlist" aria-label="บันทึก" style="z-index: 10; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; border-radius: 20px; width: auto; height: 30px; ${existsInWishlist ? 'color:#e05c7a; border-color:#e05c7a;' : ''}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" ${existsInWishlist ? 'fill="#e05c7a"' : ''} stroke-linejoin="round" />
                </svg>
                <span class="likes-count" style="font-size: 0.72rem; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1;">${currentLikes}</span>
              </button>
            </div>
            <div class="product-info">
              <div class="product-name" onclick="window.location.href='${targetUrl}'" style="cursor:pointer;">${p.name}</div>
              <div class="product-desc" onclick="window.location.href='${targetUrl}'" style="cursor:pointer;">${p.description}</div>
              <div class="product-footer">
                <div class="product-price">${p.price?.toLocaleString()} <span>บาท</span></div>
                <button class="add-cart-btn" onclick="window.location.href='${targetUrl}'" aria-label="เพิ่มในตะกร้า">
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
          `;

          // Add wishlist toggle handler specifically for this dynamic card
          const wishlistBtn = card.querySelector('.product-wishlist') as HTMLElement;
          if (wishlistBtn) {
            wishlistBtn.onclick = function (this: any, e: any) {
              e.stopPropagation();
              const id = cleanIdForHearts;
              const name = p.name;

              let currentWishlist = [];
              try {
                currentWishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
              } catch (err) { }

              const exists = currentWishlist.find((i: any) => i.id === id);
              const countSpan = this.querySelector('.likes-count');
              let val = Math.max(0, parseInt(countSpan?.textContent || '0', 10));
              let diff = 0;

              if (exists) {
                currentWishlist = currentWishlist.filter((i: any) => i.id !== id);
                this.querySelector('path')?.setAttribute('fill', 'none');
                this.style.color = '';
                this.style.borderColor = '';
                if (countSpan) countSpan.textContent = String(Math.max(0, val - 1));
                diff = -1;
              } else {
                currentWishlist.push({ id, name });
                this.querySelector('path')?.setAttribute('fill', '#e05c7a');
                this.style.color = '#e05c7a';
                this.style.borderColor = '#e05c7a';
                if (countSpan) countSpan.textContent = String(val + 1);
                diff = 1;
              }
              localStorage.setItem(WISHLIST_KEY, JSON.stringify(currentWishlist));
              updateWishlistBadge();

              // Write to Firestore asynchronously to persist the real likes count globally
              (async () => {
                try {
                  const { db } = await import('@/lib/firebase');
                  const { doc, updateDoc, increment } = await import('firebase/firestore');
                  const productRef = doc(db, 'products', p.id);
                  await updateDoc(productRef, {
                    likes: increment(diff)
                  });
                } catch (err) {
                  console.error("Failed to update Firestore likes:", err);
                }
              })();
            };
          }

          grid.insertBefore(card, grid.firstChild);
        });

        // Initialize heart icons status for newly prepended items as well
        initializeWishlistHearts();
      }

      updateCartUI();
      updateWishlistBadge();
      initializeWishlistHearts();
      loadDynamicProducts();

      // Listeners for cart/wishlist
      const cartBtn = document.getElementById('nav-cart-btn');
      if (cartBtn) cartBtn.onclick = () => { window.location.href = '/cart'; };

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
        drawer.querySelectorAll('.drawer-link').forEach((a: any) => a.onclick = closeDrawer);
      }

      // ===== Bottom Tab Bar =====
      const tabItems = document.querySelectorAll('.tab-item');
      tabItems.forEach((tab: any) => {
        tab.onclick = () => {
          tabItems.forEach((t: any) => t.classList.remove('active'));
          tab.classList.add('active');
        };
      });

      // ===== Smooth Scroll =====
      document.querySelectorAll('a[href^="#"]').forEach((anchor: any) => {
        anchor.onclick = function (this: HTMLElement, e: any) {
          e.preventDefault();
          const href = this.getAttribute('href') || '';
          if (!href || href === '#') return;
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });

          // หากกดลิงก์ประเภทเลื่อนหน้าในหน้าต่างเมนูสไลด์ (Drawer) ให้ปิด Drawer ด้วย
          if (this.classList.contains('drawer-link')) {
            const drawer = document.getElementById('mobile-drawer');
            const hamburger = document.getElementById('hamburger-btn');
            const navbar = document.querySelector('.navbar');
            if (drawer && hamburger) {
              drawer.classList.remove('open');
              hamburger.classList.remove('open');
              navbar?.classList.remove('drawer-open');
              document.body.style.overflow = '';
            }
          }
        };
      });

      // ===== Profile Dropdown Toggle =====
      const profileBtn = document.getElementById('nav-profile-btn');
      const profileDropdown = document.getElementById('profile-dropdown');
      const clickOutsideHandler = (e: any) => {
        if (profileDropdown && profileBtn && !profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
          profileDropdown.classList.remove('show');
        }
      };
      if (profileBtn && profileDropdown) {
        profileBtn.onclick = (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('show');
        };
        document.addEventListener('click', clickOutsideHandler);
      }

      // Cleanup on re-run
      return () => {
        clearInterval(slideshowInterval);
        document.removeEventListener('click', clickOutsideHandler);
      };
    };

    // Register handleLogout on window BEFORE initApp() so it's available immediately
    (window as any).handleLogout = async () => {
      const ok = await (window as any).showBeautifulConfirm('คุณต้องการออกจากระบบใช่หรือไม่?', 'ยืนยันการออกจากระบบ');
      if (ok) {
        await signOut(auth);
        window.location.reload();
      }
    };

    // Delay slightly to ensure DOM is ready after re-render
    const cleanup = initApp();

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
    <div class="navbar-inner">
      <a href="/" class="nav-logo">"Bear has flower"</a>
      <ul class="nav-links">
        <li><a href="#categories">คอลเลกชัน</a></li>
        <li><a href="#products">สินค้า</a></li>
        <li><a href="/wishlist">ถูกใจ</a></li>
        <li><a href="/about">เกี่ยวกับเรา</a></li>
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

        <!-- Profile Menu -->
        <div class="nav-profile-container" id="nav-profile-container">
          <div class="nav-profile-btn" id="nav-profile-btn" title="บัญชีผู้ใช้">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div class="profile-dropdown" id="profile-dropdown">
            ${user ? `
              <div class="profile-dropdown-header">
                <span class="user-id-label">ผู้ใช้งาน</span>
                <span class="user-id-val">${user.email?.split('@')[0] || user.phoneNumber || 'User'}</span>
              </div>
              <div class="profile-dropdown-divider"></div>
              ${isAdmin ? `
                <a href="/admin" class="profile-dropdown-item admin-link">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                    <path d="M19.9 12.66a1 1 0 0 1 0-1.32l1.28-1.44a1 1 0 0 0 .12-1.17l-2-3.46a1 1 0 0 0-1.07-.48l-1.88.38a1 1 0 0 1-1.15-.66l-.61-1.83a1 1 0 0 0-.95-.68h-4a1 1 0 0 0-1 .68l-.56 1.83a1 1 0 0 1-1.15.66L5 4.79a1 1 0 0 0-1 .48L2 8.73a1 1 0 0 0 .1 1.17l1.27 1.44a1 1 0 0 1 0 1.32L2.1 14.1a1 1 0 0 0-.1 1.17l2 3.46a1 1 0 0 0 1.07.48l1.88-.38a1 1 0 0 1 1.15.66l.61 1.83a1 1 0 0 0 1 .68h4a1 1 0 0 0 .95-.68l.61-1.83a1 1 0 0 1 1.15-.66l1.88.38a1 1 0 0 0 1.07-.48l2-3.46a1 1 0 0 0-.12-1.17ZM18.41 14l.8.9l-1.28 2.22l-1.18-.24a3 3 0 0 0-3.45 2L12.92 20h-2.56L10 18.86a3 3 0 0 0-3.45-2l-1.18.24l-1.3-2.21l.8-.9a3 3 0 0 0 0-4l-.8-.9l1.28-2.2l1.18.24a3 3 0 0 0 3.45-2L10.36 4h2.56l.38 1.14a3 3 0 0 0 3.45 2l1.18-.24l1.28 2.22l-.8.9a3 3 0 0 0 0 3.98m-6.77-6a4 4 0 1 0 4 4a4 4 0 0 0-4-4m0 6a2 2 0 1 1 2-2a2 2 0 0 1-2 2"></path>
                  </svg>
                  <span>ระบบหลังบ้าน</span>
                </a>
              ` : ''}
              <button class="profile-dropdown-item logout-btn" onclick="handleLogout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>ออกจากระบบ</span>
              </button>
            ` : `
              <div class="profile-dropdown-header no-border">
                <span class="welcome-text">ยินดีต้อนรับ</span>
              </div>
              <a href="/login" class="profile-dropdown-item login-link">
                <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
              </a>
            `}
          </div>
        </div>

        <button class="nav-hamburger" id="hamburger-btn" aria-label="เมนู">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Drawer -->
  <div class="mobile-drawer" id="mobile-drawer">
    <div class="drawer-backdrop" id="drawer-backdrop"></div>
    <div class="drawer-panel">
      <div class="drawer-logo">"Bear has flower"</div>
      
      ${user ? `
        <div style="padding: 10px 10px; margin-bottom: 10px; font-size: 1rem; color: #a08a8e; border-bottom: 1px solid #fdf5f6; text-align: left;">
          ID: <span style="color: #db8a9e; font-weight: 600;">${user.email?.split('@')[0] || 'User'}</span>
        </div>
      ` : ''}

      ${isAdmin ? `
        <a href="/admin" class="drawer-link" style="color: var(--rose-gold); font-weight: 600; border-bottom: 1px dashed #fdf5f6; margin-bottom: 10px; padding-bottom: 12px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
          ระบบหลังบ้าน (Admin)
        </a>
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
      <a href="/about" class="drawer-link">
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
          <button onclick="handleLogout()" class="drawer-logout-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            ออกจากระบบ
          </button>
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

      <div class="category-card fade-in" id="cat-glitter" onclick="window.location.href='/glitter_rose'" style="cursor: pointer;">
        <div class="cat-bg cat-bg-1"></div>
        <div class="cat-deco"></div>
        <div class="cat-overlay">
          <h3 class="cat-title">ดอกกุหลาบ<br>กลิตเตอร์</h3>
        </div>
      </div>

      <div class="category-card fade-in" id="cat-velvet" onclick="filterProducts('velvet')" style="animation-delay:.1s; cursor: pointer;">
        <div class="cat-bg cat-bg-2"></div>
        <div class="cat-deco"></div>
        <div class="cat-overlay">
          <h3 class="cat-title">ดอกไม้ลวด<br>กำมะหยี่</h3>
        </div>
      </div>

    </div>
  </section>

  <!-- Products Section -->
  <div class="section-heading" id="products" onclick="filterProducts('all')" style="cursor:pointer;" title="แสดงสินค้าทั้งหมด">
    <h2>Our Products</h2>
    <p class="subtitle">สินค้าของเรา</p>
  </div>

  <section class="section-three">
    <div class="product-grid" id="main-product-grid">

    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="footer-brand">"Bear has flower"</div>
    <div class="footer-tagline">Luxury Flower Studio</div>
    <ul class="footer-links">
      <li><a href="#">คอลเลกชัน</a></li>
      <li><a href="/about">เกี่ยวกับเรา</a></li>
      <li><a href="/contact">ติดต่อ</a></li>
      <li><a href="#">Instagram</a></li>
    </ul>
    <p class="footer-copy">&copy; 2025 Bear has flower. All rights reserved.</p>
  </footer>

  ` }} />;
}
