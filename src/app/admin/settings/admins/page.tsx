"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type AdminRecord = {
  id: string;
  admin: string;
  role: string;
  status: string;
  lastLogin: string;
  created: string;
};

export default function AdminsPage() {
  const columns = useMemo<ColumnDef<AdminRecord>[]>(
    () => [
      {
        accessorKey: "admin",
        header: "Admin",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.admin}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <span className="capitalize">{row.original.role.replace("_", " ")}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusPill
            label={row.original.status.toUpperCase()}
            variant={
              row.original.status === "active"
                ? "success"
                : row.original.status === "suspended"
                ? "error"
                : "warning"
            }
          />
        ),
      },
      {
        accessorKey: "lastLogin",
        header: "Last Login",
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
    <ProtectedRoute permission="settings.read">
      <div className="space-y-5">
        <CommandHeader
          title="Admin Management"
          description="Manage administrative access and roles."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="admin"
          searchPlaceholder="Search admins..."
          emptyTitle="No Admins Found"
          emptyDescription="Administrative records will appear here."
        />
      </div>
    </ProtectedRoute>
  );
}
