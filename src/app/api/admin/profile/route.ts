import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/requirePermission';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizeError } from '@/lib/api/normalizeError';
import { logAdminActivity } from '@/lib/audit/logAdminActivity';

export async function GET(request: Request) {
  try {
    const check = await requirePermission(request, "profile.read");
    if (!check.ok) return check.response;

    // profile is already hydrated in check.admin by verifyAdmin
    return NextResponse.json({
      success: true,
      data: check.admin,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('[GET /api/admin/profile]', error);
    return NextResponse.json(
      { success: false, error: normalizeError(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const check = await requirePermission(request, "profile.update");
    if (!check.ok) return check.response;

    const body = await request.json();
    const { full_name, avatar_url } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) {
      updates.full_name = full_name;
    }
    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length === 1) {
      // only updated_at
      return NextResponse.json({ success: true, data: check.admin });
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('admin_profiles')
      .select('id')
      .eq('id', check.admin.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error } = await supabaseAdmin.from('admin_profiles').insert({
        id: check.admin.id,
        email: check.admin.email,
        role: check.admin.role,
        full_name: full_name ?? check.admin.fullName,
        avatar_url: avatar_url ?? check.admin.avatarUrl,
        is_active: true
      });
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('admin_profiles')
        .update(updates)
        .eq('id', check.admin.id);
      if (error) throw error;
    }

    // Optional: Log activity in non-blocking way
    void logAdminActivity({
      actorAdminId: check.admin.id,
      module: 'profile',
      action: avatar_url && !full_name ? 'avatar.updated' : 'profile.updated',
      targetAdminId: check.admin.id,
      description: 'Admin updated their profile',
      metadata: {
        changedFields: Object.keys(updates).filter(k => k !== 'updated_at'),
        before: {
          full_name: existingProfile ? check.admin.fullName : null,
          avatar_url: existingProfile ? check.admin.avatarUrl : null,
        },
        after: {
          full_name: updates.full_name ?? check.admin.fullName,
          avatar_url: updates.avatar_url ?? check.admin.avatarUrl,
        }
      }
    }).catch(e => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[profile] activity log failed:', e);
      }
    });

    return NextResponse.json({
      ok: true,
      success: true, // legacy compat
      message: 'Profile updated successfully',
      profile: {
        id: check.admin.id,
        email: check.admin.email,
        full_name: full_name ?? check.admin.fullName,
        avatar_url: avatar_url ?? check.admin.avatarUrl,
        role: check.admin.role,
        permissions: check.admin.permissions
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('[PATCH /api/admin/profile]', error);
    return NextResponse.json(
      { ok: false, success: false, error: normalizeError(error) },
      { status: 500 }
    );
  }
}
