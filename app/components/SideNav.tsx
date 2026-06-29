'use client';

import { useState, useEffect } from 'react';

export interface NavItem {
  title: string;
  anchor: string;
}

export default function SideNav({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate: (anchor: string) => void;
}) {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    const handler = () => {
      // find the section closest to the top of the viewport (below sticky header)
      let current = '';
      const offset = 120;
      for (const item of items) {
        const el = document.getElementById(item.anchor);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - offset <= 0) {
          current = item.anchor;
        }
      }
      setActive(current);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="hidden lg:block sticky top-24 self-start w-56 shrink-0 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-2">
        Разделы
      </div>
      <ul className="space-y-0.5">
        {items.map(item => (
          <li key={item.anchor}>
            <button
              onClick={() => onNavigate(item.anchor)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors leading-snug ${
                active === item.anchor
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
