'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    ym?: any;
  }
}

export default function YandexMetrika({ ymId }: { ymId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load and init the counter once
  useEffect(() => {
    if (!ymId) return;
    if (window.ym && window.ym.a === undefined) return; // already fully initialized

    // Standard Metrika loader (self-contained), WITHOUT the "return if script exists" guard
    (function (m: any, e: any, t: any, r: any, i: any) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * (new Date() as any);
      const k = e.createElement(t);
      const a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(Number(ymId), 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymId]);

  // Track SPA route changes
  useEffect(() => {
    if (!ymId || typeof window.ym !== 'function') return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.ym(Number(ymId), 'hit', url);
  }, [pathname, searchParams, ymId]);

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${ymId}`}
          style={{ position: 'absolute', left: '-9999px' }}
          alt=""
        />
      </div>
    </noscript>
  );
}
