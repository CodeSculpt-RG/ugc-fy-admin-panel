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
            className="flex min-h-11 items-center gap-2.5 rounded-full ugcfy-gradient-cta px-4 py-3 text-sm font-semibold text-white transition-all outline-none group hover:opacity-95 focus-visible:ring-2 focus-visible:ring-orange-500/30 sm:px-5"
          >
            <div className="rounded-full bg-white/20 p-1 transition-colors group-hover:bg-white/30">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="hidden md:inline">New Action</span>
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-80 bg-white/85 border border-white/70 p-2 rounded-[24px] shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur-2xl overflow-hidden relative"
          sideOffset={16}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          
          <div className="px-5 py-5 mb-2 border-b border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Administrative Tasks</p>
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
                  className={`flex items-center space-x-4 p-3.5 rounded-2xl focus:bg-neutral-950 focus:text-white cursor-pointer transition-all duration-300 outline-none group border border-transparent hover:bg-neutral-950 hover:text-white ${!hasPerm ? "opacity-40 cursor-not-allowed" : ""}`}
                  title={!hasPerm ? "No permission" : undefined}
                >
                  <div className="p-3 rounded-xl bg-black/5 text-neutral-600 group-hover:bg-white/20 group-hover:text-white group-focus:bg-white/20 group-focus:text-white transition-all group-focus:scale-110">
                    <action.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold tracking-normal text-neutral-900 group-focus:text-white group-hover:text-white">{action.label}</p>
                      {!hasPerm && (
                        <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">Locked</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 group-focus:text-white/70 group-hover:text-white/70 transition-colors truncate">{action.description}</p>
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
