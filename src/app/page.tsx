import ClientPage from './ClientPage';
import { adminDb } from '@/lib/firebaseAdmin';

export const revalidate = 60; // Revalidate every 60 seconds for SSG cache

export default async function HomePage() {
  let products: any[] = [];

  try {
    // Use Firebase Admin SDK (now has Firestore permissions)
    const snapshot = await adminDb.collection('products').get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to plain numbers for serialization
      products.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?._seconds ? data.createdAt._seconds * 1000 : (data.createdAt || 0),
        updatedAt: data.updatedAt?._seconds ? data.updatedAt._seconds * 1000 : (data.updatedAt || 0)
      });
    });

    // Sort by createdAt desc
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  } catch (error) {
    console.error('Error pre-fetching products for SSR:', error);
  }

  // Pass plain objects only (Next.js requirement)
  return <ClientPage initialProductsData={products} />;
}
