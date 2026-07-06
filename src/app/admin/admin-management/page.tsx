"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminManagementPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/admin/settings/admins");
  }, [router]);

  return null;
}
