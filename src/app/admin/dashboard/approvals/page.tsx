import { redirect } from "next/navigation";

export default async function DashboardApprovalsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  const status = typeof params?.status === "string" ? params.status : "pending";
  const role = typeof params?.role === "string" ? params.role : undefined;
  const q = typeof params?.q === "string" ? params.q : undefined;

  query.set("status", status);
  if (role) query.set("role", role);
  if (q) query.set("q", q);

  redirect(`/admin/kyc/review?${query.toString()}`);
}
