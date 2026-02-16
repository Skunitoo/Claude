import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "ShiftFlow - Grafik pracy dla Twojego biznesu",
  description: "System zarządzania grafikiem pracy dla restauracji, sklepów i salonów w Polsce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
