"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-[500px] bg-dark-surface border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-soft-white">{title}</h2>
                {subtitle && <p className="text-sm text-soft-white/40 mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-soft-white/40 hover:text-soft-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {children}
            </div>

            {/* Footer Notice */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <p className="text-[10px] text-center font-bold text-soft-white/20 uppercase tracking-widest">
                Viewing restricted administrative data
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
