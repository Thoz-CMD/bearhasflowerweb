import ClientPage from './ClientPage';

export const revalidate = 60; // Revalidate every 60 seconds for SSG cache

const parseFirestoreValue = (val: any) => {
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return new Date(val.timestampValue).getTime();
  return null;
};

export default async function HomePage() {
  let initialProductHtml = '';

  try {
    const res = await fetch('https://firestore.googleapis.com/v1/projects/bearhasflower/databases/(default)/documents/products?pageSize=100', {
      next: { revalidate: 60 }
    });
    const data = await res.json();
    
    let products: any[] = [];
    if (data.documents) {
      products = data.documents.map((doc: any) => {
        const parsed: any = { id: doc.name.split('/').pop() };
        for (const [key, val] of Object.entries(doc.fields || {})) {
          parsed[key] = parseFirestoreValue(val);
        }
        return parsed;
      });
    }

    // Sort by createdAt desc
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    initialProductHtml = products.map((p: any, idx: number) => {
      const currentLikes = Math.max(0, Number(p.likes || 0));
      const priceValue = Number(p.price || 0);

      // Determine product type logic mirroring ClientPage
      const name = String(p.name || '').toLowerCase();
      const description = String(p.description || '').toLowerCase();
      let productType = 'all';
      if (p.type === 'velvet_flower' || name.includes('กำมะหยี่') || description.includes('กำมะหยี่')) {
        productType = 'velvet';
      } else if (p.type === 'glitter_rose' || name.includes('กลิตเตอร์') || description.includes('กลิตเตอร์')) {
        productType = 'glitter';
      } else if (name.includes('ดอกไม้ประดิษฐ์') || description.includes('ดอกไม้ประดิษฐ์') || name.includes('ประดิษฐ์') || description.includes('ประดิษฐ์')) {
        productType = 'artificial';
      }

      const isVelvet = productType === 'velvet';
      const isArtificial = p.type === 'artificial_flowers';
      const targetUrl = isArtificial ? '/artificial_flowers?preset=' + p.id : (isVelvet ? '/velvet_wire?preset=' + p.id : '/glitter_rose?preset=' + p.id);
      
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

      const imageSrc = idx < 4 ? p.coverImage : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // transparent 1x1 gif
      
      return `
        <article class="product-card fade-in" style="animation-delay: ${0.05 + idx * 0.05}s;" data-product-id="${p.id}" data-product-type="${productType}">
          <div class="product-image-wrap" ${isSoldOut ? '' : `onclick="${productNav}"`} style="cursor:${isSoldOut ? 'default' : 'pointer'}; position:relative; overflow:hidden;">
            ${p.coverImage
              ? `<img src="${imageSrc}" alt="${p.name}" class="product-image" loading="${idx < 2 ? 'eager' : 'lazy'}" decoding="async" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:inherit;" />`
              : `<div class="product-placeholder">🌹</div>`
            }
            <span class="${badgeClass}">${badgeText}</span>
            <button class="product-wishlist" aria-label="บันทึก" style="z-index: 10; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 8px; border-radius: 20px; width: auto; height: 30px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" stroke-linejoin="round" />
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
                    <path stroke-linejoin="round" d="M2.31 11.243A1 1 0 0 1 3.28 10h17.44a1 1 0 0 1 .97 1.242l-1.811 7.243A2 2 0 0 1 17.939 20H6.061a2 2 0 0 1-1.94-1.515z" />
                    <path stroke-linecap="round" d="M9 14v2m6-2v2m-9-6l4-6m8 6l-4-6" />
                  </g>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (error) {
    console.error('Error pre-fetching products for SSR:', error);
  }

  return <ClientPage initialProductHtml={initialProductHtml} />;
}
