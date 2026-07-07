import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { getRevenueAnalytics } from "@/app/services/analyticsService";
import Link from "next/link";
import { ArrowLeft, Lock, Info } from "lucide-react";

export default async function RevenueAnalyticsPage() {
  const { available } = await getRevenueAnalytics();

  if (!available) {
    return (
      <DashboardShell>
        <div className="section-spacing">
          <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <section className="rounded-[36px] border border-white/70 bg-white/55 p-12 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl flex flex-col items-center justify-center min-h-[500px] text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Restricted Access</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Revenue analytics will appear after payment tracking is connected and you have the necessary financial permissions to view this data.
            </p>
            
            <div className="flex items-start gap-3 rounded-[24px] border border-amber-500/15 bg-amber-50/75 p-4 text-amber-900 shadow-sm backdrop-blur-xl max-w-lg text-left">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold">Technical Notice</p>
                <p className="mt-1 text-sm leading-6 text-amber-800/80">
                  The financial module is currently secured. Ensure that payment gateways and tables are fully integrated before accessing this panel.
                </p>
              </div>
            </div>
          </section>
        </div>
      </DashboardShell>
    );
  }

  // Fallback if data is miraculously available
  return (
    <DashboardShell>
      <div className="section-spacing">
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <section className="rounded-[36px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <CommandHeader 
            eyebrow="Analytics"
            title="Revenue Analytics"
            description="Track platform revenue and financial health."
          />
          <div className="mt-8 flex h-[400px] items-center justify-center text-muted-foreground">
            Revenue tracking is connected but no data is available yet.
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
