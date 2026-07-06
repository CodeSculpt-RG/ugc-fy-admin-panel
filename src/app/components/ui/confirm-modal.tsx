"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "success" | "info";
  confirmText?: string;
  cancelText?: string;
  showInput?: boolean;
  confirmTextToType?: string;
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
  showInput = false,
  confirmTextToType,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setReason("");
        setTypedConfirmation("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.pointerEvents = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-accent-orange hover:bg-accent-orange/90 text-white",
    success: "bg-success-green hover:bg-success-green/90 text-white",
    info: "bg-primary hover:bg-primary/90 text-white",
  };

  const iconStyles = {
    danger: "text-red-600 bg-red-500/10 border-red-500/20",
    warning: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    success: "text-success-green bg-success-green/10 border-success-green/20",
    info: "text-primary bg-primary/10 border-primary/20",
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/35 backdrop-blur-sm z-[200]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[201] w-full max-w-[520px] max-h-[85vh] bg-white/90 border border-white/70 rounded-[28px] shadow-[0_30px_90px_rgba(15,23,42,0.20)] backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-surface-elevated border border-border text-foreground/40 hover:text-white hover:bg-foreground/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Region */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-8">
              <div className="flex flex-col items-center text-center pt-2">
                <div className={cn("w-20 h-20 rounded-[30px] flex items-center justify-center mb-8 border-2 transition-transform duration-500 hover:scale-110", iconStyles[variant])}>
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter leading-tight uppercase tracking-[0.05em]">{title}</h3>
                <p className="text-foreground/60 pt-4 leading-relaxed font-medium text-xs sm:text-sm max-w-md mx-auto">
                  {description}
                </p>
              </div>

              {showInput && (
                <div className="space-y-4 text-left w-full">
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block">Reason for Action</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide detailed justification..."
                    className="w-full h-24 rounded-[24px] bg-surface-elevated border border-border p-5 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-foreground/20 resize-none font-medium"
                  />
                </div>
              )}

              {confirmTextToType && (
                <div className="space-y-4 text-left w-full">
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block">
                    Type &quot;{confirmTextToType}&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={typedConfirmation}
                    onChange={(e) => setTypedConfirmation(e.target.value)}
                    placeholder={`Type ${confirmTextToType}...`}
                    className="w-full h-14 rounded-2xl bg-surface-elevated border border-border px-5 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                  />
                </div>
              )}

              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-foreground/10 block truncate">
                  Secure Admin Access Protocol • Logged
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 bg-transparent border-border text-foreground/60 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => onConfirm(reason)}
                  disabled={loading || (showInput && !reason.trim()) || (confirmTextToType ? typedConfirmation !== confirmTextToType : false)}
                  className={cn("flex-1 h-14 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98]", variantStyles[variant])}
                >
                  {loading ? "INITIALIZING..." : confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
