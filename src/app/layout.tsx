import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UGC FY | Admin Console",
  description: "Enterprise Operations Platform for UGC FY Marketplace",
};

import QueryProvider from "./context/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary-blue/30 selection:text-primary-blue">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
