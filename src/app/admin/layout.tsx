import type { ReactNode } from 'react';
import { Suspense } from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin-shell.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Suspense fallback={<div className={styles.sidebar} />}>
        <AdminSidebar />
      </Suspense>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
