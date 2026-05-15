import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "МедСправочник",
  description: "База знаний нозологий",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
