'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    ym?: any;
  }
}

export default function YandexMetrikaHits({ ymId }: { ymId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Track SPA route changes. Skip the very first render — the inline
  // snippet in <head> (app/layout.tsx) already registers the initial
  // pageview via ym('init'), so firing 'hit' here too would double-count it.
  useEffect(() => {
    if (!ymId || typeof window.ym !== 'function') return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.ym(Number(ymId), 'hit', url);
  }, [pathname, searchParams, ymId]);

  return null;
}
