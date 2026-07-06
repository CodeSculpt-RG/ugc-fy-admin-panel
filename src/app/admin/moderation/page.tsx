"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type ModerationRecord = {
  id: string;
  case: string;
  type: string;
  severity: string;
  status: string;
  reported: string;
  assigned: string;
};

export default function ModerationPage() {
  const columns = useMemo<ColumnDef<ModerationRecord>[]>(
    () => [
      {
        accessorKey: "case",
        header: "Case",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.case}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <span className={row.original.severity === "high" ? "text-red-500 font-bold" : "text-text-secondary"}>
            {row.original.severity.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusPill
            label={row.original.status.toUpperCase()}
            variant={
              row.original.status === "resolved"
                ? "success"
                : row.original.status === "pending"
                ? "warning"
                : "error"
            }
          />
        ),
      },
      {
        accessorKey: "reported",
        header: "Reported",
      },
      {
        accessorKey: "assigned",
        header: "Assigned",
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
    <ProtectedRoute permission="moderation.read">
      <div className="space-y-5">
        <CommandHeader
          title="Moderation"
          description="Manage reports and platform moderation cases."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="case"
          searchPlaceholder="Search cases..."
          emptyTitle="No Moderation Cases"
          emptyDescription="Platform moderation queue is clear."
        />
      </div>
    </ProtectedRoute>
  );
}
