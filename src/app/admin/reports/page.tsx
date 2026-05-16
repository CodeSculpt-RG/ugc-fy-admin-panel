"use client";

import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { PageHeader } from "@/app/components/ui/core";
import { 
  FileText, 
  Download, 
  Trash2, 
  Mail, 
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";


const reports = [
  { id: "REP-001", name: "Monthly Financial Audit", type: "Financial", period: "May 2026", status: "Generated", date: "May 1, 2026" },
  { id: "REP-002", name: "Creator Performance Index", type: "Analytics", period: "Q2 2026", status: "In Progress", date: "Scheduled" },
  { id: "REP-003", name: "Campaign Fulfillment Log", type: "Operations", period: "Apr 2026", status: "Generated", date: "Apr 30, 2026" },
  { id: "REP-004", name: "User Safety & Security Audit", type: "Security", period: "Weekly", status: "Generated", date: "May 12, 2026" },
  { id: "REP-005", name: "Brand Retention Metrics", type: "Growth", period: "Yearly", status: "Archived", date: "Jan 15, 2026" },
];

import { useToast } from "@/app/hooks/useToast";

export default function ReportsPage() {
  const { showToast } = useToast();

  const handleProtocol = () => {
    showToast("Custom intelligence protocol initialized", "success");
  };

  const handleDownload = (id: string) => {
    showToast(`Downloading intelligence report ${id}`, "info");
  };

  const handleView = (id: string) => {
    showToast(`Opening report ${id} in secure viewer`, "info");
  };

  return (
    <DashboardShell>
      <div className="section-spacing">
        <PageHeader 
          title="Intelligence Repository" 
          subtitle="Access automated business intelligence, operational audits, and forensic platform reports."
        >
          <button 
            onClick={handleProtocol}
            className="h-12 px-8 rounded-2xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-xl shadow-primary-blue/20 active:scale-95"
          >
            Initialize Custom Protocol
          </button>

        </PageHeader>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="p-10 rounded-[40px] bg-[#111827] border border-white/[0.08] relative overflow-hidden group shadow-sm">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-blue mb-4">Automated Dispatch</p>
                 <h3 className="text-2xl font-black text-[#F0F0FB] mb-4 tracking-tight leading-none">Transmission Configuration</h3>
                 <p className="text-[13px] text-[#F0F0FB]/40 mb-8 max-w-sm leading-relaxed font-medium">
                    Configure high-priority dispatch protocols for automated fiscal and performance intelligence directly to executive stakeholders.
                 </p>
                 <div className="flex items-center space-x-4">
                    <button className="h-11 px-6 rounded-xl bg-primary-blue text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-blue/90 transition-all shadow-lg shadow-primary-blue/20">
                      Manage Nodes
                    </button>
                    <button className="h-11 px-6 rounded-xl bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-2.5" />
                      Test Link
                    </button>
                 </div>
              </div>
              <FileText className="absolute right-[-40px] bottom-[-40px] w-56 h-56 text-primary-blue opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
           </div>

           <div className="p-10 rounded-[40px] bg-[#111827] border border-white/[0.08] relative overflow-hidden group shadow-sm">
              <div className="relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F0F0FB]/40 mb-4">Lifecycle Retention</p>
                 <h3 className="text-2xl font-black text-[#F0F0FB] mb-4 tracking-tight leading-none">Historical Archives</h3>
                 <p className="text-[13px] text-[#F0F0FB]/40 mb-8 max-w-sm leading-relaxed font-medium">
                    Access and restore platform intelligence reports from previous fiscal periods. All platform data is secured via daily cold storage.
                 </p>
                 <div className="flex items-center space-x-4">
                    <button className="h-11 px-8 rounded-xl bg-white/[0.02] border border-white/10 text-[#F0F0FB] font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-sm">
                      Browse Cold Storage
                    </button>
                 </div>
              </div>
              <Download className="absolute right-[-40px] bottom-[-40px] w-56 h-56 text-white opacity-[0.02] group-hover:scale-110 transition-transform duration-700" />
           </div>
        </div>


        <div className="bg-[#0F172A] border border-white/[0.08] rounded-[40px] overflow-hidden shadow-premium relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/30 to-transparent" />
          
          <div className="px-10 py-8 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
            <h4 className="text-[10px] font-black text-[#F0F0FB]/30 uppercase tracking-[0.4em]">Generated Intelligence Ledger</h4>
            <button className="flex items-center space-x-2.5 text-[10px] font-black text-[#F0F0FB]/40 hover:text-[#F0F0FB] uppercase tracking-widest transition-colors">
              <Filter className="w-4 h-4" />
              <span>Configure Filter</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/20">Report Identifier</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/20">Vector</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/20">Protocol State</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-[#F0F0FB]/20">Temporal Timestamp</th>

                  <th className="px-10 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-white/[0.02] transition-colors duration-300">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:border-primary-blue/20 group-hover:bg-primary-blue/5 transition-all duration-500 shadow-sm">
                          <FileText className="w-5 h-5 text-[#F0F0FB]/20 group-hover:text-primary-blue transition-colors" />
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-[#F0F0FB] tracking-tight leading-none">{report.name}</p>
                          <p className="text-[10px] text-[#F0F0FB]/20 uppercase font-black tracking-widest mt-2">{report.id} <span className="mx-1.5 opacity-50">•</span> {report.period}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[11px] font-black text-[#F0F0FB]/40 uppercase tracking-widest bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.05]">{report.type}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                         {report.status === "Generated" ? (
                           <CheckCircle2 className="w-4 h-4 text-success-green" />
                         ) : report.status === "In Progress" ? (
                           <Clock className="w-4 h-4 text-warning animate-pulse" />
                         ) : (
                           <Trash2 className="w-4 h-4 text-[#F0F0FB]/10" />
                         )}
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-widest",
                           report.status === "Generated" ? "text-success-green" : 
                           report.status === "In Progress" ? "text-warning" : "text-[#F0F0FB]/30"
                         )}>{report.status}</span>
                      </div>
                    </td>

                    <td className="px-10 py-6">
                      <span className="text-[11px] font-black text-[#F0F0FB]/20 tracking-tighter uppercase">{report.date}</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDownload(report.id)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB]/20 hover:bg-white hover:text-black hover:border-white transition-all shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleView(report.id)}
                          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.05] text-[#F0F0FB]/20 hover:bg-white hover:text-black hover:border-white transition-all shadow-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
