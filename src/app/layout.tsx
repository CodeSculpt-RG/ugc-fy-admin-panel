import type { Metadata } from "next";
import "./globals.css";
import React from "react";

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
    <html lang="en" className="h-full antialiased light" suppressHydrationWarning>
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
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary font-sans" suppressHydrationWarning>
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
