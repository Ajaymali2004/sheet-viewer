import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SheetFlow",
  description: "Dynamic Google Sheets Viewer — Made by Ajay",
  referrer: "no-referrer",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}