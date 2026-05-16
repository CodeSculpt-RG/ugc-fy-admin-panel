"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DetailDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}: DetailDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] pointer-events-auto">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md z-[120]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-screen w-full max-w-[600px] bg-[#0F172A] border-l border-white/10 z-[121] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 sm:p-12 border-b border-white/[0.05] flex items-start justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-700 pointer-events-none">
                <X className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-1">
                <h2 className="text-3xl sm:text-4xl font-black text-[#F0F0FB] tracking-tighter">{title}</h2>
                {subtitle && <p className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em] mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="relative z-10 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB]/20 hover:text-[#F0F0FB] hover:border-white/10 hover:bg-white/5 transition-all group/btn"
              >
                <X className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar relative z-10">
              {children}
            </div>

            {/* Footer Notice */}
            <div className="p-8 border-t border-white/[0.05] bg-black/[0.02]">
              <p className="text-[9px] text-center font-black text-[#F0F0FB]/10 uppercase tracking-[0.5em] truncate">
                Secure Admin Access Protocol • Ecosystem Ledger
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
