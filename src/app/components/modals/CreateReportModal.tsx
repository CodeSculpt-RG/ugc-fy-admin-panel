"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { reportService } from "@/app/services/reportService";
import { useToast } from "@/app/hooks/useToast";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateReportModal({ isOpen, onClose, onSuccess }: CreateReportModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Financial");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [format, setFormat] = useState("json");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        setTitle("");
        setType("Financial");
        setDateRange("Last 30 Days");
        setFormat("json");
        setNotes("");
        setErrorMessage("");
      }, 0);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    setLoading(true);
    try {
      const res = await reportService.generateReport({
        title: title.trim() || `${type} Compliance Package - ${dateRange}`,
        type,
        dateRange,
        format,
        notes: notes.trim(),
      });

      showToast(res.message || "Intelligence report successfully generated.", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate report.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
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
            className="relative z-[201] w-full max-w-[540px] max-h-[90vh] bg-[#0F172A] border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/50 to-transparent" />

            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-white/[0.03] border border-white/5 text-[#F0F0FB]/40 hover:text-white hover:bg-white/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Region */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
              <div className="flex items-center space-x-4 border-b border-white/[0.05] pb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary-blue/10">
                  <FileText className="w-6 h-6 text-primary-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#F0F0FB] tracking-tight uppercase">Generate Internal Report</h3>
                  <p className="text-xs text-[#F0F0FB]/40 font-medium mt-1">Dispatch automated platform compliance and intelligence package.</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-accent-orange/10 border border-accent-orange/20 flex items-center space-x-3 text-accent-orange text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4 font-medium text-sm">
                <div>
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Report Ledger Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Q3 Executive Fiscal Package"
                    className="w-full h-13 rounded-2xl bg-white/[0.02] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-[#F0F0FB]/20 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Compliance Vector Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-13 rounded-2xl bg-[#111827] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
                  >
                    <option value="Financial">Financial (Treasury & Payouts)</option>
                    <option value="User">User (Network & KYC Compliance)</option>
                    <option value="Campaign">Campaign (Brand Activity & Escrow)</option>
                    <option value="Security">Security (Access Vectors & Audits)</option>
                    <option value="Dispute">Dispute (Arbitration Ledger)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Temporal Date Range *</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full h-13 rounded-2xl bg-[#111827] border border-white/[0.08] px-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
                  >
                    <option value="Last 7 Days">Past 7 Days</option>
                    <option value="Last 30 Days">Past 30 Days</option>
                    <option value="Current Fiscal Quarter">Current Fiscal Quarter</option>
                    <option value="All Time">All Time (System Origin)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Extraction Format *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["json", "csv", "pdf"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormat(fmt)}
                        className={`h-12 rounded-xl border flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all ${format === fmt ? "bg-primary-blue border-primary-blue text-white shadow-lg shadow-primary-blue/20" : "bg-white/[0.02] border-white/[0.08] text-[#F0F0FB]/40 hover:text-white"}`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.3em] px-2 block mb-2">Optional Dispatch Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide specific parameters or notes for executive distribution..."
                    className="w-full h-28 rounded-2xl bg-white/[0.02] border border-white/[0.08] p-4 text-sm text-[#F0F0FB] focus:outline-none focus:border-primary-blue/40 focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-[#F0F0FB]/20 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/[0.05] w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 bg-transparent border-white/10 text-[#F0F0FB]/60 hover:text-[#F0F0FB] hover:bg-white/[0.04] rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-14 rounded-[20px] bg-primary-blue hover:bg-primary-blue/90 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-primary-blue/20"
                >
                  {loading ? "DISPATCHING..." : "GENERATE REPORT"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
