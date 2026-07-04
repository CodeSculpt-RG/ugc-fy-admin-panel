"use client";

import React, { useState } from "react";
import { Plus, UserPlus, ShieldCheck, CreditCard, FileText, Scale, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import type { AdminPermission } from "@/lib/api/adminPermissions";
import { AddAdminModal } from "../modals/AddAdminModal";
import { CreateReportModal } from "../modals/CreateReportModal";
import { OpenDisputeModal } from "../modals/OpenDisputeModal";

type QuickAction =
  | "add_admin"
  | "review_kyc"
  | "review_moderation"
  | "release_payout"
  | "create_report"
  | "open_dispute";

interface ActionItem {
  id: QuickAction;
  label: string;
  icon: React.ElementType;
  description: string;
  permissions: AdminPermission | AdminPermission[];
}

const actionConfigs: ActionItem[] = [
  { id: "add_admin", label: "Add New Admin", icon: UserPlus, description: "Create a new administrative user", permissions: "admin_management.write" },
  { id: "review_kyc", label: "Review Pending KYC", icon: ShieldCheck, description: "Verify creator identities", permissions: ["users.approve", "creators.approve", "brands.approve"] },
  { id: "review_moderation", label: "Review Moderation Queue", icon: Eye, description: "Moderate pending content", permissions: "moderation.read" },
  { id: "release_payout", label: "Release Pending Payout", icon: CreditCard, description: "Approve escrow releases", permissions: ["payments.write", "escrow.write"] },
  { id: "create_report", label: "Create Internal Report", icon: FileText, description: "Generate custom data reports", permissions: "reports.write" },
  { id: "open_dispute", label: "Open Dispute Case", icon: Scale, description: "Handle creator-brand conflicts", permissions: "disputes.write" },
];

export default function NewActionMenu() {
  const router = useRouter();
  const { hasPermission } = useAdminAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<QuickAction | null>(null);

  const checkPerm = (perms: AdminPermission | AdminPermission[]): boolean => {
    if (Array.isArray(perms)) {
      return perms.some((p) => hasPermission(p));
    }
    return hasPermission(perms);
  };

  const handleQuickAction = (action: QuickAction) => {
    setIsMenuOpen(false);

    switch (action) {
      case "add_admin":
        setActiveModal("add_admin");
        break;

      case "review_kyc":
        router.push("/admin/users?status=pending_review", { scroll: false });
        break;

      case "review_moderation":
        router.push("/admin/moderation?status=pending", { scroll: false });
        break;

      case "release_payout":
        router.push("/admin/payments?status=pending", { scroll: false });
        break;

      case "create_report":
        setActiveModal("create_report");
        break;

      case "open_dispute":
        setActiveModal("open_dispute");
        break;
    }
  };

  return (
    <>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-3 bg-primary text-primary-foreground px-6 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all outline-none group active-nav-glow"
          >
            <div className="p-1 rounded-md bg-foreground/20 group-hover:bg-foreground/30 transition-colors">
              <Plus className="w-3 h-3 stroke-[4]" />
            </div>
            <span className="hidden md:inline">New Action</span>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-80 bg-surface border border-border p-3 rounded-[32px] shadow-2xl overflow-hidden relative"
          sideOffset={16}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="px-5 py-5 mb-2 border-b border-border">
            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.5em]">Administrative Tasks</p>
          </div>
          
          <div className="space-y-1 relative z-10">
            {actionConfigs.map((action) => {
              const hasPerm = checkPerm(action.permissions);
              return (
                <DropdownMenuItem 
                  key={action.id}
                  disabled={!hasPerm}
                  onClick={() => {
                    if (hasPerm) {
                      handleQuickAction(action.id);
                    }
                  }}
                  className={`flex items-center space-x-4 p-4 rounded-[22px] focus:bg-primary focus:text-primary-foreground cursor-pointer transition-all duration-300 outline-none group border border-transparent focus:border-primary/20 ${!hasPerm ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={!hasPerm ? "No permission" : undefined}
                >
                  <div className="p-3.5 rounded-xl bg-surface-elevated border border-border group-focus:bg-foreground/10 group-focus:border-border transition-all group-focus:scale-110">
                    <action.icon className="w-4 h-4 text-primary group-focus:text-primary-foreground transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-black tracking-tight text-foreground group-focus:text-primary-foreground">{action.label}</p>
                      {!hasPerm && (
                        <span className="text-[9px] font-black text-accent-orange uppercase tracking-widest px-2 py-0.5 rounded bg-accent-orange/10 border border-accent-orange/20">Locked</span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground/30 font-semibold group-focus:text-foreground/70 transition-colors truncate uppercase tracking-wider">{action.description}</p>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddAdminModal 
        isOpen={activeModal === "add_admin"} 
        onClose={() => setActiveModal(null)} 
      />
      <CreateReportModal 
        isOpen={activeModal === "create_report"} 
        onClose={() => setActiveModal(null)} 
      />
      <OpenDisputeModal 
        isOpen={activeModal === "open_dispute"} 
        onClose={() => setActiveModal(null)} 
      />
    </>
  );
}
