"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type SupportRecord = {
  id: string;
  ticket: string;
  user: string;
  priority: string;
  status: string;
  created: string;
};

export default function SupportPage() {
  const columns = useMemo<ColumnDef<SupportRecord>[]>(
    () => [
      {
        accessorKey: "ticket",
        header: "Ticket",
        cell: ({ row }) => (
          <span className="font-bold text-foreground font-mono">{row.original.ticket}</span>
        ),
      },
      {
        accessorKey: "user",
        header: "User",
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <span className={row.original.priority === "urgent" ? "text-red-500 font-bold" : "text-text-secondary"}>
            {row.original.priority.toUpperCase()}
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
                : row.original.status === "open"
                ? "warning"
                : "info"
            }
          />
        ),
      },
      {
        accessorKey: "created",
        header: "Created",
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
    <ProtectedRoute permission="support.read">
      <div className="space-y-5">
        <CommandHeader
          title="Support Tickets"
          description="Manage user inquiries, disputes, and support requests."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="ticket"
          searchPlaceholder="Search tickets..."
          emptyTitle="No Support Tickets"
          emptyDescription="The support queue is empty."
        />
      </div>
    </ProtectedRoute>
  );
}
