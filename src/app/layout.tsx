import type { Metadata } from "next";
import "./globals.css";
import React from "react";

export const metadata: Metadata = {
  title: "UGC FY | Admin Console",
  description: "Enterprise Operations Platform for UGC FY Marketplace",
};

import QueryProvider from "./context/QueryProvider";
import { AdminAuthProvider } from "./context/AdminAuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary-blue/30 selection:text-primary-blue">
        <QueryProvider>
          <AdminAuthProvider>
            {children}
          </AdminAuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
