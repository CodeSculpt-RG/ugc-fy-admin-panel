"use client";

import React, { useMemo } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";

type CampaignRecord = {
  id: string;
  campaign: string;
  brand: string;
  budget: string;
  status: string;
  creators: number;
  created: string;
};

export default function CampaignsPage() {
  const columns = useMemo<ColumnDef<CampaignRecord>[]>(
    () => [
      {
        accessorKey: "campaign",
        header: "Campaign",
        cell: ({ row }) => (
          <span className="font-bold text-foreground">{row.original.campaign}</span>
        ),
      },
      {
        accessorKey: "brand",
        header: "Brand",
        cell: ({ row }) => <span>{row.original.brand}</span>,
      },
      {
        accessorKey: "budget",
        header: "Budget",
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
                : row.original.status === "completed"
                ? "info"
                : "warning"
            }
          />
        ),
      },
      {
        accessorKey: "creators",
        header: "Creators",
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
    <ProtectedRoute permission="campaigns.read">
      <div className="space-y-5">
        <CommandHeader
          title="Campaigns"
          description="Manage and oversee active marketing campaigns."
        />

        <DataTable
          columns={columns}
          data={[]}
          searchKey="campaign"
          searchPlaceholder="Search campaigns..."
          emptyTitle="No Campaigns Found"
          emptyDescription="Active campaigns will appear here once brands initiate them."
        />
      </div>
    </ProtectedRoute>
  );
}
