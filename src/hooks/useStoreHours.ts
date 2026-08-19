'use client';

import { useEffect, useState } from 'react';
import { isStoreClosed } from '@/lib/storeHours';

export function useStoreHours() {
  const [isClosed, setIsClosed] = useState(() => isStoreClosed());

  useEffect(() => {
    const update = () => setIsClosed(isStoreClosed());
    update();

    const intervalId = window.setInterval(update, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return { isClosed };
}
