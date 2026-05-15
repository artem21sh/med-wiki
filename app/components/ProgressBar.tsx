'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ProgressBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setLoading(true);
    setWidth(30);
    const t1 = setTimeout(() => setWidth(70), 100);
    const t2 = setTimeout(() => setWidth(90), 500);
    const t3 = setTimeout(() => {
      setWidth(100);
      setTimeout(() => { setLoading(false); setWidth(0); }, 200);
    }, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: '3px', background: '#e5e7eb'
    }}>
      <div style={{
        height: '100%', background: '#3b82f6',
        width: width + '%', transition: 'width 0.3s ease'
      }} />
    </div>
  );
}
