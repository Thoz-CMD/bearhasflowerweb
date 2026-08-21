import ClientPage from './ClientPage';
import { adminDb } from '@/lib/firebaseAdmin';

export const revalidate = 60; // Revalidate every 60 seconds for SSG cache

export default async function HomePage() {
  let products: any[] = [];

  try {
    // Use Firebase Admin SDK (now has Firestore permissions)
    const snapshot = await adminDb.collection('products').get();
    
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt desc
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  } catch (error) {
    console.error('Error pre-fetching products for SSR:', error);
  }

  // Pass array directly - Next.js will serialize safely
  return <ClientPage initialProductsData={products} />;
}
