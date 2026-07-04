import { AdminPermission, VerifiedAdmin, ROUTE_PERMISSIONS } from "@/lib/api/adminPermissions";

/**
 * Checks if the admin has the specified permission.
 * Owner/Root bypasses all restrictions.
 */
export function hasPermission(admin: VerifiedAdmin | null | undefined, permissionKey: AdminPermission): boolean {
  if (!admin || !admin.isActive) return false;
  if (admin.role === "owner") return true;
  return admin.permissions.includes(permissionKey);
}

/**
 * Checks if the admin has ANY of the specified permissions.
 */
export function hasAnyPermission(admin: VerifiedAdmin | null | undefined, permissionKeys: AdminPermission[]): boolean {
  if (!admin || !admin.isActive) return false;
  if (admin.role === "owner") return true;
  return permissionKeys.some((key) => admin.permissions.includes(key));
}

/**
 * Checks if the admin has ALL of the specified permissions.
 */
export function hasAllPermissions(admin: VerifiedAdmin | null | undefined, permissionKeys: AdminPermission[]): boolean {
  if (!admin || !admin.isActive) return false;
  if (admin.role === "owner") return true;
  return permissionKeys.every((key) => admin.permissions.includes(key));
}

/**
 * Checks if the admin can access the given route path based on ROUTE_PERMISSIONS.
 */
export function canAccessRoute(admin: VerifiedAdmin | null | undefined, pathname: string): boolean {
  if (!admin || !admin.isActive) return false;
  
  const cleanPath = pathname.split("?")[0].replace(/\/$/, "");
  let requiredPermission = ROUTE_PERMISSIONS[cleanPath];
  
  if (!requiredPermission) {
    const parentRoute = Object.keys(ROUTE_PERMISSIONS).find(
      (route) => cleanPath.startsWith(route + "/")
    );
    if (parentRoute) {
      requiredPermission = ROUTE_PERMISSIONS[parentRoute];
    }
  }

  if (!requiredPermission) return true;

  return hasPermission(admin, requiredPermission);
}

/**
 * Activity Access Scope Helpers
 */
export function canReadOwnActivity(admin: VerifiedAdmin | null | undefined): boolean {
  return hasPermission(admin, "activity.read.own");
}

export function canReadTeamActivity(admin: VerifiedAdmin | null | undefined): boolean {
  return hasPermission(admin, "activity.read.team");
}

export function canReadAllActivity(admin: VerifiedAdmin | null | undefined): boolean {
  return hasPermission(admin, "activity.read.all");
}

export function getAllowedActivityModules(admin: VerifiedAdmin | null | undefined): string[] {
  if (!admin || !admin.isActive) return [];
  if (admin.role === "owner" || admin.role === "super_admin") {
    return ["ALL"];
  }

  const allowedModules: string[] = ["profile", "profile.security"];

  switch (admin.role) {
    case "moderation_admin":
      allowedModules.push("moderation", "reports", "chat", "kyc", "users");
      break;
    case "finance_admin":
      allowedModules.push("finance", "payouts", "transactions", "payments");
      break;
    case "support_admin":
      allowedModules.push("support", "disputes", "tickets");
      break;
    case "analyst":
      allowedModules.push("dashboard", "reports", "analytics");
      break;
  }

  return allowedModules;
}

export type ActivityAccessFilter = {
  allowed: boolean;
  ownOnly?: boolean;
  modules?: string[]; 
  error?: string;
};

export function buildActivityAccessFilter(
  admin: VerifiedAdmin | null | undefined, 
  requestedScope: "own" | "team" | "all"
): ActivityAccessFilter {
  if (!admin || !admin.isActive) {
    return { allowed: false, error: "Unauthorized" };
  }

  if (requestedScope === "all") {
    if (canReadAllActivity(admin)) {
      return { allowed: true };
    }
    return { allowed: false, error: "Missing activity.read.all permission." };
  }

  if (requestedScope === "team") {
    if (canReadTeamActivity(admin)) {
      const modules = getAllowedActivityModules(admin);
      if (modules.includes("ALL")) {
        return { allowed: true }; 
      }
      return { allowed: true, modules };
    }
    return { allowed: false, error: "Missing activity.read.team permission." };
  }

  if (requestedScope === "own") {
    if (canReadOwnActivity(admin)) {
      return { allowed: true, ownOnly: true };
    }
    return { allowed: false, error: "Missing activity.read.own permission." };
  }

  return { allowed: false, error: "Invalid scope." };
}
