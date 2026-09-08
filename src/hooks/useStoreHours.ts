'use client';

import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  getStoreClosedInfo,
  SystemClosureSettings,
  STORE_CLOSED_MESSAGE,
  STORE_CLOSED_TOAST,
} from '@/lib/storeHours';

export function useStoreHours() {
  const [settings, setSettings] = useState<SystemClosureSettings | null>(null);
  const settingsRef = useRef<SystemClosureSettings | null>(null);
  const [closedInfo, setClosedInfo] = useState({
    isClosed: false,
    isDailyClosed: false,
    isManualClosed: false,
    message: STORE_CLOSED_MESSAGE,
    toast: STORE_CLOSED_TOAST,
  });

  useEffect(() => {
    const refreshClosedInfo = (nextSettings: SystemClosureSettings | null = settingsRef.current) => {
      setClosedInfo(getStoreClosedInfo(nextSettings));
    };

    const initialCheckId = window.setTimeout(() => refreshClosedInfo(), 0);

    // 1. Subscribe to Firestore settings in real-time
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'systemClosure'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as SystemClosureSettings;
          settingsRef.current = data;
          setSettings(data);
          refreshClosedInfo(data);
        } else {
          settingsRef.current = null;
          setSettings(null);
          refreshClosedInfo(null);
        }
      },
      (error) => {
        console.warn('Could not read systemClosure settings:', error);
      }
    );

    // 2. Interval update to check daily hours and time range
    const intervalId = window.setInterval(() => {
      refreshClosedInfo();
    }, 30_000);

    return () => {
      window.clearTimeout(initialCheckId);
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  return {
    isClosed: closedInfo.isClosed,
    isDailyClosed: closedInfo.isDailyClosed,
    isManualClosed: closedInfo.isManualClosed,
    message: closedInfo.message,
    toast: closedInfo.toast,
    settings,
  };
}
