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
          const homeState = (window as any).__homeProductsState;
          if (homeState?.allProducts) {
            homeState.allProducts = homeState.allProducts.filter((item: any) => item.id !== productId);
          }
          const rerenderProducts = (window as any).applyProductFilters;
          if (typeof rerenderProducts === 'function') {
            rerenderProducts(false);
          } else {
            const card = buttonEl?.closest('.product-card');
            if (card) card.remove();
          }
          (window as any).showBeautifulAlert('ลบสินค้าเรียบร้อยแล้ว', 'success', 'ลบสำเร็จ');
        } catch (e) {
          console.error('Admin delete failed:', e);
          (window as any).showBeautifulAlert('เกิดข้อผิดพลาดในการลบสินค้า', 'error', 'ลบไม่สำเร็จ');
        }
      };
    }

    const initApp = () => {
      const PRODUCT_PRICE_MIN = 79;
      const PRODUCT_PRICE_MAX = 2000;
      const productState = (window as any).__homeProductsState || {
        allProducts: [],
        filters: {
          type: 'all',
          minPrice: PRODUCT_PRICE_MIN,
          maxPrice: PRODUCT_PRICE_MAX,
          shipping: 'all',
          sort: 'latest',
          combined: 'all'
        },
        ui: {
          filterOpen: false
        }
      };
      (window as any).__homeProductsState = productState;
      if (!productState.ui) {
        productState.ui = { filterOpen: false };
      }

      const scrollToProductsSection = () => {
        const section = document.getElementById('products');
        if (!section) return;
        const yOffset = -80;
        const y = section.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      };

      const getProductCreatedAtMs = (product: any) => {
        if (typeof product?.createdAt?.toMillis === 'function') return product.createdAt.toMillis();
        if (typeof product?.createdAt?.seconds === 'number') return product.createdAt.seconds * 1000;
        return 0;
      };

      const getProductTypeKey = (product: any) => {
        const isVelvet = product.type === 'velvet_flower'
          || (product.name && product.name.includes('กำมะหยี่'))
          || (product.description && product.description.includes('กำมะหยี่'));
        return isVelvet ? 'velvet' : 'glitter';
      };

      const getShippingFilterKey = (product: any) => {
        const hasReadyStock = Boolean(product.readyToShip) && Number(product.stockQuantity || 0) > 0;
        if (hasReadyStock) return 'ready';
        const badgeText = String(product.badge || '');
        if (badgeText.includes('1 วัน')) return '1d';
        if (badgeText.includes('2 วัน')) return '2d';
        if (badgeText.includes('3 วัน')) return '3d';
        return 'other';
      };

      const formatPriceLabel = (value: number) => `${Number(value || 0).toLocaleString('th-TH')} บาท`;

      const getActiveFilterCount = () => {
        let count = 0;
        if (productState.filters.type !== 'all') count++;
        if (productState.filters.minPrice !== PRODUCT_PRICE_MIN || productState.filters.maxPrice !== PRODUCT_PRICE_MAX) count++;
        if (productState.filters.shipping !== 'all') count++;
        if (productState.filters.sort !== 'latest') count++;
        return count;
      };

      const updatePriceSliderVisual = () => {
        const highlight = document.getElementById('product-price-track') as HTMLElement | null;
        if (!highlight) return;
        const minPercent = ((productState.filters.minPrice - PRODUCT_PRICE_MIN) / (PRODUCT_PRICE_MAX - PRODUCT_PRICE_MIN)) * 100;
        const maxPercent = ((productState.filters.maxPrice - PRODUCT_PRICE_MIN) / (PRODUCT_PRICE_MAX - PRODUCT_PRICE_MIN)) * 100;
        highlight.style.left = `${Math.max(0, minPercent)}%`;
        highlight.style.right = `${Math.max(0, 100 - maxPercent)}%`;
      };

      const syncProductFilterUI = (visibleCount: number) => {
        const minValue = document.getElementById('price-min-value');
        const maxValue = document.getElementById('price-max-value');
        const minRange = document.getElementById('product-price-min') as HTMLInputElement | null;
        const maxRange = document.getElementById('product-price-max') as HTMLInputElement | null;
        const resultCount = document.getElementById('product-results-count');
        const activeFilterText = document.getElementById('product-active-filter-text');
        const toggleButton = document.getElementById('product-filter-toggle');
        const filterShell = document.getElementById('product-filter-shell');
        const filterPanel = document.getElementById('product-filter-panel');

        if (minValue) minValue.textContent = formatPriceLabel(productState.filters.minPrice);
        if (maxValue) maxValue.textContent = formatPriceLabel(productState.filters.maxPrice);
        if (minRange) minRange.value = String(productState.filters.minPrice);
        if (maxRange) maxRange.value = String(productState.filters.maxPrice);

        document.querySelectorAll('[data-filter-type]').forEach((button: any) => {
          const isActive = button.dataset.filterType === productState.filters.combined;
          button.classList.toggle('active', isActive);
        });

        if (resultCount) {
          const total = productState.allProducts.length;
          resultCount.textContent = total > 0
            ? `แสดง ${visibleCount.toLocaleString('th-TH')} จาก ${total.toLocaleString('th-TH')} ช่อ`
            : 'กำลังโหลดสินค้า...';
        }

        if (activeFilterText) {
          const shippingMap: Record<string, string> = {
            all: 'ทุกสถานะ',
            ready: 'ช่อพร้อมส่ง',
            '1d': 'จัดส่งใน 1 วัน',
            '2d': 'จัดส่งใน 2 วัน',
            '3d': 'จัดส่งใน 3 วัน'
          };
          const typeMap: Record<string, string> = {
            all: 'สินค้าทั้งหมด',
            glitter: 'กุหลาบกลิตเตอร์',
            velvet: 'ดอกไม้ลวดกำมะหยี่'
          };
          const sortLabel = productState.filters.sort === 'likes' ? 'เรียงตามยอดถูกใจ' : 'เรียงตามสินค้าล่าสุด';
          const summaryText = `${typeMap[productState.filters.type] || 'สินค้าทั้งหมด'} • ${formatPriceLabel(productState.filters.minPrice)} - ${formatPriceLabel(productState.filters.maxPrice)} • ${shippingMap[productState.filters.shipping] || 'ทุกสถานะ'} • ${sortLabel}`;
          activeFilterText.textContent = summaryText;

          if (toggleButton) {
            const activeCount = getActiveFilterCount();
            const toggleText = activeCount > 0
              ? `ตัวกรองสินค้า, ใช้งานอยู่ ${activeCount} ตัวกรอง, แสดง ${visibleCount.toLocaleString('th-TH')} ช่อ`
              : `ตัวกรองสินค้า, สินค้าทั้งหมด, แสดง ${visibleCount.toLocaleString('th-TH')} ช่อ`;
            toggleButton.setAttribute('title', summaryText);
            toggleButton.setAttribute('aria-label', toggleText);
          }
        }

        if (toggleButton) {
          toggleButton.setAttribute('aria-expanded', String(Boolean(productState.ui?.filterOpen)));
        }
        if (filterPanel) {
          filterPanel.setAttribute('aria-hidden', String(!Boolean(productState.ui?.filterOpen)));
        }
        if (filterShell) {
          filterShell.classList.toggle('expanded', Boolean(productState.ui?.filterOpen));
        }

        updatePriceSliderVisual();
      };

      (window as any).toggleProductFilters = function (forceState?: boolean) {
        const nextState = typeof forceState === 'boolean' ? forceState : !Boolean(productState.ui?.filterOpen);
        productState.ui.filterOpen = nextState;
        syncProductFilterUI(productState.allProducts.length || 0);
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

      const slideshowInterval = setInterval(() => moveSlide(1), 10000);

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
          if (cartEl) {
            cartEl.textContent = String(count);
            (cartEl as HTMLElement).style.display = count > 0 ? 'flex' : 'none';
          }
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

      const renderProductCards = (products: any[]) => {
        const grid = document.getElementById('main-product-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (!products || products.length === 0) {
          grid.innerHTML = `
            <div class="product-empty-state">
              <div class="product-empty-icon">Bloom</div>
              <h3>ยังไม่เจอช่อที่ตรงกับตัวกรองนี้</h3>
              <p>ลองขยับช่วงราคา หรือเปลี่ยนตัวกรองการจัดส่งและยอดถูกใจดูนะคะ</p>
            </div>
          `;
          return;
        }

        let wishlist = [];
        try {
          wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        } catch (e) { }

        const adminCache = (window as any).__adminProductCache || {};
        (window as any).__adminProductCache = adminCache;

        products.forEach((p: any, idx: number) => {
          const cleanIdForHearts = p.id;
          const existsInWishlist = wishlist.some((item: any) => item.id === cleanIdForHearts);
          const currentLikes = Math.max(0, Number(p.likes || p._likesValue || 0));
          const priceValue = Number(p.price || p._priceValue || 0);
          const productType = p._productType || getProductTypeKey(p);

          const card = document.createElement('article');
          card.className = 'product-card fade-in';
          card.style.animationDelay = (0.05 + idx * 0.05) + 's';
          card.setAttribute('data-product-id', p.id);
          card.setAttribute('data-product-type', productType);
          adminCache[p.id] = p;

          const isVelvet = productType === 'velvet';
          const targetUrl = isVelvet ? '/velvet_wire?preset=' + p.id : '/glitter_rose?preset=' + p.id;
          const isReadyToShip = Boolean(p.readyToShip);
          const stockQuantity = Number(p.stockQuantity || 0);
          const hasReadyStock = isReadyToShip && stockQuantity > 0;
          const isSoldOut = hasReadyStock
            ? false
            : Boolean(p.soldOut) || (isReadyToShip && stockQuantity <= 0) || (!isReadyToShip && p.badge === 'หมดชั่วคราว');
          const readyStockLabel = stockQuantity > 0 ? `พร้อมส่ง ${stockQuantity.toLocaleString('th-TH')} ชิ้น` : 'พร้อมส่ง';
          const badgeText = hasReadyStock ? readyStockLabel : (isSoldOut ? 'หมดชั่วคราว' : (p.badge || 'แนะนำ'));
          const badgeClass = 'product-badge' + (isSoldOut ? ' product-badge-soldout' : (badgeText.includes('พร้อมส่ง') ? ' product-badge-ready' : ''));
          const productNav = `window.location.href='${targetUrl}'`;

          card.innerHTML = `
            <div class="product-image-wrap" ${isSoldOut ? '' : `onclick="${productNav}"`} style="cursor:${isSoldOut ? 'default' : 'pointer'}; position:relative; overflow:hidden;">
              ${p.coverImage
                ? `<img src="${p.coverImage}" alt="${p.name}" class="product-image" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:inherit;" />`
                : `<div class="product-placeholder">🌹</div>`
              }
              <span class="${badgeClass}">${badgeText}</span>
              <button class="product-wishlist" aria-label="บันทึก" style="z-index: 10; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; border-radius: 20px; width: auto; height: 30px; ${existsInWishlist ? 'color:#e05c7a; border-color:#e05c7a;' : ''}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" ${existsInWishlist ? 'fill="#e05c7a"' : ''} stroke-linejoin="round" />
                </svg>
                <span class="likes-count" style="font-size: 0.72rem; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1;">${currentLikes}</span>
              </button>
            </div>
            <div class="product-info">
              <div class="product-name" ${isSoldOut ? '' : `onclick="${productNav}"`} style="cursor:${isSoldOut ? 'default' : 'pointer'};">${p.name}</div>
              <div class="product-desc" ${isSoldOut ? '' : `onclick="${productNav}"`} style="cursor:${isSoldOut ? 'default' : 'pointer'};">${p.description}</div>
              <div class="product-footer">
                <div class="product-price">${priceValue.toLocaleString('th-TH')} <span>บาท</span></div>
                <button class="add-cart-btn ${isSoldOut ? 'disabled' : ''}" ${isSoldOut ? 'disabled' : `onclick="${productNav}"`} aria-label="${isSoldOut ? 'สินค้าหมดชั่วคราว' : 'เพิ่มในตะกร้า'}">
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
              const currentValue = Math.max(0, parseInt(countSpan?.textContent || '0', 10));
              let diff = 0;

              if (exists) {
                currentWishlist = currentWishlist.filter((i: any) => i.id !== id);
                this.querySelector('path')?.setAttribute('fill', 'none');
                this.style.color = '';
                this.style.borderColor = '';
                if (countSpan) countSpan.textContent = String(Math.max(0, currentValue - 1));
                diff = -1;
              } else {
                currentWishlist.push({ id, name });
                this.querySelector('path')?.setAttribute('fill', '#e05c7a');
                this.style.color = '#e05c7a';
                this.style.borderColor = '#e05c7a';
                if (countSpan) countSpan.textContent = String(currentValue + 1);
                diff = 1;
              }

              localStorage.setItem(WISHLIST_KEY, JSON.stringify(currentWishlist));
              updateWishlistBadge();

              const productIndex = productState.allProducts.findIndex((item: any) => item.id === id);
              if (productIndex >= 0) {
                const nextLikes = Math.max(0, Number(productState.allProducts[productIndex].likes || 0) + diff);
                productState.allProducts[productIndex].likes = nextLikes;
                productState.allProducts[productIndex]._likesValue = nextLikes;
                adminCache[id] = productState.allProducts[productIndex];
                if (productState.filters.sort === 'likes') {
                  applyProductFilters(false);
                }
              }

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

          grid.appendChild(card);
        });

        initializeWishlistHearts();
      };

      const applyProductFilters = (shouldScroll: boolean = false) => {
        if (shouldScroll) scrollToProductsSection();

        const filteredProducts = productState.allProducts
          .filter((product: any) => {
            const priceValue = Number(product._priceValue ?? product.price ?? 0);
            const productType = product._productType || getProductTypeKey(product);
            const shippingKey = product._shippingKey || getShippingFilterKey(product);

            const matchType = productState.filters.type === 'all' || productType === productState.filters.type;
            const matchPrice = priceValue >= productState.filters.minPrice && priceValue <= productState.filters.maxPrice;
            const matchShipping = productState.filters.shipping === 'all' || shippingKey === productState.filters.shipping;

            return matchType && matchPrice && matchShipping;
          })
          .sort((a: any, b: any) => {
            if (productState.filters.sort === 'likes') {
              const likesDiff = Number(b._likesValue ?? b.likes ?? 0) - Number(a._likesValue ?? a.likes ?? 0);
              if (likesDiff !== 0) return likesDiff;
            }

            const createdAtDiff = Number(b._createdAtMs ?? 0) - Number(a._createdAtMs ?? 0);
            if (createdAtDiff !== 0) return createdAtDiff;

            return Number(a._originalIndex ?? 0) - Number(b._originalIndex ?? 0);
          });

        renderProductCards(filteredProducts);
        syncProductFilterUI(filteredProducts.length);
      };

      (window as any).applyProductFilters = applyProductFilters;
      (window as any).filterProducts = function (type: string) {
        productState.filters.type = type === 'velvet' || type === 'glitter' ? type : 'all';
        applyProductFilters(true);
      };
      (window as any).updateProductPriceFilter = function (bound: string, rawValue: string) {
        const nextValue = Math.max(PRODUCT_PRICE_MIN, Math.min(PRODUCT_PRICE_MAX, Number(rawValue || PRODUCT_PRICE_MIN)));
        if (bound === 'min') {
          productState.filters.minPrice = Math.min(nextValue, productState.filters.maxPrice);
        } else {
          productState.filters.maxPrice = Math.max(nextValue, productState.filters.minPrice);
        }
        applyProductFilters(false);
      };
      (window as any).setProductSort = function (sortKey: string) {
        productState.filters.sort = sortKey === 'likes' ? 'likes' : 'latest';
        applyProductFilters(false);
      };
      (window as any).setShippingFilter = function (shippingKey: string) {
        productState.filters.shipping = ['all', 'ready', '1d', '2d', '3d'].includes(shippingKey) ? shippingKey : 'all';
        applyProductFilters(false);
      };
      (window as any).setCombinedFilter = function (filterType: string) {
        const validTypes = ['all', 'latest', 'likes', 'ready', '1d', '2d', '3d'];
        if (!validTypes.includes(filterType)) return;

        productState.filters.combined = filterType;

        // Update sort and shipping filters based on combined selection
        if (filterType === 'latest' || filterType === 'likes') {
          productState.filters.sort = filterType;
          productState.filters.shipping = 'all';
        } else if (filterType === 'all') {
          productState.filters.sort = 'latest';
          productState.filters.shipping = 'all';
        } else {
          productState.filters.shipping = filterType;
          productState.filters.sort = 'latest';
        }

        applyProductFilters(false);
      };
      (window as any).resetProductFilters = function () {
        productState.filters = {
          type: 'all',
          minPrice: PRODUCT_PRICE_MIN,
          maxPrice: PRODUCT_PRICE_MAX,
          shipping: 'all',
          sort: 'latest',
          combined: 'all'
        };
        applyProductFilters(false);
      };

      // ===== Load Dynamic Products from Firestore =====
      async function loadDynamicProducts() {
        if (!(window as any).fetchDynamicProductsHelper) return;
        const products = await (window as any).fetchDynamicProductsHelper();
        const grid = document.getElementById('main-product-grid');
        if (!grid) return;

        if (!products || products.length === 0) {
          productState.allProducts = [];
          renderProductCards([]);
          syncProductFilterUI(0);
          return;
        }

        productState.allProducts = products.map((product: any, index: number) => ({
          ...product,
          _originalIndex: index,
          _createdAtMs: getProductCreatedAtMs(product),
          _productType: getProductTypeKey(product),
          _shippingKey: getShippingFilterKey(product),
          _priceValue: Number(product.price || 0),
          _likesValue: Math.max(0, Number(product.likes || 0))
        }));

        applyProductFilters(false);
      }

      updateCartUI();
      updateWishlistBadge();
      initializeWishlistHearts();
      syncProductFilterUI(productState.allProducts.length);
      loadDynamicProducts();

      // Listeners for cart/wishlist
      const cartBtn = document.getElementById('nav-cart-btn');
      if (cartBtn) cartBtn.onclick = () => { window.location.href = '/cart'; };

      // Listeners for Notification Bell
      const notifBtn = document.getElementById('nav-notif-btn');
      const notifDropdown = document.getElementById('notif-dropdown');
      if (notifBtn && notifDropdown) {
        notifBtn.onclick = (e) => {
          if ((e.target as HTMLElement).closest('#notif-dropdown')) return;
          const isHidden = notifDropdown.style.display === 'none';
          notifDropdown.style.display = isHidden ? 'block' : 'none';
          
          // close profile dropdown if open
          const profileDropdown = document.getElementById('profile-dropdown');
          if(profileDropdown) profileDropdown.classList.remove('show');
        };
      }

      const handleNotifEvent = (e: any) => {
        const notifs = e.detail || [];
        const unreadNotifs = notifs.filter((n: any) => n.status !== 'read');
        const countEl = document.getElementById('notif-count');
        if(countEl) {
          countEl.textContent = String(unreadNotifs.length);
          countEl.style.display = unreadNotifs.length > 0 ? 'flex' : 'none';
        }
        const container = document.getElementById('notif-list-container');
        if(container) {
          if(notifs.length === 0) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#a08a8e; font-size:0.9rem;">ไม่มีการแจ้งเตือน</div>';
          } else {
            container.innerHTML = notifs.map((n: any) => {
              const isRead = n.status === 'read';
              const titleColor = isRead ? '#a08a8e' : '#db8a9e';
              const textColor = isRead ? '#a08a8e' : '#5c4738';
              const bgStyle = isRead ? 'background:#fafafa;' : 'background:#fff;';
              const hoverOutBg = isRead ? '#fafafa' : '#fff';
              const dateStr = new Date(n.createdAt?.seconds * 1000 || Date.now()).toLocaleString('th-TH', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              });

              // For custom-designed orders (with config), render BasketIcon instead of image
              // But prioritize imageUrl if available (for preset products with images)
              const isCustomOrder = !!n.config;
              const hasImageUrl = !!n.imageUrl && typeof n.imageUrl === 'string';
              // Check if imageUrl is the default ribbon image (used for custom products)
              const isDefaultRibbonImage = hasImageUrl && n.imageUrl.includes('ริบบิ้นแดง.jpg');
              // Simplified logic: show image if it exists and is not the default ribbon image
              const shouldShowImage = hasImageUrl && !isDefaultRibbonImage;
              const itemColors = isCustomOrder && n.config?.selectedColors ? n.config.selectedColors : ['#db8a9e', '#f8bbd0'];
              const c1 = itemColors[0] || '#F48FB1';
              const c2 = itemColors[1] || c1;
              const c3 = itemColors[2] || (itemColors.length > 1 ? itemColors[0] : c1);

              let iconHtml = '';
              if (shouldShowImage) {
                // Use product cover image if available
                const imgUrl = n.imageUrl;
                iconHtml = '<img src="'+imgUrl+'" alt="Product" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'🌸\';" />';
              } else if (isCustomOrder) {
                // Render BasketIcon SVG with colors (matching the BasketIcon component)
                iconHtml = '<svg height="40" width="40" viewBox="0 0 512 512" style="filter: drop-shadow(0px 4px 6px ' + c1 + '40);">' +
                  '<path style="fill: #834E00" d="M401.171,150.142C401.171,67.354,333.818,0,251.031,0S100.889,67.354,100.889,150.142v74.557 c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.461,0.035,0.691c0.017,0.344,0.032,0.689,0.07,1.026 c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266h201.168c8.207,0,15.125-6.12,16.126-14.266 l33.309-271.053c0.006-0.045,0.004-0.089,0.009-0.134c0.038-0.338,0.054-0.682,0.07-1.026c0.011-0.231,0.033-0.461,0.035-0.691 c0-0.044,0.007-0.086,0.007-0.131v-74.557H401.171z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647 s117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />' +
                  '<path style="fill: #DF871E" d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h300.182c0.002-0.044,0.007-0.086,0.009-0.131 c0.011-0.231,0.034-0.461,0.035-0.691c0-0.045,0.007-0.086,0.007-0.131v-74.557C401.171,67.354,333.819,0,251.031,0 c-82.788,0-150.142,67.354-150.142,150.142v74.557c0,0.044,0.007,0.086,0.007,0.131C100.897,225.06,100.919,225.29,100.93,225.521z M133.384,150.142c0-64.871,52.777-117.647,117.647-117.647c64.871,0,117.647,52.776,117.647,117.647v58.31H133.384V150.142z" />' +
                  '<path style="fill: #A66300" d="M250.817,208.451H133.384v-58.31c0-64.799,52.662-117.528,117.434-117.644V0.002 c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131c0.002,0.23,0.023,0.46,0.035,0.691 c0.018,0.344,0.032,0.689,0.07,1.026c0.006,0.045,0.003,0.089,0.009,0.134l33.31,271.053c1,8.146,7.919,14.266,16.126,14.266 h100.371V208.451H250.817z" />' +
                  '<path style="fill: #EDA637" d="M100.93,225.521c0.002,0.044,0.007,0.087,0.009,0.131h149.878v-17.199H133.384v-58.31 c0-64.799,52.662-117.528,117.434-117.644V0.002c-82.692,0.116-149.93,67.422-149.93,150.14v74.557c0,0.044,0.007,0.086,0.007,0.131 C100.897,225.06,100.919,225.29,100.93,225.521z" />' +
                  '<g><polygon style="fill: #834E00" points="382.876,374.577 119.185,374.577 123.302,408.075 378.759,408.075" /><polygon style="fill: #834E00" points="374.922,439.293 127.139,439.293 131.256,472.791 370.807,472.791" /></g>' +
                  '<g><polygon style="fill: #704300" points="251.031,374.577 251.031,408.075 378.759,408.075 382.876,374.577" /><polygon style="fill: #704300" points="251.031,439.293 251.031,472.791 370.807,472.791 374.922,439.293" /></g>' +
                  '<g opacity="0.9"><path fill="' + c1 + '" d="M302.957,167.299h-42.325l-3.043-54.663c-0.773-13.897,10.287-25.59,24.206-25.59l0,0 c13.917,0,24.978,11.693,24.204,25.589L302.957,167.299z" /><path fill="' + c1 + '" d="M268.194,154.882l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L268.194,154.882z" /><path fill="' + c1 + '" d="M295.396,154.882l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.077-27.558-11.624-33.25L295.396,154.882z" /></g>' +
                  '<g opacity="0.7"><path fill="' + c1 + '" d="M295.396,188.467l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.077,27.558-11.624,33.25L295.396,188.467z" /><path fill="' + c1 + '" d="M268.194,188.467l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365-1.078,27.558,11.624,33.25L268.194,188.467z" /><path fill="' + c1 + '" d="M260.632,176.05h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L260.632,176.05z" /></g>' +
                  '<circle style="fill: #FACE17" cx="282.521" cy="170.716" r="24.903" />' +
                  '<g opacity="0.8"><path fill="' + c2 + '" d="M180.174,200.726h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L180.174,200.726z" /><path fill="' + c2 + '" d="M145.411,188.308l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L145.411,188.308z" /><path fill="' + c2 + '" d="M172.613,188.308l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L172.613,188.308z" /></g>' +
                  '<g opacity="0.6"><path fill="' + c2 + '" d="M172.613,221.893l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L172.613,221.893z" /><path fill="' + c2 + '" d="M145.411,221.893l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L145.411,221.893z" /><path fill="' + c2 + '" d="M137.85,209.477h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L137.85,209.477z" /></g>' +
                  '<circle style="fill: #FACE17" cx="159.74" cy="204.147" r="24.903" />' +
                  '<g opacity="0.95"><path fill="' + c3 + '" d="M374.151,245.227h-42.325l-3.043-54.663c-0.774-13.896,10.286-25.589,24.204-25.589l0,0 c13.918,0,24.978,11.693,24.204,25.589L374.151,245.227z" /><path fill="' + c3 + '" d="M339.388,232.81l19.428,37.602l-47.168,27.794c-11.991,7.066-27.456,2.607-33.844-9.758l0,0 c-6.388-12.365-1.078-27.558,11.624-33.25L339.388,232.81z" /><path fill="' + c3 + '" d="M366.59,232.81l-19.428,37.602l47.168,27.794c11.991,7.066,27.456,2.607,33.844-9.758l0,0 c6.388-12.365,1.078-27.558-11.624-33.25L366.59,232.81z" /></g>' +
                  '<g opacity="0.75"><path fill="' + c3 + '" d="M366.59,266.395l-19.428-37.602l47.168-27.794c11.991-7.066,27.456-2.607,33.844,9.758l0,0 c6.388,12.365,1.078,27.558-11.624,33.25L366.59,266.395z" /><path fill="' + c3 + '" d="M339.388,266.395l19.428-37.602l-47.168-27.794c-11.991-7.066-27.456-2.607-33.844,9.758l0,0 c-6.388,12.365,1.078,27.558,11.624,33.25L339.388,266.395z" /><path fill="' + c3 + '" d="M331.826,253.979h42.325l3.043,54.663c0.774,13.896-10.286,25.589-24.204,25.589l0,0 c-13.918,0-24.978-11.693-24.204-25.589L331.826,253.979z" /></g>' +
                  '<circle style="fill: #FACE17" cx="353.715" cy="248.649" r="24.903" />' +
                  '</svg>';
              } else {
                const imgUrl = '/images/logo-placeholder.png';
                iconHtml = '<img src="'+imgUrl+'" style="width:100%; height:100%; object-fit:cover;" />';
              }

              return '<div class="notif-item" onclick="handleNotifClick(&quot;' + n.id + '&quot;)" style="display:flex; gap:12px; padding:16px; border-bottom:1px solid #fdf5f6; cursor:pointer; transition:all 0.2s; align-items:center;' + bgStyle + '" onmouseover="this.style.background=&quot;#fffafb&quot;; this.style.transform=&quot;translateY(-1px)&quot;" onmouseout="this.style.background=&quot;' + hoverOutBg + '&quot;; this.style.transform=&quot;none&quot;">' +
                '<div style="flex-shrink:0; width:40px; height:40px; border-radius:10px; overflow:hidden; border:1px solid #fdf5f6; position:relative; box-shadow:0 2px 8px rgba(219,138,158,0.1); background:#fff;">' +
                  iconHtml +
                  (!isRead ? '<div style="position:absolute; top:0px; right:0px; width:10px; height:10px; background:#e74c3c; border-radius:50%; border:2px solid #fff;"></div>' : '') +
                '</div>' +
                '<div style="flex-grow:1; display:flex; flex-direction:column; gap:4px; min-width:0;">' +
                  '<div style="font-weight:700; color:' + titleColor + '; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + (n.title || '') + '</div>' +
                  '<div style="color:' + textColor + '; font-size:0.85rem; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">' + (n.message || '') + '</div>' +
                  '<div style="color:#a08a8e; font-size:0.75rem; font-weight:500;">' + dateStr + '</div>' +
                '</div>' +
                '<div style="flex-shrink:0; color:#db8a9e; opacity:' + (isRead ? '0.4' : '1') + '; display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:' + (isRead ? 'transparent' : '#fffafb') + ';">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M9 18l6-6-6-6"/>' +
                  '</svg>' +
                '</div>' +
              '</div>';
            }).join('');
          }
        }
      };
      
      window.addEventListener('bearhasflower-notifs', handleNotifEvent);

      (window as any).handleNotifClick = async (notifId: string) => {
        try {
          const { db } = await import('@/lib/firebase');
          const { doc, updateDoc } = await import('firebase/firestore');
          await updateDoc(doc(db, 'notifications', notifId), { status: 'read' });
          window.location.href = '/cart?tab=history';
        } catch(e) {
          console.error(e);
          window.location.href = '/cart?tab=history';
        }
      };

      (window as any).handleClearAllNotifs = () => {
        const modal = document.getElementById('clear-notif-modal');
        if (modal) {
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
        }
      };

      (window as any).confirmClearNotifs = async () => {
        try {
          const { db, auth } = await import('@/lib/firebase');
          const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
          const user = auth.currentUser;
          if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อน');
            return;
          }

          const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid)
          );
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'notifications', docSnap.id)));
          await Promise.all(deletePromises);

          // Refresh the notification list
          const container = document.getElementById('notif-list-container');
          if(container) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#a08a8e; font-size:0.9rem;">ไม่มีการแจ้งเตือน</div>';
          }
          const countEl = document.getElementById('notif-count');
          if(countEl) {
            countEl.style.display = 'none';
          }

          // Close modal
          const modal = document.getElementById('clear-notif-modal');
          if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
          }

          // Close dropdown
          const dropdown = document.getElementById('notif-dropdown');
          if (dropdown) {
            dropdown.style.display = 'none';
          }
        } catch(e) {
          console.error('Error clearing notifications:', e);
          alert('เกิดข้อผิดพลาดในการล้างประวัติการแจ้งเตือน');
        }
      };

      (window as any).cancelClearNotifs = () => {
        const modal = document.getElementById('clear-notif-modal');
        if (modal) {
          modal.classList.remove('show');
          document.body.style.overflow = '';
        }
      };

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
        if (notifDropdown && notifBtn && !notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
          notifDropdown.style.display = 'none';
        }
      };
      
      if (profileBtn && profileDropdown) {
        profileBtn.onclick = (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('show');
          if(notifDropdown) notifDropdown.style.display = 'none';
        };
      }
      document.addEventListener('click', clickOutsideHandler);

      // Cleanup on re-run
      return () => {
        clearInterval(slideshowInterval);
        document.removeEventListener('click', clickOutsideHandler);
        window.removeEventListener('bearhasflower-notifs', handleNotifEvent);
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
        
        <!-- Notification Bell -->
        <div class="nav-cart" id="nav-notif-btn" title="การแจ้งเตือน" style="position:relative; margin-top:5px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="nav-cart-badge" id="notif-count" style="display:none;background:#e74c3c;">0</span>
          
          <div class="profile-dropdown" id="notif-dropdown" style="display:none; position:absolute; top:40px; right:-50px; background:#fff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:380px; max-height:400px; overflow-y:auto; z-index:100; border: 1px solid #fdf5f6; cursor:default;">
            <div style="padding:15px; font-weight:700; border-bottom:1px solid #fdf5f6; color:#5c4738; display:flex; justify-content:space-between; align-items:center;">
              <span>การแจ้งเตือน</span>
              <button onclick="handleClearAllNotifs()" style="border:none; background:none; color:#db8a9e; cursor:pointer; padding:8px; border-radius:8px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; margin-left:8px;" onmouseover="this.style.background='#fdf5f6'" onmouseout="this.style.background='none'" title="ล้างทั้งหมด">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            <div id="notif-list-container">
              <div style="padding:20px; text-align:center; color:#a08a8e; font-size:0.9rem;">ไม่มีการแจ้งเตือน</div>
            </div>
          </div>
        </div>

        <div class="nav-cart" id="nav-cart-btn" title="ตะกร้าสินค้า">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span class="nav-cart-badge" id="cart-count" style="display:none;background:#e74c3c;">0</span>
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
        <div class="slide" onclick="window.location.href='/login'" style="cursor:pointer;">
        </div>
        <div class="slide" onclick="window.open('https://line.me/ti/g2/DWiHGO3pg2QUjM0ikHEFrqB4AddZTnsjTbjmrA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default', '_blank')" style="cursor:pointer;">
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

  <div class="product-filter-shell" id="product-filter-shell">
    <div style="max-width: 1280px; margin: 0 auto; display: flex; justify-content: flex-end;">
      <button class="product-filter-toggle" style="margin: 0;" id="product-filter-toggle" type="button" onclick="toggleProductFilters()" aria-expanded="false" aria-controls="product-filter-panel" aria-label="ตัวกรองสินค้า">
        <span class="product-filter-toggle-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M6 12h12"></path>
            <path d="M10 18h4"></path>
          </svg>
        </span>
      </button>
    </div>

    <div class="product-filter-panel-wrap" id="product-filter-panel" aria-hidden="true">
      <div class="product-filter-panel-inner">
        <div class="product-filter-bar">
      <div class="product-filter-header">
        <div>
          <p class="product-filter-eyebrow">Curated Filters</p>
        </div>
      </div>

      <div class="product-filter-layout">
        <div class="filter-panel filter-panel-price">
          <div class="filter-label-row">
            <span class="filter-title">เรทราคา</span>
          </div>
          <div class="price-range-values">
            <span id="price-min-value">79 บาท</span>
            <span id="price-max-value">2,000 บาท</span>
          </div>
          <div class="dual-range-slider">
            <div class="dual-range-base"></div>
            <div class="dual-range-highlight" id="product-price-track"></div>
            <input id="product-price-min" class="range-input range-min" type="range" min="79" max="2000" step="1" value="79" oninput="updateProductPriceFilter('min', this.value)" />
            <input id="product-price-max" class="range-input range-max" type="range" min="79" max="2000" step="1" value="2000" oninput="updateProductPriceFilter('max', this.value)" />
          </div>
        </div>

        <div class="filter-panel">
          <div class="filter-label-row">
            <span class="filter-title">เรียงตาม</span>
          </div>
          <div class="filter-pill-row">
            <button type="button" class="filter-pill active" data-filter-type="all" onclick="setCombinedFilter('all')">ทั้งหมด</button>
            <button type="button" class="filter-pill" data-filter-type="latest" onclick="setCombinedFilter('latest')">ล่าสุด</button>
            <button type="button" class="filter-pill" data-filter-type="likes" onclick="setCombinedFilter('likes')">ถูกใจเยอะสุด</button>
            <button type="button" class="filter-pill" data-filter-type="ready" onclick="setCombinedFilter('ready')">ช่อพร้อมส่ง</button>
            <button type="button" class="filter-pill" data-filter-type="1d" onclick="setCombinedFilter('1d')">จัดส่งใน 1 วัน</button>
            <button type="button" class="filter-pill" data-filter-type="2d" onclick="setCombinedFilter('2d')">จัดส่งใน 2 วัน</button>
            <button type="button" class="filter-pill" data-filter-type="3d" onclick="setCombinedFilter('3d')">จัดส่งใน 3 วัน</button>
          </div>
        </div>
      </div>

      <div class="product-filter-summary">
        <span id="product-results-count">กำลังโหลดสินค้า...</span>
        <span id="product-active-filter-text">สินค้าทั้งหมด • 79 บาท - 2,000 บาท • ทุกสถานะ • เรียงตามสินค้าล่าสุด</span>
      </div>
    </div>
      </div>
    </div>
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

  <!-- Clear Notifications Modal -->
  <div id="clear-notif-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(5px); z-index:2000; align-items:center; justify-content:center; opacity:0; transition:opacity 0.3s ease;">
    <div style="background:#fff; width:85%; max-width:380px; border-radius:24px; padding:32px 28px; box-shadow:0 10px 40px rgba(0,0,0,0.15); text-align:center; transform:scale(0.9); transition:transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
      <div style="width:72px; height:72px; background:#fff0f2; color:#db8a9e; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:2.2rem;">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </div>
      <h2 style="font-size:1.3rem; color:#5c4738; margin-bottom:8px; font-weight:700;">ล้างประวัติการแจ้งเตือน</h2>
      <p style="font-size:0.95rem; color:#a08a8e; line-height:1.5; margin-bottom:24px;">
        คุณต้องการล้างประวัติการแจ้งเตือนทั้งหมดใช่หรือไม่?<br />
        การกระทำนี้ไม่สามารถย้อนกลับได้
      </p>
      <div style="display:flex; gap:12px;">
        <button onclick="cancelClearNotifs()" style="flex:1; padding:14px; background:#fdf5f6; color:#5c4738; border:none; border-radius:50px; font-weight:700; font-size:1rem; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#f0e0e2'" onmouseout="this.style.background='#fdf5f6'">ยกเลิก</button>
        <button onclick="confirmClearNotifs()" style="flex:1; padding:14px; background:#db8a9e; color:#fff; border:none; border-radius:50px; font-weight:700; font-size:1rem; cursor:pointer; box-shadow:0 6px 15px rgba(219, 138, 158, 0.25); transition:all 0.2s;" onmouseover="this.style.background='#d47a8e'" onmouseout="this.style.background='#db8a9e'">ล้างทั้งหมด</button>
      </div>
    </div>
  </div>

  <style>
    #clear-notif-modal.show {
      display: flex !important;
      opacity: 1 !important;
    }
    #clear-notif-modal.show > div {
      transform: scale(1) !important;
    }
  </style>

  ` }} />;
}
