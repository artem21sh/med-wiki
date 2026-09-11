import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import ProgressBar from '@/app/components/ProgressBar';
import YandexMetrika from '@/app/components/YandexMetrika';

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
          <Suspense fallback={null}>
            <YandexMetrika ymId={YM_ID} />
          </Suspense>
        )}
      </body>
    </html>
  );
}
