import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { KycReviewClient } from "./KycReviewClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { headers } from "next/headers";
import { PendingUser } from "@/app/services/approvalService";

async function fetchInitialApprovals(): Promise<PendingUser[]> {
  try {
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie") || "";
    // Note: This relies on the backend route /api/admin/users/pending 
    // Wait, since we are on the server, we should fetch it directly or use absolute URL.
    // It's safer to use an absolute URL using the host header or a predefined origin.
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = headersList.get("host") || "localhost:3000";
    const res = await fetch(`${protocol}://${host}/api/admin/users/pending?status=pending&role=all`, {
      headers: { cookie: cookieHeader },
      cache: "no-store"
    });
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Failed to fetch initial approvals:", error);
    return [];
  }
}

export default async function KycReviewPage() {
  const initialApprovals = await fetchInitialApprovals();

  return (
    <DashboardShell>
      <div className="section-spacing">
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <section className="rounded-[36px] border border-border bg-card-bg p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] sm:p-6 lg:p-8">
          <CommandHeader 
            eyebrow="Operations"
            title="KYC Review"
            description="Review pending creator and brand verification submissions."
          />

          <KycReviewClient initialApprovals={initialApprovals} />
        </section>
      </div>
    </DashboardShell>
  );
}
