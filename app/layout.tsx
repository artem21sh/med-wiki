import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import ProgressBar from '@/app/components/ProgressBar';
import YandexMetrikaHits from '@/app/components/YandexMetrikaHits';

const SITE_URL = "https://med-wiki.vercel.app";
const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "МедСправочник — клинический справочник нозологий на русском",
    template: "%s — МедСправочник",
  },
  description:
    "Доказательная медицина на русском языке: диагностика, лечение и осложнения заболеваний. Структурированные нозологии с пометками о доступности препаратов в РФ.",
  keywords: [
    "медицинский справочник",
    "нозологии",
    "доказательная медицина",
    "клинические рекомендации",
    "диагностика",
    "лечение",
  ],
  authors: [{ name: "МедСправочник" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: "МедСправочник",
    title: "МедСправочник — клинический справочник нозологий",
    description:
      "Доказательная медицина на русском языке: диагностика, лечение и осложнения заболеваний.",
  },
  twitter: {
    card: "summary_large_image",
    title: "МедСправочник",
    description: "Клинический справочник нозологий на русском языке.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ProgressBar />
        {children}

        {YM_ID && (
          <>
            <Script id="yandex-metrika" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                ym(${YM_ID}, "init", {
                  ssr:true,
                  webvisor:true,
                  clickmap:true,
                  accurateTrackBounce:true,
                  trackLinks:true
                });
              `}
            </Script>
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${YM_ID}`}
                  style={{ position: "absolute", left: "-9999px" }}
                  alt=""
                />
              </div>
            </noscript>
            <Suspense fallback={null}>
              <YandexMetrikaHits ymId={YM_ID} />
            </Suspense>
          </>
        )}
      </body>
    </html>
  );
}
