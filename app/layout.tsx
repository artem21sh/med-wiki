import type { Metadata } from "next";
import "./globals.css";
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export const metadata: Metadata = {
  title: "МедСправочник",
  description: "База знаний нозологий",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
        <ProgressBar height="3px" color="#3b82f6" options={{ showSpinner: false }} shallowRouting />
      </body>
    </html>
  );
}
