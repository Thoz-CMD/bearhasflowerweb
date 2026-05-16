'use client';
import { useEffect, useState } from 'react';

export default function Wishlist() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine loading state from localstorage immediately
    const alreadyChecked = typeof window !== 'undefined' && sessionStorage.getItem('wl_auth_checked');
    if (alreadyChecked) {
      setLoading(false);
    }
    
    // Always trigger a refresh/check just in case
    setLoading(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('wl_auth_checked', 'true');
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    const script = document.createElement('script');
    script.innerHTML = `
      const WISHLIST_KEY = 'bear_flower_wishlist';

      function getWishlist() {
        try {
          return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
        } catch { return []; }
      }

      function removeFromWishlist(id) {
        let list = getWishlist();
        list = list.filter(item => item.id !== id);
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        renderWishlist();
        updateBadge();
      }

      function updateBadge() {
        const list = getWishlist();
        const badge = document.getElementById('wishlist-count-badge');
        if (badge) {
          badge.textContent = list.length;
          badge.style.display = list.length > 0 ? 'flex' : 'none';
        }
      }

      function renderWishlist() {
        const list = getWishlist();
        const container = document.getElementById('wishlist-container');
        const emptyState = document.getElementById('wishlist-empty');
        const countEl = document.getElementById('wishlist-count');

        if (countEl) countEl.textContent = list.length + ' รายการ';

        if (!container) return;

        if (list.length === 0) {
          container.innerHTML = '';
          if (emptyState) emptyState.style.display = 'flex';
          return;
        }

        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = list.map(item => \`
          <article class="wl-card">
            <div class="wl-img">
              <span class="wl-emoji">\${item.emoji || '🌹'}</span>
              \${item.badge ? \`<span class="wl-badge">\${item.badge}</span>\` : ''}
            </div>
            <div class="wl-info">
              <div class="wl-name">\${item.name}</div>
              \${item.desc ? \`<div class="wl-desc">\${item.desc}</div>\` : ''}
              <div class="wl-price">\${item.price ? item.price : '—'} \${item.price ? '<span>บาท</span>' : '<span>บาท</span>'}</div>
            </div>
            <button class="wl-remove" onclick="removeFromWishlist('\${item.id}')" aria-label="ลบออก">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </article>
        \`).join('');
      }

      renderWishlist();
      updateBadge();
    `;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [loading]);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffafb' }}>
      <div style={{ color: '#db8a9e', fontSize: '1.2rem', fontFamily: 'serif', fontStyle: 'italic' }}>Loading Wishlist...</div>
    </div>
  );

  return <div dangerouslySetInnerHTML={{
    __html: `

    <!-- Navbar -->
    <nav class="navbar" style="padding-left: 20px; padding-right: 20px;">
      <button class="back-btn-circle" onclick="window.history.length > 1 ? window.history.back() : window.location.href='/'">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <a href="/" class="nav-logo" style="position: absolute; left: 50%; transform: translateX(-50%);">Wishlist</a>
    </nav>

    <!-- Page Content -->
    <div class="wl-page-wrap">

      <!-- Heading -->
      <div class="wl-heading">
        <div class="wl-title-row">
          <h1>รายการถูกใจ</h1>
        </div>
        <p class="wl-subtitle" id="wishlist-count">0 รายการ</p>
      </div>

      <!-- Empty State -->
      <div id="wishlist-empty" class="wl-empty">
        <div class="wl-empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--rose-light)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <p class="wl-empty-title">ยังไม่มีรายการถูกใจ</p>
        <p class="wl-empty-sub">กดไอคอน ♡ ที่สินค้าที่คุณชอบเพื่อบันทึกไว้ที่นี่</p>
        <a href="/" class="wl-shop-btn">ดูสินค้าทั้งหมด</a>
      </div>

      <!-- Wishlist Grid -->
      <div id="wishlist-container" class="wl-grid"></div>

    </div>

    <!-- Bottom Tab Bar (Mobile) -->
    <div class="bottom-tab-bar" id="bottom-tab-bar">
      <div class="tab-inner">
        <a href="/" class="tab-item" id="tab-home">
          <span class="tab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" class="nav-svg">
              <path class="icon-fill" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </span>
          <span class="tab-label">หน้าหลัก</span>
        </a>
        <a href="/#categories" class="tab-item" id="tab-cat">
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
        <a href="/#products" class="tab-item" id="tab-prod">
          <span class="tab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" class="nav-svg">
              <path class="icon-fill" d="M4 8h16l-1.5 13H5.5L4 8z"></path>
              <path d="M16 8v-2a4 4 0 0 0-8 0v2"></path>
            </svg>
          </span>
          <span class="tab-label">สินค้า</span>
        </a>
        <a href="/wishlist" class="tab-item active" id="tab-wishlist-tab">
          <span class="tab-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="nav-svg">
            <path class="icon-fill" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"></path>
          </svg>
            <span id="wishlist-count-badge" style="position:absolute;top:-6px;right:-8px;background:var(--rose-gold);color:#fff;border-radius:50%;width:16px;height:16px;font-size:.6rem;display:none;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;">0</span>
          </span>
          <span class="tab-label">ถูกใจ</span>
        </a>
      </div>
    </div>

    <style>
      .wl-page-wrap {
        position: relative;
        z-index: 1;
        max-width: 720px;
        margin: 0 auto;
        padding: 32px clamp(16px, 4vw, 32px) 120px;
      }

      .wl-heading {
        text-align: center;
        margin-bottom: 32px;
        animation: fadeDown .7s ease both;
      }

      .wl-title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 6px;
      }

      .wl-heading h1 {
        font-family: 'Cormorant Garamond', 'Noto Sans Thai', serif;
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        font-weight: 400;
        font-style: italic;
        color: var(--deep-brown);
        letter-spacing: .03em;
      }

      .wl-subtitle {
        font-size: .82rem;
        letter-spacing: .2em;
        text-transform: uppercase;
        color: var(--rose-gold);
        font-weight: 500;
      }

      /* Empty State */
      .wl-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
        padding: 60px 20px;
        text-align: center;
        animation: fadeUp .7s ease both;
      }

      .wl-empty-icon {
        opacity: .4;
      }

      .wl-empty-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.4rem;
        font-weight: 400;
        color: var(--mid-brown);
        font-style: italic;
      }

      .wl-empty-sub {
        font-size: .85rem;
        color: var(--text-muted);
        line-height: 1.6;
        max-width: 280px;
      }

      .wl-shop-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
        padding: 12px 36px;
        background: linear-gradient(135deg, var(--rose-gold), #f8bbd0);
        color: #fff;
        border-radius: 50px;
        font-family: 'Noto Sans Thai', sans-serif;
        font-size: .9rem;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 6px 20px rgba(219,138,158,.4);
        transition: all .35s ease;
      }

      .wl-shop-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(219,138,158,.5);
      }

      /* Wishlist Grid */
      .wl-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
        animation: fadeUp .7s .1s ease both;
      }

      .wl-card {
        background: var(--warm-white);
        border-radius: 20px;
        border: 1px solid rgba(219,138,158,.12);
        box-shadow: var(--shadow-sm);
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        transition: all .35s ease;
        position: relative;
        overflow: hidden;
      }

      .wl-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
        border-color: rgba(219,138,158,.25);
      }

      .wl-card::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(to bottom, var(--rose-gold), var(--rose-light));
        border-radius: 3px 0 0 3px;
      }

      .wl-img {
        position: relative;
        width: 72px;
        height: 72px;
        min-width: 72px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--blush), var(--rose-light));
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .wl-emoji {
        font-size: 2rem;
      }

      .wl-badge {
        position: absolute;
        top: 6px;
        right: 6px;
        background: rgba(255,253,249,.9);
        border: 1px solid var(--glass-border);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: .65rem;
        font-weight: 600;
        color: var(--mid-brown);
      }

      .wl-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .wl-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--deep-brown);
        letter-spacing: .02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .wl-desc {
        font-size: .76rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .wl-price {
        font-family: 'Noto Sans Thai', sans-serif;
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--rose-gold);
      }

      .wl-price span {
        font-family: 'Noto Sans Thai', sans-serif;
        font-size: .72rem;
        color: var(--text-muted);
        font-weight: 400;
        margin-left: 2px;
      }

      .wl-remove {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1.5px solid var(--glass-border);
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-muted);
        transition: all .3s ease;
        flex-shrink: 0;
      }

      .wl-remove:hover {
        border-color: #e05c7a;
        color: #e05c7a;
        background: rgba(224,92,122,.06);
      }

      @keyframes fadeDown {
        from { opacity: 0; transform: translateY(-16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    </style>
  ` }} />;
}
