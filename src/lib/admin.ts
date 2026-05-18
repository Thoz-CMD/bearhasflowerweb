import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// 1. Hardcoded admin phone numbers for safety/emergency backup.
// You can add your administrator phone numbers here (e.g. '0812345678')
const ADMIN_PHONES = [
  '0656144703', // Primary Admin Phone
  '0622720348',
  '0872243371',
];

/**
 * Checks if a user is an admin either by their phone number or by fetching their role from Firestore users collection.
 * 
 * @param uid The Firebase Auth UID
 * @param phoneNumber The user's phone number (from auth displayName or profile)
 * @returns Promise<boolean> true if user is an admin, false otherwise
 */
export async function checkIsAdmin(uid: string, phoneNumber: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  // Clean phone number (remove whitespaces, etc.)
  const cleanPhone = phoneNumber ? phoneNumber.trim() : null;

  // 1. Check hardcoded fallback list (Instant match)
  if (cleanPhone && ADMIN_PHONES.includes(cleanPhone)) {
    return true;
  }

  // 2. Check Firestore users collection for dynamic role allocation
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === 'admin';
    }
  } catch (error) {
    console.error('Error checking admin status in Firestore:', error);
  }

  return false;
}
