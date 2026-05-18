'use client';

import { useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function PresenceTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Get or generate a unique Session ID for this tab session
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    let currentUser: any = null;

    // Track Auth state changes to associate session with logged-in user
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      // Trigger update immediately when auth state changes
      updatePresence();
    });

    // 2. Define presence update function
    const updatePresence = async () => {
      try {
        const presenceRef = doc(db, 'presence', sessionId);
        await setDoc(presenceRef, {
          sessionId: sessionId,
          uid: currentUser ? currentUser.uid : null,
          displayName: currentUser ? (currentUser.displayName || currentUser.phoneNumber || 'User') : 'Guest',
          lastSeen: new Date().toISOString(),
          isRegistered: currentUser ? true : false,
        }, { merge: true });
      } catch (err) {
        // Silent catch to prevent console noise for public permissions
        console.warn('Presence update error:', err);
      }
    };

    // 3. Set up periodic heartbeat (every 30 seconds)
    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    // 4. Cleanup on unmount (tab closed or navigated away)
    const cleanupPresence = async () => {
      try {
        const presenceRef = doc(db, 'presence', sessionId);
        await deleteDoc(presenceRef);
      } catch (err) {
        console.warn('Presence cleanup error:', err);
      }
    };

    // Handle standard React component unmount
    return () => {
      clearInterval(interval);
      unsubscribeAuth();
      cleanupPresence();
    };
  }, []);

  return null; // This component doesn't render any visible UI
}
