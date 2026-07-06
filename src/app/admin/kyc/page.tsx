"use client";

import React, { useMemo } from "react";
import { BadgeCheck, ClipboardCheck, FileWarning, ShieldAlert } from "lucide-react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { StatCard } from "@/app/components/ui/core";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type KycRecord = {
  id: string;
  applicant: string;
  type: string;
  status: string;
  submitted: string;
  risk: string;
};

export default function KycPage() {
  const columns = useMemo<ColumnDef<KycRecord>[]>(
    () => [
      {
        accessorKey: "applicant",
        header: "Applicant",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.applicant}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
      },
      {
        accessorKey: "status",
        header: "KYC Status",
        cell: ({ row }) => (
          <StatusPill
            label={row.original.status.toUpperCase()}
            variant={
              row.original.status === "approved"
                ? "success"
                : row.original.status === "rejected"
                ? "error"
                : "warning"
            }
          />
        ),
      },
      {
        accessorKey: "submitted",
        header: "Submitted",
      },
      {
        accessorKey: "risk",
        header: "Risk",
        cell: ({ row }) => (
          <span className={row.original.risk === "high" ? "text-red-500 font-bold" : "text-text-secondary"}>
            {row.original.risk.toUpperCase()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => {
          return <ActionDropdown actions={[]} />;
        },
      },
    ],
    []
  );

  return (
    <ProtectedRoute permission="kyc.read">
      <div className="space-y-5">
        <CommandHeader
          title="KYC Review"
          description="Review creator and brand verification queues."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Pending Reviews" value="0" icon={ClipboardCheck} color="blue" />
          <StatCard label="Approved Profiles" value="0" icon={BadgeCheck} color="success" delay={0.05} />
          <StatCard label="Rejected Profiles" value="0" icon={FileWarning} color="orange" delay={0.1} />
          <StatCard label="Requires Attention" value="0" icon={ShieldAlert} color="error" delay={0.15} />
        </div>

        <DataTable
          columns={columns}
          data={[]}
          searchKey="applicant"
          searchPlaceholder="Search applicants..."
          emptyTitle="KYC Queue Is Ready"
          emptyDescription="Verification records will appear here once creators and brands begin submitting documents."
        />
      </div>
    </ProtectedRoute>
  );
}
