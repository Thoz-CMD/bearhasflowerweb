'use client';

import { useStoreHours } from '@/hooks/useStoreHours';

export default function StoreClosedNotice() {
  const { isClosed, message } = useStoreHours();

  if (!isClosed) return null;

  return (
    <p className="store-closed-notice">
      {message}
    </p>
  );
}

