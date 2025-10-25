import type { Metadata } from "next";
import "./globals.css";
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: "WalkScape - Explore, Collect, Grow",
  description: "A mobile-first social exploration game where you collect real-world locations and grow digital biomes on Push Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
