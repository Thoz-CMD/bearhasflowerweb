'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Image as ImageIcon, Search } from 'lucide-react';
import styles from './supplies.module.css';

type SupplyProduct = {
  id: string;
  name: string;
  imageSrc: string;
  shopUrl: string;
};

const supplyProducts: SupplyProduct[] = [
  {
    id: 'wrapping-paper',
    name: 'กระดาษห่อช่อดอกไม้',
    imageSrc: '',
    shopUrl: '',
  },
  {
    id: 'ribbon',
    name: 'ริบบิ้นตกแต่งช่อ',
    imageSrc: '',
    shopUrl: '',
  },
  {
    id: 'velvet-wire',
    name: 'ลวดกำมะหยี่',
    imageSrc: '',
    shopUrl: '',
  },
  {
    id: 'gift-card',
    name: 'การ์ดข้อความ',
    imageSrc: '',
    shopUrl: '',
  },
  {
    id: 'led-light',
    name: 'ไฟประดับช่อดอกไม้',
    imageSrc: '',
    shopUrl: '',
  },
  {
    id: 'packing-box',
    name: 'กล่องแพ็กสินค้า',
    imageSrc: '',
    shopUrl: '',
  },
];

export default function SuppliesPage() {
  const [searchText, setSearchText] = useState('');

  const filteredProducts = useMemo(() => {
    const keyword = searchText.trim().toLocaleLowerCase('th-TH');
    if (!keyword) return supplyProducts;

    return supplyProducts.filter((product) =>
      product.name.toLocaleLowerCase('th-TH').includes(keyword),
    );
  }, [searchText]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <span className={styles.eyebrow}>Supply Ordering</span>
          <h1 className={styles.title}>สั่งซื้ออุปกรณ์</h1>
          <p className={styles.subtitle}>
            เลือกอุปกรณ์ที่ต้องการสั่งซื้อจากการ์ดสินค้า แล้วระบบจะเปิดหน้าร้านค้าตามลิงก์ที่ตั้งไว้
          </p>
        </div>

        <label className={styles.searchWrap} aria-label="ค้นหาสินค้า">
          <Search className={styles.searchIcon} size={18} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="ค้นหาสินค้า..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.grid}>
        {filteredProducts.map((product) => {
          const hasShopUrl = product.shopUrl.trim().length > 0;
          const cardContent = (
            <>
              <div className={styles.imageFrame}>
                {product.imageSrc ? (
                  <Image
                    className={styles.productImage}
                    src={product.imageSrc}
                    alt={product.name}
                    fill
                    sizes="(max-width: 560px) 100vw, (max-width: 980px) 50vw, 33vw"
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <ImageIcon size={38} />
                    <span>ใส่รูปสินค้า</span>
                  </div>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.productName}>{product.name}</span>
                {hasShopUrl && <ExternalLink className={styles.externalIcon} size={18} />}
              </div>
            </>
          );

          if (!hasShopUrl) {
            return (
              <div key={product.id} className={styles.card} aria-label={`${product.name} ยังไม่ได้ใส่ลิงก์ร้านค้า`}>
                {cardContent}
              </div>
            );
          }

          return (
            <a
              key={product.id}
              className={styles.card}
              href={product.shopUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`เปิดร้านค้าสำหรับ ${product.name}`}
            >
              {cardContent}
            </a>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>ไม่พบสินค้าที่ตรงกับคำค้นหา</div>
        )}
      </div>
    </div>
  );
}
