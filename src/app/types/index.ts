export type UserStatus = "Approved" | "Pending" | "Restricted" | "Whitelisted" | "Active" | "Suspended" | "Blocked";
export type RiskLevel = "Low" | "Medium" | "High";
export type AdminRole = "OWNER" | "SUPER_ADMIN" | "MODERATION_ADMIN" | "FINANCE_ADMIN" | "SUPPORT_ADMIN" | "ANALYST";

export interface Creator {
  id: number;
  name: string;
  email: string;
  niche: string;
  followers: string;
  status: UserStatus;
  risk: RiskLevel;
  lastActive: string;
  earnings: string;
  rating: number;
}

export interface Brand {
  id: number;
  name: string;
  email: string;
  company: string;
  industry: string;
  activeCampaigns: number;
  totalSpend: string;
  status: UserStatus;
  risk: RiskLevel;
  lastActive: string;
  disputes: number;
}

export interface ModerationItem {
  id: number;
  type: "Video" | "Bio" | "Comment" | "Image";
  title: string;
  creator: string;
  campaign: string;
  status: "AI Flagged" | "User Reported" | "Pending Review" | "Restricted";
  risk: RiskLevel;
  thumbnail?: string;
  content?: string;
  timestamp: string;
}

export interface Campaign {
  id: number;
  name: string;
  brand: string;
  budget: string;
  creators: number;
  submissions: number;
  deadline: string;
  status: "Draft" | "Pending" | "Active" | "Paused" | "Completed" | "Rejected" | "Disputed";
}

export interface Payment {
  id: string;
  brand: string;
  creator: string;
  campaign: string;
  amount: string;
  commission: string;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
  date: string;
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
  campaign: string;
  type: "Payment" | "Content" | "Refund" | "Fraud" | "Deadline";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Review" | "Resolved" | "Closed";
  openedDate: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  status: "Active" | "Suspended";
  lastActive: string;
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
