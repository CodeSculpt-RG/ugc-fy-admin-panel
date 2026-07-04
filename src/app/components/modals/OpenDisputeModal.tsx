"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { disputeService } from "@/app/services/financialServices";
import { useToast } from "@/app/hooks/useToast";

interface OpenDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpenDisputeModal({ isOpen, onClose, onSuccess }: OpenDisputeModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  const [targetEmailOrId, setTargetEmailOrId] = useState("");
  const [type, setType] = useState("Payment");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
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
        setTargetEmailOrId("");
        setType("Payment");
        setPriority("Medium");
        setDescription("");
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

    if (!targetEmailOrId.trim() || !description.trim()) {
      setErrorMessage("Please provide target identifier and detailed arbitration description.");
      return;
    }

    setLoading(true);
    try {
      const res = await disputeService.openDispute({
        targetEmailOrId: targetEmailOrId.trim(),
        type,
        priority,
        description: description.trim(),
      });

      showToast(typeof res.message === 'string' && res.message ? res.message : "Dispute case successfully logged and assigned.", "success");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to open dispute case.";
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
            className="absolute inset-0 bg-background/70 backdrop-blur-md z-[200]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-[201] w-full max-w-[540px] max-h-[90vh] bg-card-bg border border-border rounded-[32px] sm:rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-orange/50 to-transparent" />

            <button
              onClick={onClose}
              className="absolute right-6 top-6 p-2 rounded-2xl bg-surface-elevated border border-border text-foreground/40 hover:text-primary-foreground hover:bg-foreground/10 transition-all z-20 outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Region */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-6">
              <div className="flex items-center space-x-4 border-b border-border pb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/10">
                  <Scale className="w-6 h-6 text-accent-orange" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Open Dispute Case</h3>
                  <p className="text-xs text-foreground/40 font-medium mt-1">Initiate platform arbitration for brand or creator conflict.</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center space-x-3 text-accent-orange text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4 font-medium text-sm">
                <div>
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Target Email or User ID *</label>
                  <input
                    type="text"
                    required
                    value={targetEmailOrId}
                    onChange={(e) => setTargetEmailOrId(e.target.value)}
                    placeholder="creator@example.com or UUID"
                    className="w-full h-13 rounded-2xl bg-surface-elevated border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-accent-orange/20 transition-all placeholder:text-foreground/20 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Dispute Classification Vector *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-13 rounded-2xl bg-surface border border-border px-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-accent-orange/20 transition-all cursor-pointer font-semibold uppercase tracking-wider text-xs"
                  >
                    <option value="Payment">Payment (Escrow Hold / Release)</option>
                    <option value="Content">Content (Copyright / Deliverable Quality)</option>
                    <option value="Refund">Refund (Brand Request / Incomplete)</option>
                    <option value="Fraud">Fraud (Identity Verification / Bot Activity)</option>
                    <option value="Deadline">Deadline (Overdue Deliverables)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Case Priority Level *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["Low", "Medium", "High", "Critical"] as const).map((pri) => (
                      <button
                        key={pri}
                        type="button"
                        onClick={() => setPriority(pri)}
                        className={`h-11 rounded-xl border flex items-center justify-center font-black text-[11px] uppercase tracking-wider transition-all ${priority === pri ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-surface-elevated border-border text-foreground/40 hover:text-primary-foreground"}`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em] px-2 block mb-2">Resolution & Case Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full context, contract terms, and deliverables under dispute..."
                    className="w-full h-28 rounded-2xl bg-surface-elevated border border-border p-4 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-accent-orange/20 transition-all placeholder:text-foreground/20 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-14 bg-transparent border-border text-foreground/60 hover:text-foreground hover:bg-surface-elevated hover:bg-foreground/5 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-14 rounded-[20px] bg-accent-orange hover:bg-accent-orange/90 text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.98] shadow-xl shadow-accent-orange/20"
                >
                  {loading ? "INITIALIZING..." : "OPEN DISPUTE CASE"}
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
