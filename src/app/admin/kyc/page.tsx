"use client";

import React from "react";
import { BadgeCheck, ClipboardCheck, FileWarning, ShieldAlert } from "lucide-react";
import { PageHeader, StatCard } from "@/app/components/ui/core";
import { EmptyState } from "@/app/components/ui/shared-states";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";

export default function KycPage() {
  return (
    <ProtectedRoute permission="kyc.read">
      <div className="section-spacing">
        <PageHeader
          title="KYC Review"
          subtitle="Review creator and brand verification queues."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending Reviews" value="0" icon={ClipboardCheck} color="blue" />
          <StatCard label="Approved Profiles" value="0" icon={BadgeCheck} color="success" delay={0.05} />
          <StatCard label="Rejected Profiles" value="0" icon={FileWarning} color="orange" delay={0.1} />
          <StatCard label="Requires Attention" value="0" icon={ShieldAlert} color="error" delay={0.15} />
        </div>

        <EmptyState
          title="KYC Queue Is Ready"
          description="Verification data is not fully available yet. The dashboard remains operational while KYC tables are configured."
          icon={<ClipboardCheck className="w-12 h-12 text-primary" />}
        />
      </div>
    </ProtectedRoute>
  );
}
