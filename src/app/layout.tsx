import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control TIC | UAEMéx",
  description: "Gestión de inventario, aulas, reservas de salas y mesa de ayuda TIC.",
};

/**
 * Layout raíz (antes index.html + App.jsx). Es un Server Component:
 * los proveedores y el NavBar, que necesitan el navegador, son Client Components.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-superficie font-sans text-sobre-superficie">
        <Providers>
          <Suspense fallback={<div className="h-16 bg-verde-oscuro" />}>
            <NavBar />
          </Suspense>
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
