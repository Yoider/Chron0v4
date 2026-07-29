import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/context/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CHRON0V4 — Context & Productivity Manager",
  description: "Sistema de preservación de contexto y bitácora para desarrolladores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-screen overflow-hidden antialiased`}
    >
      <body className="h-full flex flex-col overflow-hidden bg-[#070913] text-[#c5c6c7] selection:bg-[#a78bfa] selection:text-[#070913]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
