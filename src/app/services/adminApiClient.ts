import { supabase } from "@/lib/supabase/client";

const SESSION_EXPIRED_EVENT = "admin-session-expired";
const GET_DEDUPE_WINDOW_MS = 1500;

type AdminFetchOptions = RequestInit & {
  dedupe?: boolean;
};

type InFlightEntry = {
  createdAt: number;
  promise: Promise<Response>;
};

const inFlightRequests = new Map<string, InFlightEntry>();
let sessionExpiredDispatched = false;

export class AdminSessionExpiredError extends Error {
  constructor(message = "Administrative session expired. Please login again.") {
    super(message);
    this.name = "AdminSessionExpiredError";
  }
}

export function isAdminSessionExpiredError(error: unknown): boolean {
  return error instanceof AdminSessionExpiredError;
}

export function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (!(error instanceof Error)) return false;

  return (
    error.name === "AbortError" ||
    error.message.toLowerCase().includes("signal is aborted")
  );
}

export function notifyAdminSessionExpired() {
  if (sessionExpiredDispatched) return;
  sessionExpiredDispatched = true;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

export function resetAdminSessionExpiredNotice() {
  sessionExpiredDispatched = false;
}

export function onAdminSessionExpired(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

export async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Authentication session error: ${error.message}`);
  }

  if (!session?.access_token) {
    notifyAdminSessionExpired();
    throw new AdminSessionExpiredError();
  }

  resetAdminSessionExpiredNotice();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

function buildRequestKey(url: string, init: RequestInit): string {
  return JSON.stringify({
    method: init.method || "GET",
    url,
    body: typeof init.body === "string" ? init.body : null,
  });
}

export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const { dedupe, ...fetchOptions } = options;
  const method = options.method || "GET";
  const headers = {
    ...(await getAdminAuthHeaders()),
    ...(options.headers || {}),
  };
  // AbortSignal Guard Clause
  let validSignal: AbortSignal | undefined = undefined;
  if (options.signal && typeof AbortSignal !== 'undefined' && options.signal instanceof AbortSignal) {
    validSignal = options.signal;
  }

  const init: RequestInit = {
    ...fetchOptions,
    method,
    headers,
    cache: options.cache ?? "no-store",
    signal: validSignal,
  };

  if (validSignal?.aborted) {
    throw new DOMException("Administrative request cancelled", "AbortError");
  }

  const shouldDedupe = dedupe ?? (method.toUpperCase() === "GET" && !options.signal);
  const key = shouldDedupe ? buildRequestKey(url, init) : "";
  const now = Date.now();
  const existing = key ? inFlightRequests.get(key) : undefined;

  if (existing && now - existing.createdAt < GET_DEDUPE_WINDOW_MS) {
    return existing.promise.then((response) => response.clone());
  }

  const promise = fetch(url, init).then((response) => {
    if (response.status === 401 || response.status === 403) {
      notifyAdminSessionExpired();
    }
    return response;
  });

  if (key) {
    inFlightRequests.set(key, { createdAt: now, promise });
    promise.then(
      () => {
        const current = inFlightRequests.get(key);
        if (current?.promise === promise) {
          inFlightRequests.delete(key);
        }
      },
      () => {
        const current = inFlightRequests.get(key);
        if (current?.promise === promise) {
          inFlightRequests.delete(key);
        }
      }
    );
    return promise.then((response) => response.clone());
  }

  return promise;
}
