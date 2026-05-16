import { supabase } from "@/lib/supabase/client";
import { Brand, UserStatus, RiskLevel } from "@/app/types";

type BrandInternal = {
  id: string;
  email: string;
  full_name: string | null;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked";
  rejection_reason: string | null;
  updated_at: string;
  brand_profile: {
    company_name?: string;
    industry?: string;
    [key: string]: unknown;
  } | null;
};

type BrandsApiResponse = {
  success: boolean;
  source: string;
  data?: BrandInternal[];
  error?: {
    message: string;
    code: string;
  };
};

export const brandService = {
  getBrands: async (): Promise<Brand[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/brands", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json() as BrandsApiResponse;
    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message || "Protocol failure: unable to fetch brands.");
    }

    const data = payload.data ?? [];
    
    return data.map((item) => {
      const details = item.brand_profile;
      
      return {
        id: item.id,
        name: details?.company_name || item.full_name || "Unknown Entity",
        email: item.email,
        company: details?.company_name || "Unregistered Corp",
        industry: details?.industry || "Commercial",
        activeCampaigns: 0,
        totalSpend: "$0",
        status: (item.approval_status === 'pending_review' ? 'Pending' : (item.approval_status === 'approved' ? 'Active' : 'Restricted')) as UserStatus,
        approvalStatus: item.approval_status,
        risk: "Low" as RiskLevel,
        lastActive: item.updated_at,
        disputes: 0,
        rejectionReason: item.rejection_reason || undefined
      };
    });
  },
};
