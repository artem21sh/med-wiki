import type { Metadata } from "next";
import "./globals.css";
import ProgressBar from '@/app/components/ProgressBar';

export const metadata: Metadata = {
  title: "МедСправочник",
  description: "База знаний нозологий",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ProgressBar />
        {children}
      </body>
    </html>
  );
}
