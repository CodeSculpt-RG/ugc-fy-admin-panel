"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  loading = false,
  variant = "danger",
  confirmText = "Confirm Action",
  cancelText = "Cancel",
}: ConfirmModalProps) {
  const variantStyles = {
    danger: "bg-error hover:bg-error/90 shadow-error/20",
    warning: "bg-warning hover:bg-warning/90 shadow-warning/20",
    success: "bg-success hover:bg-success/90 shadow-success/20",
    info: "bg-primary-blue hover:bg-primary-blue/90 shadow-primary-blue/20",
  };

  const iconStyles = {
    danger: "text-error bg-error/10 border-error/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    success: "text-success bg-success/10 border-success/20",
    info: "text-primary-blue bg-primary-blue/10 border-primary-blue/20",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-surface border-white/10 rounded-[32px] p-8 max-w-[440px]">
        <DialogHeader className="flex flex-col items-center text-center">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border", iconStyles[variant])}>
            <ShieldAlert className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-bold text-soft-white">{title}</DialogTitle>
          <DialogDescription className="text-soft-white/40 pt-2">
            {description}
            <span className="block mt-4 text-[10px] font-bold uppercase tracking-widest text-soft-white/20">
              This action will be recorded in audit logs.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white/5 border-white/10 text-soft-white hover:bg-white/10 rounded-2xl py-6 font-bold"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn("flex-1 text-white rounded-2xl py-6 font-bold shadow-lg transition-all", variantStyles[variant])}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
