import React from "react";
import DashboardShell from "@/app/components/layout/DashboardShell";
import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { MetricTile } from "@/app/components/shared/MetricTile";
import { SectionHeader } from "@/app/components/shared/SectionHeader";
import { getBrands } from "@/app/services/approvedUsersService";
import Link from "next/link";
import { Building2, ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import { StatusPill } from "@/app/components/shared/StatusPill";

export const dynamic = 'force-dynamic';

export default async function BrandsAnalyticsPage() {
  const approvedBrands = await getBrands("approved");
  const totalBrands = approvedBrands.length;

  return (
    <DashboardShell>
      <div className="section-spacing">
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <section className="rounded-[36px] border border-white/70 bg-white/55 p-4 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-6 lg:p-8">
          <CommandHeader 
            eyebrow="User Management"
            title="Approved Brands"
            description="Brands who have passed admin approval and verification."
          />

          <div className="mt-8 space-y-10">
            <div>
              <SectionHeader title="Overview" description="Approved brand metrics" />
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricTile 
                  label="Approved Brands" 
                  value={totalBrands.toLocaleString()} 
                  icon={<Building2 />} 
                  status={<StatusPill label="Active" variant="live" dot={false} />}
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <SectionHeader title="Directory" description="All currently approved brands on the platform" />
                <div className="relative max-w-sm w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    disabled
                    placeholder="Search name, email, handle... (coming soon)"
                    className="block w-full pl-10 pr-3 py-2 border border-black/10 rounded-full bg-white/50 text-sm focus:outline-none opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="rounded-[24px] bg-white/70 border border-white/80 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-neutral-50/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Joined / Approved</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {approvedBrands.map((brand) => {
                        const name = (brand.brand_profile?.company_name as string) || (brand.brand_profile?.brand_name as string) || (brand.brand_profile?.contact_name as string) || brand.full_name || "Unnamed Brand";
                        const email = brand.email || "No Email";
                        const joined = brand.created_at ? new Date(brand.created_at).toLocaleDateString() : "Unknown";
                        const approved = brand.kyc_approved_at ? new Date(brand.kyc_approved_at).toLocaleDateString() : "Not provided";

                        return (
                          <tr key={brand.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-foreground">{name}</div>
                              <div className="text-xs text-muted-foreground">{email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="capitalize text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                                  {brand.approval_status || "Approved"}
                                </span>
                                {brand.kyc_status && (
                                  <span className="capitalize text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                                    KYC: {brand.kyc_status}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              <div>Joined: {joined}</div>
                              <div>Approved: {approved}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link 
                                href={`/admin/users/${brand.id}`}
                                className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                              >
                                View Profile <ArrowUpRight className="ml-1 w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {approvedBrands.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <Building2 className="w-10 h-10 text-neutral-300 mb-3" />
                              <h3 className="text-lg font-medium text-neutral-900">No approved brands yet.</h3>
                              <p className="text-neutral-500 max-w-sm mt-1">Approved brands will appear here after owner or super admin approval.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

