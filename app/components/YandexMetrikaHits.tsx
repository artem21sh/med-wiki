'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    ym?: (id: number, action: string, url?: string, params?: object) => void;
  }
}

export default function YandexMetrikaHits({ ymId }: { ymId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ymId || typeof window.ym !== 'function') return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.ym(Number(ymId), 'hit', url);
  }, [pathname, searchParams, ymId]);

  return null;
}
