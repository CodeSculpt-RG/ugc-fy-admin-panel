"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Radio,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { setCookie } from "cookies-next";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/app/store/authStore";
import { getPublicErrorMessage } from "@/lib/auth/admin-errors";

import { getSafeAdminRedirect } from "@/lib/auth/safe-redirect";

type AllowedMethods = {
  google: boolean;
  otp: boolean;
  password: boolean;
};

type CheckEmailResponse =
  | {
      allowed: true;
      email: string;
      status: "invited" | "active";
      methods: AllowedMethods;
      devFallback?: boolean;
    }
  | {
      allowed: false;
      reason:
        | "NOT_INVITED"
        | "BANNED"
        | "SUSPENDED"
        | "REVOKED"
        | "INVALID_EMAIL"
        | "CONFIG_ERROR"
        | "GENERIC_ERROR"
        | "UNKNOWN";
      message?: string;
    };

type RequestOtpResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
      message: string;
    };

type AdminMeResponse =
  | {
      ok: true;
      admin: {
        id: string;
        user_id: string | null;
        email: string;
        full_name: string | null;
        role: string;
        status: "invited" | "active" | "suspended" | "revoked";
        password_enabled: boolean;
      };
    }
  | {
      ok: false;
      code?: string;
      error?: string;
      message?: string;
    };

type LoginAction = "verify" | "google" | "otp" | "password";
type LoginMode = "password" | "otp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getFriendlyCheckError(data: CheckEmailResponse): string {
  if (data.allowed) return "Unable to verify this admin email.";
  if (data.message) return data.message;
  return getPublicErrorMessage(data.reason || "NOT_INVITED");
}

function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loginMode, setLoginMode] = useState<LoginMode>("password");
  const [showPassword, setShowPassword] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
  const [allowedMethods, setAllowedMethods] = useState<AllowedMethods | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loadingAction, setLoadingAction] = useState<LoginAction | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  const setupSuccess = searchParams.get("setup") === "success";
  const queryError = searchParams.get("error");

  const nextPath = useMemo(() => {
    return getSafeAdminRedirect(searchParams.get("next"));
  }, [searchParams]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailIsVerified = Boolean(checkedEmail && checkedEmail === normalizedEmail && allowedMethods);
  const isBusy = loadingAction !== null;

  useEffect(() => {
    if (loginMode === "otp") {
      otpInputRef.current?.focus();
    }
  }, [loginMode]);

  const resetEmailState = (value: string) => {
    setEmail(value);
    const nextEmail = value.trim().toLowerCase();
    if (checkedEmail && checkedEmail !== nextEmail) {
      setCheckedEmail(null);
      setAllowedMethods(null);
      setOtpSent(false);
      setOtpCode("");
      setMessage(null);
    }
  };


  function normalizeLoginError(error: unknown): string {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The login request timed out. Please try again.";
    }
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return "Unable to reach the admin session endpoint. Please check your connection and try again.";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Unable to complete admin login. Please try again.";
  }

  const completeAdminSession = async (accessToken: string): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    let meResponse: Response;
    try {
      meResponse = await fetch("/api/admin/me", {
        method: "GET",
        credentials: "include",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      window.clearTimeout(timeoutId);
      const message = normalizeLoginError(fetchErr);
      if (process.env.NODE_ENV !== "production") {
        console.warn("[AdminLogin] completeAdminSession fetch error:", message);
      }
      setError(message);
      return false;
    } finally {
      window.clearTimeout(timeoutId);
    }

    const meData = (await meResponse.json().catch(() => ({}))) as AdminMeResponse;

    type AdminMeResponseTyped = {
      ok?: boolean;
      success?: boolean;
      admin?: {
        id: string;
        user_id: string | null;
        email: string;
        full_name: string | null;
        role: string;
        status: "invited" | "active" | "suspended" | "revoked";
        password_enabled: boolean;
      };
      code?: string;
      error?: string;
      message?: string;
    };
    const data = meData as AdminMeResponseTyped;
    const isSuccess = Boolean(meResponse.ok && (data.ok === true || data.success === true) && data.admin);

    if (!isSuccess) {
      await supabaseBrowserClient.auth.signOut();
      if (meResponse.status === 401 || meResponse.status === 403) {
        setError("This account is not authorized for admin access.");
      } else {
        const errCode = data.code || data.error || "NOT_INVITED";
        setError(data.message || getPublicErrorMessage(errCode));
      }
      return false;
    }


    setCookie("admin-token", accessToken, {
      maxAge: 60 * 60 * 12,
      path: "/",
    });

    const admin = data.admin!;
    const storeAdmin = {
      id: admin.id,
      email: admin.email,
      role: admin.role.toUpperCase(),
      name: admin.full_name || admin.email.split("@")[0],
      full_name: admin.full_name,
      permissions: [] as string[],
      isActive: admin.status === "active",
    };

    type AuthStoreParam = Parameters<typeof setAuth>[0];
    setAuth(storeAdmin as unknown as AuthStoreParam, accessToken);
    return true;
  };

  const verifyAdminEmail = async (
    action: LoginAction,
    options: { quiet?: boolean } = {}
  ): Promise<AllowedMethods | null> => {
    if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
      setError("Please enter a valid admin email.");
      setMessage(null);
      return null;
    }

    if (emailIsVerified && allowedMethods) {
      return allowedMethods;
    }

    setLoadingAction(action);
    setError(null);
    setMessage(null);
    setOtpSent(false);

    try {
      const response = await fetch("/api/admin/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = (await response.json()) as CheckEmailResponse;
      if (!response.ok || !data.allowed) {
        setCheckedEmail(null);
        setAllowedMethods(null);
        setError(getFriendlyCheckError(data));
        return null;
      }

      setCheckedEmail(data.email);
      setAllowedMethods(data.methods);
      if (!options.quiet) {
        setMessage("Admin email verified. Choose an approved sign-in method.");
      }
      return data.methods;
    } catch {
      setError("Unable to verify admin email. Please try again.");
      return null;
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleLogin = async () => {
    const methods = await verifyAdminEmail("google", { quiet: true });
    if (!methods) return;
    if (!methods.google) {
      setError("Google login is not enabled for this admin.");
      return;
    }

    setLoadingAction("google");
    setError(null);
    setMessage(null);

    try {
      try {
        sessionStorage.setItem("admin_oauth_expected_email", normalizedEmail);
      } catch {
        // Non-critical; /api/admin/me remains the final authorization boundary.
      }

      const { error: oAuthError } = await supabaseBrowserClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/auth/callback?next=${encodeURIComponent(nextPath)}`,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (oAuthError) throw oAuthError;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start Google login.";
      setError(msg);
      setLoadingAction(null);
    }
  };

  const handleOtpLogin = async () => {
    const methods = await verifyAdminEmail("otp", { quiet: true });
    if (!methods) return;
    if (!methods.otp) {
      setError("OTP login is not enabled for this admin.");
      return;
    }

    setLoadingAction("otp");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const result = (await response.json()) as RequestOtpResponse;

      if (!response.ok || !result.success) {
        setError(result.message || "Unable to send OTP.");
        return;
      }

      setOtpSent(true);
      setLoginMode("otp");
      setPassword("");
      setMessage("OTP sent to your approved admin email.");
    } catch {
      setError("Unable to send OTP. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
      setError("Enter your admin email first.");
      setMessage(null);
      return;
    }

    if (!otpCode || otpCode.length < 6) {
      setError("Enter the OTP sent to your admin email.");
      setMessage(null);
      return;
    }

    setLoadingAction("otp");
    setError(null);

    try {
      const { data, error: otpError } = await supabaseBrowserClient.auth.verifyOtp({
        email: normalizedEmail,
        token: otpCode,
        type: "email",
      });

      if (otpError || !data.session) {
        setError("Invalid or expired OTP.");
        return;
      }

      const authorized = await completeAdminSession(data.session.access_token);
      if (!authorized) return;

      router.push(nextPath);
      router.refresh();
    } catch (error: unknown) {
      console.error("OTP verification failed:", error);
      setError("Unable to verify OTP. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePasswordLogin = async () => {
    const methods = await verifyAdminEmail("password", { quiet: true });
    if (!methods) return;

    if (!methods.password) {
      setError("Password login is not enabled for this admin. Use Google or OTP first.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoadingAction("password");
    setError(null);
    setMessage(null);

    try {
      const { data, error: authErr } = await supabaseBrowserClient.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authErr || !data.session) {
        setError("Invalid email or password.");
        return;
      }

      const authorized = await completeAdminSession(data.session.access_token);
      if (!authorized) return;

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loginMode === "otp") {
      await handleVerifyOtp();
      return;
    }

    await handlePasswordLogin();
  };

  const renderButtonLoader = (action: LoginAction, label: string) => {
    if (loadingAction === action) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    return label;
  };

  return (
    <div className="min-h-screen bg-white text-zinc-950 lg:grid lg:grid-cols-[40%_60%]">
      <section className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-14">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl shadow-orange-900/10">
              <Shield className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight">UGCFY</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                Admin Console
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950">
              Welcome back, Admin
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Sign in to manage creators, brands, campaigns, KYC, moderation, and platform operations.
            </p>
          </div>

          {setupSuccess && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Admin account configuration updated. You may now sign in.</span>
            </div>
          )}

          {queryError && !error && (
            <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Authentication could not be completed. Please try again.</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isBusy}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Globe className="h-5 w-5 text-orange-600" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
              OR SIGN IN WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="admin-email" className="text-sm font-bold text-zinc-800">
                  Admin Email
                </label>
                {emailIsVerified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => resetEmailState(event.target.value)}
                  placeholder="admin@ugcfy.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-12 pr-4 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>

            {loginMode === "password" ? (
              <div className="space-y-2">
                <label htmlFor="admin-password" className="text-sm font-bold text-zinc-800">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-12 pr-12 text-sm font-semibold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-bold text-zinc-800">
                  OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={otpInputRef}
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(value);
                    }}
                    className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-12 pr-4 text-sm font-semibold tracking-[0.35em] text-zinc-950 outline-none transition placeholder:tracking-normal placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                  />
                </div>
                <p className="text-xs font-semibold text-zinc-500">
                  {otpSent
                    ? "OTP sent to your approved admin email."
                    : "Check your approved admin email for the verification code."}
                </p>
              </div>
            )}

            {error && (
              <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div className="grid gap-3 pt-1">
              {loginMode === "password" && (
                <button
                  type="button"
                  onClick={() => verifyAdminEmail("verify")}
                  disabled={isBusy}
                  className="h-11 rounded-2xl border border-zinc-200 bg-white text-sm font-bold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {renderButtonLoader("verify", "Verify Identity")}
                </button>
              )}

              {loginMode === "password" ? (
                <button
                  type="button"
                  onClick={handleOtpLogin}
                  disabled={isBusy}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-orange-700 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingAction === "otp" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Request OTP instead</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("password");
                    setOtpCode("");
                    setError(null);
                    setMessage(null);
                  }}
                  disabled={isBusy}
                  className="flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-zinc-600 transition hover:bg-zinc-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock className="h-4 w-4" />
                  <span>Use password instead</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-sm font-black text-white shadow-xl shadow-orange-600/20 transition hover:from-orange-700 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAction === "password" || (loginMode === "otp" && loadingAction === "otp") ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{loginMode === "otp" ? "Verify OTP" : "Sign in securely"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
            <Link
              href="/admin/forgot-password"
              className="text-zinc-500 transition hover:text-orange-700 animate-pulse"
            >
              Forgot password?
            </Link>
            <a
              href="mailto:ugcfybycreatornavigator@gmail.com?subject=UGCFY%20admin%20access%20request"
              className="text-zinc-950 transition hover:text-orange-700"
            >
              Need admin access? Contact owner
            </a>
          </div>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs font-semibold leading-5 text-zinc-500">
            Protected admin access. All login attempts are monitored. Only approved UGCFY administrators can access this dashboard.
          </div>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-zinc-950 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(234,88,12,0.28),transparent_34%),radial-gradient(circle_at_72%_18%,rgba(251,146,60,0.28),transparent_26%),radial-gradient(circle_at_22%_82%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#09090b,#18181b)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-between p-10 xl:p-14">
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-2xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
              UGCFY Admin Console • Secure Operations Center
            </div>
          </div>

          <div className="w-full">
            <div className="mb-10 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                <Sparkles className="h-3.5 w-3.5" />
                Platform command layer
              </div>
              <h2 className="text-5xl font-black tracking-tight text-white xl:text-6xl">
                Secure operations for the creator economy.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
                Review creator quality, monitor brand activity, and keep UGCFY workflows moving from one protected console.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
                <div className="mb-7 flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-300">Active Campaigns</span>
                  <Activity className="h-5 w-5 text-orange-300" />
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-white">1,248</p>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-black text-emerald-300">
                    +12%
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
                <div className="mb-7 flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-300">Creator Verification</span>
                  <Users className="h-5 w-5 text-orange-300" />
                </div>
                <p className="text-3xl font-black text-white">Pending: 42</p>
                <p className="mt-2 text-xs font-semibold text-zinc-400">KYC queue under review</p>
              </div>

              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-300">Live Moderation</p>
                    <p className="mt-2 text-3xl font-black text-white">System Healthy</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                    <Radio className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-6 text-xs font-bold text-zinc-500">
            <span>Invite-only administrator access</span>
            <span>Monitored session perimeter</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
          Loading admin authorization...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
