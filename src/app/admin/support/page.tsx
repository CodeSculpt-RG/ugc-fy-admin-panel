"use client";

import React from "react";
import { CheckCircle2, MessageSquareText, Reply, Siren } from "lucide-react";
import { PageHeader, StatCard } from "@/app/components/ui/core";
import { EmptyState } from "@/app/components/ui/shared-states";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";

export default function SupportPage() {
  return (
    <ProtectedRoute permission="support.read">
      <div className="section-spacing">
        <PageHeader
          title="Support"
          subtitle="Manage support tickets and admin escalations."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open Tickets" value="0" icon={MessageSquareText} color="blue" />
          <StatCard label="Pending Replies" value="0" icon={Reply} color="orange" delay={0.05} />
          <StatCard label="Escalated" value="0" icon={Siren} color="error" delay={0.1} />
          <StatCard label="Resolved" value="0" icon={CheckCircle2} color="success" delay={0.15} />
        </div>

        <EmptyState
          title="Support Queue Is Ready"
          description="Support ticket data is not fully available yet. The dashboard remains operational while support tables are configured."
          icon={<MessageSquareText className="w-12 h-12 text-primary" />}
        />
      </div>
    </ProtectedRoute>
  );
}
