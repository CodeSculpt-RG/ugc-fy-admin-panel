import React from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 
        Next.js dev overlay stringifies raw ErrorEvents as [object Event].
        Recharts ResponsiveContainer triggers harmless ResizeObserver loop limit errors.
        We suppress this specific ResizeObserver ErrorEvent to prevent the overlay.
      */}
      {process.env.NODE_ENV === "development" ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'ResizeObserver loop completed with undelivered notifications.') {
                  e.stopImmediatePropagation();
                }
              });
            `,
          }}
        />
      ) : null}
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </>
  );
}
