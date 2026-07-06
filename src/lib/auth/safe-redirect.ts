export function getSafeAdminRedirect(next: string | null): string {
  if (!next) return "/admin/dashboard";

  try {
    if (!next.startsWith("/admin")) return "/admin/dashboard";
    if (next.startsWith("//")) return "/admin/dashboard";
    if (next.includes("://")) return "/admin/dashboard";
    return next;
  } catch {
    return "/admin/dashboard";
  }
}
