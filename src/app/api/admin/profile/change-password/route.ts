import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { normalizeError } from '@/lib/api/normalizeError';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/audit/logAdminActivity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  try {
    const check = await requirePermission(request, "profile.security.update");
    if (!check.ok) return check.response;



    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: "Password must be at least 8 characters long." } },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
       throw new Error("Supabase config missing");
    }

    // Update password using the verified admin's ID
    // We use the admin client on the backend to ensure it succeeds without needing a full client session.
    // The verifyAdmin check has already guaranteed we are only modifying the currently authenticated admin.
    const { error } = await supabaseAdmin.auth.admin.updateUserById(check.admin.id, {
      password: password
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    
    // Update profile
    const { error: dbError } = await supabaseAdmin
      .from("admin_profiles")
      .update({
        must_change_password: false,
        password_changed_at: now,
        updated_at: now,
        // If it was pending, mark it accepted
      })
      .eq("id", check.admin.id);

    if (dbError) {
      console.error("[change-password] Failed to update admin_profiles:", dbError);
    }
    
    // Check if they were pending
    const { data: profileCheck } = await supabaseAdmin
      .from("admin_profiles")
      .select("invite_status")
      .eq("id", check.admin.id)
      .single();
      
    if (profileCheck?.invite_status === 'pending') {
      await supabaseAdmin.from("admin_profiles").update({
        invite_status: "accepted",
        accepted_at: now
      }).eq("id", check.admin.id);
      
      void logAdminActivity({
        actorAdminId: check.admin.id,
        module: 'profile.security',
        action: 'invite_accepted',
        targetAdminId: check.admin.id,
        description: 'Admin accepted invite and changed password',
      });
    }

    // Optional: Log activity non-blocking
    void logAdminActivity({
      actorAdminId: check.admin.id,
      module: 'profile.security',
      action: 'password.changed',
      targetAdminId: check.admin.id,
      description: 'Admin changed their password',
      metadata: {
        changed: true,
        method: 'self_service'
      }
    }).catch(e => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[profile.security] activity log failed:', e);
      }
    });

    return NextResponse.json({
      ok: true,
      success: true, // legacy compat
      message: 'Password updated successfully',
      admin: {
        must_change_password: false,
        invite_status: profileCheck?.invite_status === 'pending' ? 'accepted' : profileCheck?.invite_status
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('[POST /api/admin/profile/change-password]', error);
    return NextResponse.json(
      { ok: false, success: false, error: normalizeError(error) },
      { status: 500 }
    );
  }
}
