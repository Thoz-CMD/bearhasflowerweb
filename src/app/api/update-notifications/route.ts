import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get all notifications
    const notificationsRef = collection(db, 'notifications');
    const snapshot = await getDocs(notificationsRef);
    
    let updatedCount = 0;
    let checkedCount = 0;
    const totalNotifications = snapshot.size;
    
    for (const notifDoc of snapshot.docs) {
      const notifData = notifDoc.data();
      const orderId = notifData.orderId;
      
      // Check if notification doesn't have imageUrl or has empty imageUrl
      // OR if it doesn't have isPreset or itemId (for proper display logic)
      const needsUpdate = !notifData.imageUrl || notifData.imageUrl === '' || !notifData.isPreset || !notifData.itemId;
      
      if (needsUpdate) {
        checkedCount++;
        
        if (orderId) {
          // Get order data
          const orderRef = doc(db, 'orders', orderId);
          const orderSnap = await getDoc(orderRef);
          
          if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            const primaryItem = orderData.items?.[0];
            
            if (primaryItem) {
              // Get product image
              const isDefaultRibbonImage = primaryItem?.coverImage?.includes('ริบบิ้นแดง.jpg');
              const itemImage = (primaryItem?.coverImage && !isDefaultRibbonImage) || 
                primaryItem?.image || 
                (primaryItem?.type === 'glitter_rose' ? '/images/Glitter Rose/ริบบิ้นแดง.jpg' : '') ||
                '';
              
              // Get additional info
              const isPreset = primaryItem?.isPreset === true;
              const itemId = primaryItem?.id || '';
              
              // Update notification with imageUrl and additional info
              const updateData: any = {};
              if (itemImage) {
                updateData.imageUrl = itemImage;
              }
              if (isPreset !== undefined) {
                updateData.isPreset = isPreset;
              }
              if (itemId) {
                updateData.itemId = itemId;
              }
              
              if (Object.keys(updateData).length > 0) {
                await updateDoc(notifDoc.ref, updateData);
                updatedCount++;
              }
            }
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updatedCount} notifications with images and additional info (checked ${checkedCount} of ${totalNotifications} total notifications)` 
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update notifications' 
    }, { status: 500 });
  }
}
