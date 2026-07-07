import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { MetricTile } from "@/app/components/shared/MetricTile";
import { SectionHeader } from "@/app/components/shared/SectionHeader";
import { AnalyticsLineChart } from "@/app/components/dashboard/AnalyticsLineChart";
import { getCampaignAnalytics } from "@/app/services/analyticsService";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowUpRight, ArrowDownRight, FileText } from "lucide-react";

export default async function CampaignsAnalyticsPage() {
  const { totalCampaigns, activeCampaigns, draftCampaigns, timeseries, recentCampaigns } = await getCampaignAnalytics();

  let highestDay = { date: "", value: -1 };
  let lowestDay = { date: "", value: Infinity };
  
  if (timeseries && timeseries.length > 0) {
    timeseries.forEach(t => {
      if (t.value > highestDay.value) highestDay = t;
      if (t.value < lowestDay.value) lowestDay = t;
    });
  } else {
    highestDay = { date: "No data", value: 0 };
    lowestDay = { date: "No data", value: 0 };
  }

  const activeRatio = totalCampaigns > 0 ? ((activeCampaigns / totalCampaigns) * 100).toFixed(1) : "0";
  const draftRatio = totalCampaigns > 0 ? ((draftCampaigns / totalCampaigns) * 100).toFixed(1) : "0";

  return (
    <DashboardShell>
      <div className="section-spacing">
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <section className="rounded-[36px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <CommandHeader 
            eyebrow="Analytics"
            title="Campaign Analytics"
            description="Track campaign creation, completion status, and market activity."
          />

          <div className="mt-8 space-y-10">
            <div>
              <SectionHeader title="Overview" description="Campaign volume metrics" />
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricTile 
                  label="Total Campaigns" 
                  value={totalCampaigns.toLocaleString()} 
                  icon={<FileText />} 
                />
                <MetricTile 
                  label="Active Campaigns" 
                  value={`${activeCampaigns.toLocaleString()} (${activeRatio}%)`} 
                  icon={<Activity />} 
                />
                <MetricTile 
                  label="Draft Campaigns" 
                  value={`${draftCampaigns.toLocaleString()} (${draftRatio}%)`} 
                  icon={<FileText />} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <SectionHeader title="Creation Trend" description="New campaigns launched over time" />
                <AnalyticsLineChart 
                  data={timeseries} 
                  dataKeys={["value"]} 
                  colors={["#f97316"]} 
                  emptyTitle="No Campaign Data"
                  emptyDescription="Campaign activity will appear once campaigns are created."
                />
              </div>
              <div>
                <SectionHeader title="Health Insights" description="Heuristics from current period" />
                <div className="space-y-4">
                  <div className="p-5 rounded-[24px] bg-white/70 border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">Highest Day</p>
                      <p className="text-sm font-medium">{highestDay.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                      {highestDay.value} <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-5 rounded-[24px] bg-white/70 border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">Lowest Day</p>
                      <p className="text-sm font-medium">{lowestDay.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 font-bold text-lg">
                      {lowestDay.value} <ArrowDownRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-5 rounded-[24px] bg-amber-50/50 border border-amber-100 shadow-sm">
                    <p className="text-xs uppercase font-bold text-amber-800/70 mb-2">Service Suggestion</p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {draftCampaigns > activeCampaigns 
                        ? "There are more draft campaigns than active ones. Reach out to brands to help them publish their briefs." 
                        : "Campaign health looks solid. Monitor active campaigns to ensure they receive enough applicants."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Recent Campaigns" description="Latest campaigns on the platform" />
              <div className="rounded-[24px] bg-white/70 border border-white/80 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {recentCampaigns.map((campaign: { id: string; title?: string; status?: string; budget?: number; created_at: string }) => (
                      <tr key={campaign.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{campaign.title || "Untitled"}</td>
                        <td className="px-6 py-4 capitalize">{campaign.status || "Draft"}</td>
                        <td className="px-6 py-4">{campaign.budget ? `₹${campaign.budget.toLocaleString()}` : "Unspecified"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(campaign.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {recentCampaigns.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No recent campaigns found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
