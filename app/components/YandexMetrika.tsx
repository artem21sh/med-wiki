'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    ym?: any;
  }
}

// Module-level flag — guarantees the loader/init snippet runs exactly once
// for the page's lifetime, unaffected by StrictMode's double-invoke,
// Fast Refresh, or a Suspense remount of this subtree.
let ymLoaded = false;

export default function YandexMetrika({ ymId }: { ymId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Load and init the counter — guaranteed to run exactly once
  useEffect(() => {
    if (!ymId || ymLoaded) return;
    ymLoaded = true;

    // Official Yandex Metrika snippet — unmodified, including the
    // duplicate-script guard (for (var j...) if src === r return).
    (function (m: any, e: any, t: any, r: any, i: any) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * (new Date() as any);
      for (let j = 0; j < e.scripts.length; j++) {
        if (e.scripts[j].src === r) return;
      }
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

  // Track SPA route changes. Skip the very first render — 'init' above
  // already registers the initial pageview, so firing 'hit' here too
  // would double-count it.
  useEffect(() => {
    if (!ymId || typeof window.ym !== 'function') return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
