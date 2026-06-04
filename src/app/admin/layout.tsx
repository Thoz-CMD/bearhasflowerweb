import type { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import styles from './admin-shell.module.css';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
