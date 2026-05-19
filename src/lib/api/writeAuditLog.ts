import { supabaseAdmin } from "../supabase/admin";
import type { AdminRole } from "./adminPermissions";

interface WriteAuditLogOptions {
  actorAdminId: string;
  actorRole: AdminRole;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Write a non-blocking audit log entry to admin_audit_logs.
 * Failures are logged to console but never thrown — audit logging
 * must never break the primary operation.
 */
export async function writeAuditLog(opts: WriteAuditLogOptions): Promise<void> {
  const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
    actor_admin_id: opts.actorAdminId,
    actor_role: opts.actorRole,
    action: opts.action,
    target_type: opts.targetType ?? null,
    target_id: opts.targetId ?? null,
    metadata: opts.metadata ?? {},
  });

  if (error) {
    console.error("[writeAuditLog] Failed to write audit entry:", error.message);
  }
}
