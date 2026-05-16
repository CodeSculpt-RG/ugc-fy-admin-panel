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
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
    danger: "bg-accent-orange hover:bg-accent-orange/90 text-white",
    warning: "bg-accent-orange hover:bg-accent-orange/90 text-white",
    success: "bg-success-green hover:bg-success-green/90 text-white",
    info: "bg-primary-blue hover:bg-primary-blue/90 text-white",
  };

  const iconStyles = {
    danger: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    warning: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
    success: "text-success-green bg-success-green/10 border-success-green/20",
    info: "text-primary-blue bg-primary-blue/10 border-primary-blue/20",
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
            className="absolute inset-0 bg-black/70 backdrop-blur-md z-[200]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[201] w-full max-w-[520px] max-h-[85vh] bg-[#0F172A] border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F0F0FB]/40 hover:text-white hover:bg-white/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Region */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-8">
              <div className="flex flex-col items-center text-center pt-2">
                <div className={cn("w-20 h-20 rounded-[30px] flex items-center justify-center mb-8 border-2 transition-transform duration-500 hover:scale-110", iconStyles[variant])}>
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#F0F0FB] tracking-tighter leading-tight uppercase tracking-[0.05em]">{title}</h3>
                <p className="text-[#F0F0FB]/60 pt-4 leading-relaxed font-medium text-xs sm:text-sm max-w-md mx-auto">
                  {description}
                </p>
              </div>

              {showInput && (
                <div className="space-y-4 text-left w-full">
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block">Reason for Restriction</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide detailed justification for this security action..."
                    className="w-full h-32 rounded-[24px] bg-white/[0.02] border border-white/[0.08] p-5 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-[#F0F0FB]/20 resize-none font-medium"
                  />
                </div>
              )}

              <div className="text-center">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#F0F0FB]/10 block truncate">
                  Secure Admin Access Protocol • Logged
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 bg-transparent border-white/10 text-[#F0F0FB]/60 hover:text-[#F0F0FB] hover:bg-white/[0.04] rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={() => onConfirm(reason)}
                  disabled={loading || (showInput && !reason.trim())}
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
