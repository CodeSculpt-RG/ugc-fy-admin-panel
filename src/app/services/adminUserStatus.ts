export type NormalizedApprovalState = "approved" | "pending" | "rejected" | "blocked";

export type ApprovalStatusInput = {
  approval_status?: string | null;
  kyc_status?: string | null;
  is_verified?: boolean | null;
  is_active?: boolean | null;
  is_blocked?: boolean | null;
};

export function normalizeApprovalState(input: ApprovalStatusInput): NormalizedApprovalState {
  const approval = input.approval_status?.toLowerCase().trim() ?? "";
  const kyc = input.kyc_status?.toLowerCase().trim() ?? "";

  // 1. Blocked takes precedence
  if (
    input.is_blocked === true ||
    approval === "blocked" ||
    kyc === "blocked"
  ) {
    return "blocked";
  }

  // 2. Rejected is next
  if (approval === "rejected" || kyc === "rejected") {
    return "rejected";
  }

  // 3. Approved
  // Wait, the user said: "Only include is_verified === true as approved if the current codebase clearly uses it that way."
  // We'll require explicit approval or kyc approval first.
  if (approval === "approved" || kyc === "approved") {
    return "approved";
  }
  
  if (input.is_verified === true && (approval === "" || approval === "approved")) {
    // Some legacy rows might just have is_verified = true without approval_status
    return "approved";
  }

  // 4. Pending / everything else
  return "pending";
}
