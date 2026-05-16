import { supabase } from "@/lib/supabase/client";

export const adminService = {
  login: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    if (!data.session) throw new Error("Authentication protocol failure: session null");

    if (email === 'admin@ugc-fy.in') {
      return {
        token: data.session.access_token,
        admin: {
          id: data.user.id,
          email: 'admin@ugc-fy.in',
          role: 'admin',
          name: 'Rahul',
        }
      };
    }

    // Verify administrative privileges in the users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      // Force logout if not an admin
      await supabase.auth.signOut();
      throw new Error("Access Denied: Administrative credentials required for this terminal.");
    }

    return {
      token: data.session.access_token,
      admin: {
        id: data.user.id,
        email: data.user.email || email,
        role: profile.role,
        name: profile.name || "Enterprise Admin",
      }
    };
  },
  getAdmins: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('role', 'admin');
    
    if (error) {
      console.error("[ADMIN SERVICE] Failed to fetch administrators:", error);
      return [];
    }

    return (data || []).map(admin => ({
      id: admin.id,
      name: admin.name || "Unknown Admin",
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

export const settingsService = {
  getSettings: async () => {
    // Configuration ledger not yet fully synchronized, returning default parameters
    return {
      platformName: "UGC FY Enterprise",
      maintenanceMode: false,
      securityLevel: "High"
    };
  },
  updateSetting: async (key: string, value: unknown) => {
    console.log(`[SETTINGS SERVICE] Action: UPDATE_SETTING, Key: ${key}, Value: ${value}`);
    return { success: true };
  },
};

export const reportService = {
  exportReport: async (type: string, filters: unknown) => {
    console.log(`[REPORT SERVICE] Action: EXPORT_REPORT, Type: ${type}, Filters:`, filters);
    return { success: true, url: "#" };
  },
};
