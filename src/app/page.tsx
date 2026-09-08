import ClientPage from './ClientPage';

export const revalidate = 60; // Revalidate every 60 seconds for SSG cache

function parseFirestoreFields(fields: any): any {
  const result: any = {};
  if (!fields) return result;
  for (const [key, valueObj] of Object.entries(fields as Record<string, any>)) {
    const [valType] = Object.keys(valueObj || {});
    const val = valueObj[valType];
    if (valType === 'integerValue') result[key] = parseInt(val, 10);
    else if (valType === 'doubleValue') result[key] = parseFloat(val);
    else if (valType === 'booleanValue') result[key] = Boolean(val);
    else if (valType === 'stringValue') result[key] = val;
    else if (valType === 'timestampValue') result[key] = new Date(val).getTime();
    else if (valType === 'arrayValue') result[key] = (val.values || []).map((v: any) => Object.values(v)[0]);
    else if (valType === 'mapValue') result[key] = parseFirestoreFields(val.fields);
    else result[key] = val;
  }
  return result;
}

async function getSSRProducts(): Promise<any[]> {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bearhasflower';
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCDJdBc2FkZTwsQw_gy7sBKRD056IgkM34';
    const requiredFields = ['name', 'price', 'description', 'type', 'createdAt', 'likes', 'badge', 'readyToShip', 'stockQuantity', 'soldOut', 'coverImage'];
    const maskQuery = requiredFields.map((f) => `mask.fieldPaths=${f}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?key=${apiKey}&pageSize=100&${maskQuery}`;

    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) {
      return [];
    }

    const products = data.documents.map((doc: any) => {
      const id = doc.name ? doc.name.split('/').pop() : '';
      return {
        id,
        ...parseFirestoreFields(doc.fields),
      };
    });

    return products;
  } catch (err) {
    console.warn('SSR product pre-fetch skipped (client hydration will load products):', (err as Error)?.message);
    return [];
  }
}

export default async function HomePage() {
  let initialProductHtml = '';

  try {
    const products = await getSSRProducts();

    // Sort by createdAt desc
    products.sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return (timeB || 0) - (timeA || 0);
    });

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

      // Never embed base64 in SSR HTML — client hydration will load real images
      const placeholderSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      
      return `
        <article class="product-card fade-in" style="animation-delay: ${0.05 + idx * 0.05}s;" data-product-id="${p.id}" data-product-type="${productType}">
          <div class="product-image-wrap" ${isSoldOut ? '' : `onclick="${productNav}"`} style="cursor:${isSoldOut ? 'default' : 'pointer'}; position:relative; overflow:hidden;">
            ${p.coverImage
              ? `<img src="${placeholderSrc}" data-real-src="${p.coverImage.startsWith('data:') ? '' : p.coverImage}" alt="${p.name}" class="product-image" loading="${idx < 2 ? 'eager' : 'lazy'}" decoding="async" style="width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; border-radius:inherit; background:#f0e6ef;" />`
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
    console.error('Error in SSR products render:', error);
  }

  return <ClientPage initialProductHtml={initialProductHtml} />;
}

