export type UserStatus = "approved" | "pending" | "restricted" | "Whitelisted" | "Active" | "Suspended" | "Blocked" | "pending_review" | "rejected" | "on_hold";
export type RiskLevel = "Low" | "Medium" | "High";
export type AdminRole = "OWNER" | "SUPER_ADMIN" | "MODERATION_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN" | "ANALYST";

export interface Creator {
  id: string;
  name: string;
  email: string;
  niche: string;
  followers: string;
  status: UserStatus;
  approvalStatus: "pending_review" | "approved" | "rejected" | "blocked";
  risk: RiskLevel;
  lastActive: string;
  earnings: string;
  rating: number;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  platformId?: string;
}

export interface Brand {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  activeCampaigns: number;
  totalSpend: string;
  status: UserStatus;
  approvalStatus: "pending_review" | "approved" | "rejected" | "blocked";
  risk: RiskLevel;
  lastActive: string;
  disputes: number;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  platformId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Creator" | "Brand" | "Admin";
  status: UserStatus;
  verification: "Verified" | "Unverified";
  lastActive: string;
  riskLevel: RiskLevel;
  platformId?: string;
  phone?: string;
}

export interface ModerationItem {
  id: string;
  type: "Video" | "Bio" | "Comment" | "Image";
  title: string;
  creator: string;
  campaign: string;
  status: "AI Flagged" | "User Reported" | "Pending Review" | "Restricted" | "Resolved" | "Dismissed";
  risk: RiskLevel;
  thumbnail?: string;
  content?: string;
  timestamp: string;
}

export type CampaignProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
};

export interface Campaign {
  id: string;
  title: string;
  brand: string;
  budget: string;
  creators: number;
  submissions: number;
  deadline: string;
  status: "Draft" | "Pending" | "Active" | "Paused" | "Completed" | "Rejected" | "Disputed";
  date?: string;
  brand_profile?: CampaignProfile | null;
  creator_profile?: CampaignProfile | null;
}

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "processing";

export type PaymentProfile = {
  id: string;
  email: string | null;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export interface Payment {
  id: string;
  brand: string;
  creator: string;
  campaign: string;
  amount: string;
  commission: string;
  status: PaymentStatus;
  date: string;
  payer_profile?: PaymentProfile | null;
  payee_profile?: PaymentProfile | null;
  creator_profile?: PaymentProfile | null;
  brand_profile?: PaymentProfile | null;
  user_profile?: PaymentProfile | null;
}

export interface Escrow {
  id: string;
  campaign: string;
  brand: string;
  creator: string;
  amount: string;
  status: "Held" | "Released" | "Frozen" | "Disputed";
  releaseDate: string;
}

export interface Dispute {
  id: string;
  creator: string;
  brand: string;
  creatorId?: string;
  brandId?: string;
  campaign: string;
  type: "Payment" | "Content" | "Refund" | "Fraud" | "Deadline";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Review" | "Resolved" | "Closed";
  openedDate: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "Active" | "Suspended";
  lastActive: string;
  platformId?: string;
}

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  module: string;
  target: string;
  ip: string;
  device: string;
  timestamp: string;
  severity: "Info" | "Warning" | "Critical";
}

