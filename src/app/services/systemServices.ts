import { supabase } from "@/lib/supabase/client";

export const adminService = {
  login: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw new Error(error.message);
    if (!data.session?.access_token) {
      throw new Error("Login succeeded but session was not created.");
    }

    if (email === 'admin@ugc-fy.in') {
      return {
        token: data.session.access_token,
        admin: {
          id: data.user.id,
          email: 'admin@ugc-fy.in',
          role: 'owner' as const,
          name: 'Rahul',
          permissions: [],
          isActive: true,
        }
      };
    }

    // Verify administrative privileges in admin_profiles table
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (adminProfile && adminProfile.is_active) {
      return {
        token: data.session.access_token,
        admin: {
          id: data.user.id,
          email: data.user.email || email,
          role: adminProfile.role,
          name: adminProfile.full_name || "Enterprise Admin",
          permissions: [],
          isActive: true,
        }
      };
    }

    // Fallback check profiles for bootstrap
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin' || profile?.role === 'owner') {
      return {
        token: data.session.access_token,
        admin: {
          id: data.user.id,
          email: data.user.email || email,
          role: 'owner' as const,
          name: profile.full_name || "Enterprise Admin",
          permissions: [],
          isActive: true,
        }
      };
    }

    await supabase.auth.signOut();
    throw new Error("Access Denied: Administrative credentials required for this terminal.");
  },
  getAdmins: async () => {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, full_name, email, role, is_active');
    
    if (error) {
      console.error("[ADMIN SERVICE] Failed to fetch administrators:", error);
      return [];
    }

    return (data || []).map(admin => ({
      id: admin.id,
      name: admin.full_name || "Unknown Admin",
      email: admin.email,
      role: admin.role,
      status: admin.is_active ? 'Active' : 'Inactive'
    }));
  },
  getAuditLogs: async () => {
    // Audit logs table not yet fully synchronized, returning empty ledger
    return [];
  },
};

export type PlatformSettingsPayload = {
  platformName: string;
  supportEmail: string;
  feePercentage: number;
  currencyBase: string;
  mandatory2fa: boolean;
  maintenanceMode: boolean;
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
};

export type PlatformSettingItem = {
  key: string;
  value: Record<string, unknown>;
  category?: string;
  label?: string;
  description?: string;
};

export type GetSettingsResponse = {
  isMissingTable?: boolean;
  tableName?: string;
  migrationSql?: string;
  settings: PlatformSettingItem[];
};

export const settingsService = {
  getSettings: async (): Promise<GetSettingsResponse> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/settings", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      if (payload.isMissingTable) {
        return {
          isMissingTable: true,
          tableName: payload.tableName,
          migrationSql: payload.migrationSql,
          settings: [],
        };
      }
      throw new Error(payload.error?.message || "Failed to fetch settings.");
    }
    if (payload.isMissingTable) {
      return {
        isMissingTable: true,
        tableName: payload.tableName,
        migrationSql: payload.migrationSql,
        settings: [],
      };
    }
    return {
      isMissingTable: false,
      settings: (payload.data || []) as PlatformSettingItem[],
    };
  },
  updateSettings: async (updates: Partial<PlatformSettingsPayload>) => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Auth error: ${sessionError.message}`);
    if (!session?.access_token) throw new Error("Administrative session required.");

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error?.message || "Failed to save settings.");
    return payload.data;
  },
};
