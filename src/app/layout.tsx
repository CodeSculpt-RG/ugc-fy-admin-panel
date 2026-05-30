import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import React from "react";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "UGC FY | Admin Console",
  description: "Enterprise Operations Platform for UGC FY Marketplace",
};

import QueryProvider from "./context/QueryProvider";
import { AdminAuthProvider } from "./context/AdminAuthContext";

import { ThemeProvider } from "./context/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased light ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('admin-theme') === 'dark') {
                  document.documentElement.classList.replace('light', 'dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary font-sans" style={{ fontFamily: "var(--font-plus-jakarta-sans)" }}>
        <QueryProvider>
          <ThemeProvider>
            <AdminAuthProvider>
              {children}
            </AdminAuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
