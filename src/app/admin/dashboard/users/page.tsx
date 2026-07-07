import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { formatDateStable } from "@/lib/utils/formatDate";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { MetricTile } from "@/app/components/shared/MetricTile";
import { SectionHeader } from "@/app/components/shared/SectionHeader";
import { AnalyticsAreaChart } from "@/app/components/dashboard/AnalyticsAreaChart";
import { getUserAnalytics } from "@/app/services/analyticsService";
import Link from "next/link";
import { Users, User, ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default async function UsersAnalyticsPage() {
  const { totalUsers, totalCreators, totalBrands, timeseries, recentUsers } = await getUserAnalytics();

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

  const creatorRatio = totalUsers > 0 ? ((totalCreators / totalUsers) * 100).toFixed(1) : "0";
  const brandRatio = totalUsers > 0 ? ((totalBrands / totalUsers) * 100).toFixed(1) : "0";

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
            title="User Growth Analytics"
            description="Deep dive into platform user acquisition, creator/brand ratios, and registration trends."
          />

          <div className="mt-8 space-y-10">
            <div>
              <SectionHeader title="Overview" description="Current platform user distribution" />
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricTile 
                  label="Total Users" 
                  value={totalUsers.toLocaleString()} 
                  icon={<Users />} 
                />
                <MetricTile 
                  label="Creators" 
                  value={`${totalCreators.toLocaleString()} (${creatorRatio}%)`} 
                  icon={<User />} 
                />
                <MetricTile 
                  label="Brands" 
                  value={`${totalBrands.toLocaleString()} (${brandRatio}%)`} 
                  icon={<User />} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2">
                <SectionHeader title="Growth Trend" description="User registrations over time" />
                <AnalyticsAreaChart 
                  data={timeseries} 
                  dataKeys={["value"]} 
                  colors={["#3b82f6"]} 
                  emptyTitle="No Growth Data"
                  emptyDescription="User growth will appear once profiles are created."
                />
              </div>
              <div>
                <SectionHeader title="Growth Insights" description="Heuristics from current period" />
                <div className="space-y-4">
                  <div className="p-5 rounded-[24px] bg-white/70 border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">Highest Growth Day</p>
                      <p className="text-sm font-medium">{highestDay.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-lg">
                      {highestDay.value} <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-5 rounded-[24px] bg-white/70 border border-white/80 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase font-bold text-muted-foreground">Lowest Growth Day</p>
                      <p className="text-sm font-medium">{lowestDay.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-red-600 font-bold text-lg">
                      {lowestDay.value} <ArrowDownRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="p-5 rounded-[24px] bg-amber-50/50 border border-amber-100 shadow-sm">
                    <p className="text-xs uppercase font-bold text-amber-800/70 mb-2">Service Suggestion</p>
                    <p className="text-sm text-amber-900 leading-relaxed">
                      {totalCreators > totalBrands 
                        ? "Creators outnumber brands significantly. Focus on brand acquisition and outreach to ensure enough campaigns are available." 
                        : "Brands are matching or exceeding creators. Focus on creator onboarding to ensure enough talent for campaigns."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader title="Recent Registrations" description="Latest users to join the platform" />
              <div className="rounded-[24px] bg-white/70 border border-white/80 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-50/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {recentUsers.map((user: { id: string; full_name?: string; role?: string; status?: string; created_at: string }) => (
                      <tr key={user.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{user.full_name || "Unknown"}</td>
                        <td className="px-6 py-4 capitalize">{user.role || "User"}</td>
                        <td className="px-6 py-4 capitalize">{user.status || "Active"}</td>
                        <td className="px-6 py-4 text-muted-foreground">{formatDateStable(user.created_at)}</td>
                      </tr>
                    ))}
                    {recentUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No recent users found.</td>
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
