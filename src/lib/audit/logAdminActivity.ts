import { supabaseAdmin } from "@/lib/supabase/admin";

export interface LogAdminActivityInput {
  actorAdminId: string;
  actorUserId?: string;
  targetAdminId?: string;
  module: string;
  action: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  request?: Request; // Optionally extract IP / UserAgent
}

/**
 * Non-blocking helper to write an activity log entry to `admin_activity_logs`.
 * This should never throw errors to the caller so it doesn't break primary operations.
 */
export async function logAdminActivity(input: LogAdminActivityInput): Promise<void> {
  try {
    // Sanitize metadata to avoid leaking sensitive data
    const safeMetadata = { ...input.metadata };
    if (safeMetadata.password) delete safeMetadata.password;
    if (safeMetadata.token) delete safeMetadata.token;

    let ipAddress = undefined;
    let userAgent = undefined;

    if (input.request) {
      ipAddress = input.request.headers.get("x-forwarded-for")?.split(",")[0] || undefined;
      userAgent = input.request.headers.get("user-agent") || undefined;
    }

    const { error } = await supabaseAdmin.from("admin_activity_logs").insert({
      actor_admin_id: input.actorAdminId,
      actor_user_id: input.actorUserId || null,
      target_admin_id: input.targetAdminId || null,
      module: input.module,
      action: input.action,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      description: input.description || null,
      metadata: safeMetadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      // In dev mode, we warn. In production, we should have a reliable fallback logger.
      console.warn("[logAdminActivity] Failed to insert activity log:", error.message);
    }
  } catch (err: unknown) {
    console.warn("[logAdminActivity] Exception while logging activity:", err);
  }
}
