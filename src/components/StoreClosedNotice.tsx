'use client';

import { STORE_CLOSED_MESSAGE } from '@/lib/storeHours';
import { useStoreHours } from '@/hooks/useStoreHours';

export default function StoreClosedNotice() {
  const { isClosed } = useStoreHours();

  if (!isClosed) return null;

  return (
    <p className="store-closed-notice">
      {STORE_CLOSED_MESSAGE}
    </p>
  );
}
