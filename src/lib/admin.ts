import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// 1. Hardcoded admin phone numbers for safety/emergency backup.
// You can add your administrator phone numbers here (e.g. '0812345678')
const ADMIN_PHONES = [
  '0656144703', // Primary Admin Phone
  '0622720348',
  '0872243371',
];

// 2. Hardcoded admin emails for Google sign-in
const ADMIN_EMAILS = [
  'thosapol.nir@gmail.com',
];

/**
 * Checks if a user is an admin either by their phone number, email, or by fetching their role from Firestore users collection.
 * 
 * @param uid The Firebase Auth UID
 * @param phoneNumber The user's phone number (from auth displayName or profile)
 * @param email The user's email (from Google sign-in or auth)
 * @returns Promise<boolean> true if user is an admin, false otherwise
 */
export async function checkIsAdmin(uid: string, phoneNumber: string | null | undefined, email: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  // Clean phone number (remove whitespaces, etc.)
  const cleanPhone = phoneNumber ? phoneNumber.trim() : null;
  const cleanEmail = email ? email.trim().toLowerCase() : null;

  // 1. Check hardcoded phone fallback list (Instant match)
  if (cleanPhone && ADMIN_PHONES.includes(cleanPhone)) {
    return true;
  }

  // 2. Check hardcoded email whitelist (Instant match for Google sign-in)
  if (cleanEmail && ADMIN_EMAILS.includes(cleanEmail)) {
    return true;
  }

  // 3. Check Firestore users collection for dynamic role allocation
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
