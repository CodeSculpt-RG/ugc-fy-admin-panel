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

const reports = [
  { id: "REP-001", name: "Monthly Financial Audit", type: "Financial", period: "May 2026", status: "Generated", date: "May 1, 2026" },
  { id: "REP-002", name: "Creator Performance Index", type: "Analytics", period: "Q2 2026", status: "In Progress", date: "Scheduled" },
  { id: "REP-003", name: "Campaign Fulfillment Log", type: "Operations", period: "Apr 2026", status: "Generated", date: "Apr 30, 2026" },
  { id: "REP-004", name: "User Safety & Security Audit", type: "Security", period: "Weekly", status: "Generated", date: "May 12, 2026" },
  { id: "REP-005", name: "Brand Retention Metrics", type: "Growth", period: "Yearly", status: "Archived", date: "Jan 15, 2026" },
];

export default function ReportsPage() {
  return (
    <DashboardShell>
      <PageHeader 
        title="Automated Reports" 
        subtitle="Access generated business intelligence and operational audits."
      >
        <Button className="bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl h-12 px-6 font-bold">
          Request Custom Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
         <div className="p-8 rounded-[32px] bg-primary-blue/10 border border-primary-blue/20 relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-primary-blue mb-2">Automated Dispatch</p>
               <h3 className="text-xl font-bold text-soft-white mb-4">Email Delivery Settings</h3>
               <p className="text-sm text-soft-white/60 mb-6 max-w-sm">
                  Configure who receives automated financial and performance reports directly in their inbox.
               </p>
               <div className="flex items-center space-x-3">
                  <Button variant="outline" className="border-white/10 text-soft-white hover:bg-white/5 rounded-xl font-bold">
                    Manage Recipients
                  </Button>
                  <Button variant="ghost" className="text-primary-blue hover:bg-primary-blue/10 rounded-xl font-bold">
                    <Mail className="w-4 h-4 mr-2" />
                    Test Send
                  </Button>
               </div>
            </div>
            <FileText className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-primary-blue opacity-[0.03] group-hover:scale-110 transition-transform duration-500" />
         </div>

         <div className="p-8 rounded-[32px] bg-accent-orange/10 border border-accent-orange/20 relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-accent-orange mb-2">Data Retention</p>
               <h3 className="text-xl font-bold text-soft-white mb-4">Historical Archives</h3>
               <p className="text-sm text-soft-white/60 mb-6 max-w-sm">
                  Access and restore reports older than 12 months. All platform data is backed up daily.
               </p>
               <div className="flex items-center space-x-3">
                  <Button variant="outline" className="border-white/10 text-soft-white hover:bg-white/5 rounded-xl font-bold">
                    Browse Archives
                  </Button>
               </div>
            </div>
            <Download className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-accent-orange opacity-[0.03] group-hover:scale-110 transition-transform duration-500" />
         </div>
      </div>

      <div className="bg-dark-surface border border-white/5 rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h4 className="text-xs font-bold text-soft-white/20 uppercase tracking-[0.2em]">Generated Reports</h4>
          <Button variant="ghost" size="sm" className="text-soft-white/40 hover:text-soft-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-soft-white/30">Report Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-soft-white/30">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-soft-white/30">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-soft-white/30">Generated</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((report) => (
                <tr key={report.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-soft-white/40 group-hover:text-primary-blue transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-soft-white">{report.name}</p>
                        <p className="text-[10px] text-soft-white/30 uppercase font-black">{report.id} • {report.period}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-soft-white/60">{report.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       {report.status === "Generated" ? (
                         <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                       ) : report.status === "In Progress" ? (
                         <Clock className="w-3.5 h-3.5 text-warning animate-pulse" />
                       ) : (
                         <Trash2 className="w-3.5 h-3.5 text-soft-white/20" />
                       )}
                       <span className="text-xs font-bold text-soft-white/40">{report.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-soft-white/30 font-mono">{report.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-soft-white/20 hover:text-soft-white">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-soft-white/20 hover:text-soft-white">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
