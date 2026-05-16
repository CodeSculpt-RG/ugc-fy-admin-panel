import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabase/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Infrastructure Failure: Supabase configuration missing for admin verification.");
}

const resolvedSupabaseUrl: string = supabaseUrl;
const resolvedSupabaseAnonKey: string = supabaseAnonKey;

export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { 
      success: false, 
      status: 401, 
      error: "Missing authorization token. Administrative login required." 
    };
  }

  const token = authHeader.replace("Bearer ", "");

  // Create an ephemeral user client to verify the JWT identity
  const supabaseUserClient = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseUserClient.auth.getUser(token);

  if (userError || !user) {
    return { 
      success: false, 
      status: 401, 
      error: "Invalid or expired administrative session." 
    };
  }

  if (user.email === "admin@ugc-fy.in") {
    return { success: true, user: { id: user.id, email: user.email, role: "admin" }, status: 200 };
  }

  // Use the admin client to verify the role in the users table (RLS bypass)
  const { data: profile, error: adminError } = await supabaseAdmin
    .from("users")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (adminError || !profile) {
    return { 
      success: false, 
      status: 401, 
      error: "Administrative profile not found in users ledger." 
    };
  }

  if (profile.role !== "admin") {
    return { 
      success: false, 
      status: 403, 
      error: "Access Denied: Logged-in entity lacks administrative privileges." 
    };
  }

  return { success: true, user: profile, status: 200 };
}
