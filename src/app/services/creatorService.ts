import { supabase } from "@/lib/supabase/client";
import { Creator, UserStatus, RiskLevel } from "@/app/types";

type CreatorInternal = {
  id: string;
  email: string;
  full_name: string | null;
  approval_status: "pending_review" | "approved" | "rejected" | "blocked";
  rejection_reason: string | null;
  approved_at: string | null;
  approved_by: string | null;
  updated_at: string;
  creator_profile: {
    niche?: string;
    niches?: string[];
    follower_count?: number;
    followers_count?: number;
    [key: string]: unknown;
  } | null;
};

type CreatorsApiResponse = {
  success: boolean;
  source: string;
  data?: CreatorInternal[];
  error?: {
    message: string;
    code: string;
  };
};

export const creatorService = {
  getCreators: async (): Promise<Creator[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/creators", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json() as CreatorsApiResponse;
    const errorMessage = typeof payload.error === 'string' 
      ? payload.error 
      : payload.error?.message || "Protocol failure: unable to fetch creators.";

    if (!response.ok || !payload.success) {
      throw new Error(errorMessage);
    }

    const data = payload.data ?? [];
    
    return data.map((item) => {
      const details = item.creator_profile;
      
      let nicheStr = "General";
      if (details?.niches && Array.isArray(details.niches) && details.niches.length > 0) {
        nicheStr = String(details.niches[0]);
      } else if (typeof details?.niche === 'string') {
        nicheStr = details.niche;
      }
      
      return {
        ...item,
        name: item.full_name || "Unknown Entity",
        niche: nicheStr,
        followers: (details?.follower_count ?? details?.followers_count ?? 0).toLocaleString(),
        status: (item.approval_status === 'pending_review' ? 'Pending' : (item.approval_status === 'approved' ? 'Active' : 'Restricted')) as UserStatus,
        approvalStatus: item.approval_status,
        risk: "Verified" as RiskLevel,
        lastActive: item.updated_at,
        earnings: "₹0",
        rating: 5.0,
        approvedAt: item.approved_at || undefined,
        approvedBy: item.approved_by || undefined,
        rejectionReason: item.rejection_reason || undefined
      } as Creator;
    });
  }
};
