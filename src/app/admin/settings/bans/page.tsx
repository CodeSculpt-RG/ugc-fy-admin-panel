"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type BanRecord = {
  id: string;
  target: string;
  reason: string;
  status: string;
  created: string;
  expires: string;
};

export default function BansPage() {
  const columns = useMemo<ColumnDef<BanRecord>[]>(
    () => [
      {
        accessorKey: "target",
        header: "Target",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.target}</span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusPill
            label={row.original.status.toUpperCase()}
            variant={
              row.original.status === "active"
                ? "error"
                : row.original.status === "expired" || row.original.status === "lifted"
                ? "success"
                : "warning"
            }
          />
        ),
      },
      {
        accessorKey: "created",
        header: "Created",
      },
      {
        accessorKey: "expires",
        header: "Expires",
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
          title="Access Bans"
          description="Manage user bans and platform access restrictions."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="target"
          searchPlaceholder="Search banned targets..."
          emptyTitle="No Active Bans"
          emptyDescription="Platform bans will appear here."
        />
      </div>
    </ProtectedRoute>
  );
}
