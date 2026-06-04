'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Box,
  ClipboardList,
  Home,
  LayoutDashboard,
  PackagePlus,
  ReceiptText,
  ShoppingBag,
} from 'lucide-react';
import styles from './admin-shell.module.css';

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  isActive: (pathname: string, searchParams: URLSearchParams) => boolean;
  showInMobile?: boolean;
  mobileOrder?: number;
  mobileCenter?: boolean;
  mobileLabel?: string;
};

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'ภาพรวม',
    description: 'Dashboard หลัก',
    icon: LayoutDashboard,
    isActive: (pathname, searchParams) =>
      pathname === '/admin' &&
      (!searchParams.get('view') || searchParams.get('view') === 'manager'),
    showInMobile: true,
    mobileOrder: 3,
    mobileCenter: true,
    mobileLabel: 'Dashboard',
  },
  {
    href: '/admin?view=florist',
    label: 'ช่างจัดดอกไม้',
    description: 'คิวงานการผลิต',
    icon: ShoppingBag,
    isActive: (pathname, searchParams) =>
      pathname === '/admin' && searchParams.get('view') === 'florist',
    showInMobile: true,
    mobileOrder: 1,
  },
  {
    href: '/admin?view=finance',
    label: 'รายรับ-รายจ่าย',
    description: 'บัญชีร้าน',
    icon: ReceiptText,
    isActive: (pathname, searchParams) =>
      pathname === '/admin' && searchParams.get('view') === 'finance',
    showInMobile: true,
    mobileOrder: 2,
  },
  {
    href: '/admin/create-product',
    label: 'สร้างสินค้าใหม่',
    description: 'เพิ่มสินค้า',
    icon: PackagePlus,
    isActive: (pathname, searchParams) =>
      pathname === '/admin/create-product' && searchParams.get('manage') !== 'true',
    showInMobile: true,
    mobileOrder: 4,
  },
  {
    href: '/admin/manage-products',
    label: 'จัดเก็บสินค้า',
    description: 'คลังสินค้า',
    icon: Box,
    isActive: (pathname, searchParams) =>
      pathname === '/admin/manage-products' ||
      (pathname === '/admin/create-product' && searchParams.get('manage') === 'true'),
    showInMobile: true,
    mobileOrder: 5,
  },
  {
    href: '/',
    label: 'กลับหน้าหลัก',
    description: 'หน้าร้าน',
    icon: Home,
    isActive: () => false,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const mobileNavItems = [...navItems]
    .filter((item) => item.showInMobile)
    .sort((a, b) => (a.mobileOrder || 0) - (b.mobileOrder || 0));

  return (
    <>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <ClipboardList size={20} />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Admin Panel</span>
            <span className={styles.brandSubtitle}>Bear has flower</span>
          </div>
        </div>

        <div className={styles.navSectionTitle}>Navigation</div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname, params);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
              >
                <span className={styles.navIconWrap}>
                  <Icon size={18} />
                </span>
                <span className={styles.navLinkText}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footerCard}>
          <div className={styles.avatar}>A</div>
          <div className={styles.footerMeta}>
            <span className={styles.footerName}>Admin</span>
            <span className={styles.footerRole}>ผู้ดูแลระบบ</span>
          </div>
        </div>
      </aside>

      <nav className={styles.mobileBottomNav} aria-label="Admin mobile navigation">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(pathname, params);

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={`${styles.mobileNavLink} ${active ? styles.mobileNavLinkActive : ''} ${item.mobileCenter ? styles.mobileNavLinkCenter : ''}`}
            >
              <span className={`${styles.mobileNavIconWrap} ${item.mobileCenter ? styles.mobileNavIconWrapCenter : ''}`}>
                <Icon size={18} />
              </span>
              <span className={styles.mobileNavLabel}>{item.mobileLabel || item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
