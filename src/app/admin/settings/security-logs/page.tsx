"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type SecurityLogRecord = {
  id: string;
  event: string;
  actor: string;
  ip: string;
  severity: string;
  created: string;
  metadata: string;
};

export default function SecurityLogsPage() {
  const columns = useMemo<ColumnDef<SecurityLogRecord>[]>(
    () => [
      {
        accessorKey: "event",
        header: "Event",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.event}</span>
        ),
      },
      {
        accessorKey: "actor",
        header: "Actor",
      },
      {
        accessorKey: "ip",
        header: "IP Address",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <span className={row.original.severity === "critical" || row.original.severity === "high" ? "text-red-500 font-bold" : "text-text-secondary"}>
            {row.original.severity.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "created",
        header: "Created",
      },
      {
        accessorKey: "metadata",
        header: "Metadata",
        cell: ({ row }) => <span className="font-mono text-xs text-text-secondary truncate block max-w-[200px]">{row.original.metadata}</span>,
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
    <ProtectedRoute permission="settings.read">
      <div className="space-y-5">
        <CommandHeader
          title="Security Logs"
          description="Review platform security and access logs."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="event"
          searchPlaceholder="Search events..."
          emptyTitle="No Logs Found"
          emptyDescription="Security events will appear here."
        />
      </div>
    </ProtectedRoute>
  );
}
