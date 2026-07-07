"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { DataTable } from "@/app/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { ActionDropdown } from "@/app/components/ui/action-dropdown";
import { AddAdminModal } from "@/app/components/modals/AddAdminModal";
import { Button } from "@/app/components/ui/button";
import { UserPlus } from "lucide-react";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

type AdminRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
};

export default function AdminsPage() {
  const { admin } = useAdminAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<AdminRecord[]>([]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admins");
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
      } else {
        console.error("Failed to fetch admins:", json.error);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAdmins();
  }, [fetchAdmins]);

  const columns = useMemo<ColumnDef<AdminRecord>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Admin",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{row.original.full_name || "Unknown"}</span>
            <span className="text-xs text-foreground/60">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <span className="capitalize font-semibold text-xs text-primary">{row.original.role.replace("_", " ")}</span>,
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
                : row.original.status === "suspended" || row.original.status === "revoked"
                ? "error"
                : row.original.status === "invited" || row.original.status === "pending"
                ? "warning"
                : "default"
            }
          />
        ),
      },
      {
        accessorKey: "last_login_at",
        header: "Last Login",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.last_login_at ? new Date(row.original.last_login_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Never"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-xs">
            {row.original.created_at ? new Date(row.original.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: () => {
          // ActionDropdown can be populated in future iterations
          return <ActionDropdown actions={[]} />;
        },
      },
    ],
    []
  );

  return (
    <ProtectedRoute permission="settings.read">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <CommandHeader
            title="Admin Team"
            description="Manage administrative access and roles across the UGCFY platform."
          />
          {(admin?.role === "owner" || admin?.role === "super_admin") && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex-shrink-0 h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data}
          searchKey="email"
          searchPlaceholder="Search admins by email..."
          emptyTitle="No Admins Found"
          emptyDescription="Administrative records will appear here."
        />
        
        {isModalOpen && (
          <AddAdminModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchAdmins}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
